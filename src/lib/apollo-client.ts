import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  fromPromise,
  NormalizedCacheObject,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

// ── Token refresh ──────────────────────────────────────────────────────────
let isRefreshing = false;
let pendingCallbacks: Array<(token: string | null) => void> = [];

function dispatchEvent(name: 'auth:logout' | 'auth:token-refreshed') {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(name));
}

async function doRefresh(): Promise<string | null> {
  const rt = sessionStorage.getItem('refreshToken');
  if (!rt) return null;
  try {
    const res = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) { accessToken refreshToken }
        }`,
        variables: { refreshToken: rt },
      }),
    });
    const json = await res.json();
    if (json.errors || !json.data?.refreshToken) return null;
    const { accessToken, refreshToken: newRt } = json.data.refreshToken;
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', newRt);
    dispatchEvent('auth:token-refreshed');
    return accessToken as string;
  } catch {
    return null;
  }
}

function createClient(): ApolloClient<NormalizedCacheObject> {
  const httpLink = createHttpLink({
    uri: typeof window !== 'undefined'
      ? '/graphql'
      : (process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/graphql'),
  });

  const authLink = setContext((_, { headers }) => {
    const token =
      typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
    return {
      headers: {
        ...headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    const isUnauthenticated = graphQLErrors?.some(
      (e) => e.extensions?.code === 'UNAUTHENTICATED' || e.message?.toLowerCase().includes('unauthenticated')
    );

    const isNotFound = graphQLErrors?.some(
      (e) =>
        e.extensions?.code === 'NOT_FOUND' ||
        e.message?.toLowerCase().includes('not found') ||
        e.message?.toLowerCase().includes('notfound')
    );

    const isForbidden = graphQLErrors?.some(
      (e) =>
        e.extensions?.code === 'FORBIDDEN' ||
        e.message?.toLowerCase().includes('permission denied') ||
        e.message?.toLowerCase().includes('access denied')
    );

    // Only trigger global 404 page for queries that explicitly opt-in.
    // FORBIDDEN is treated as 404 to avoid leaking information about private repos.
    const { triggerNotFoundOn404 } = operation.getContext();
    if ((isNotFound || isForbidden) && triggerNotFoundOn404 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('gyt:notfound'));
      return;
    }

    if (isUnauthenticated && typeof window !== 'undefined') {
      const hasSession = !!(sessionStorage.getItem('accessToken') || sessionStorage.getItem('refreshToken'));
      if (!hasSession) {
        // Pure guest browsing public content — no session to restore
        return;
      }
      if (!sessionStorage.getItem('refreshToken')) {
        dispatchEvent('auth:logout');
        return;
      }

      if (isRefreshing) {
        // Queue this operation until the in-flight refresh resolves
        return fromPromise(
          new Promise<string | null>((resolve) => pendingCallbacks.push(resolve))
        ).flatMap((newToken) => {
          if (!newToken) return forward(operation);
          operation.setContext(({ headers = {} }) => ({
            headers: { ...headers, authorization: `Bearer ${newToken}` },
          }));
          return forward(operation);
        });
      }

      isRefreshing = true;
      return fromPromise(
        doRefresh().then((newToken) => {
          isRefreshing = false;
          pendingCallbacks.forEach((cb) => cb(newToken));
          pendingCallbacks = [];
          if (!newToken) dispatchEvent('auth:logout');
          return newToken;
        })
      ).flatMap((newToken) => {
        if (!newToken) return forward(operation);
        operation.setContext(({ headers = {} }) => ({
          headers: { ...headers, authorization: `Bearer ${newToken}` },
        }));
        return forward(operation);
      });
    }

    if (graphQLErrors) {
      graphQLErrors.forEach(({ message }) => console.error(`[GraphQL error]: ${message}`));
    }
    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
    }
  });

  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  });
}

export function getApolloClient(): ApolloClient<NormalizedCacheObject> {
  if (typeof window === 'undefined') {
    return createClient();
  }
  if (!apolloClient) {
    apolloClient = createClient();
  }
  return apolloClient;
}

export function resetApolloClient(): void {
  apolloClient = null;
}
