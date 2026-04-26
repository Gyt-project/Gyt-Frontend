'use client';

import { ApolloProvider, useQuery } from '@apollo/client';
import { getApolloClient } from '@/lib/apollo-client';
import { GET_CURRENT_USER } from '@/graphql/queries';
import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NotFound from '@/app/not-found';

/** Validates the stored session against the backend on mount.
 *  If the user no longer exists (deleted DB, wiped tokens, etc.)
 *  the Apollo error link will catch the error and dispatch auth:logout. */
function SessionValidator() {
  const hasSession = typeof window !== 'undefined' &&
    !!(sessionStorage.getItem('accessToken') || sessionStorage.getItem('refreshToken'));

  useQuery(GET_CURRENT_USER, {
    skip: !hasSession,
    fetchPolicy: 'network-only',
  });

  return null;
}

export function ApolloWrapper({ children }: { children: ReactNode }) {
  const client = getApolloClient();
  const [isNotFound, setIsNotFound] = useState(false);
  const pathname = usePathname();

  // Clear the 404 overlay whenever the route changes
  useEffect(() => {
    setIsNotFound(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => setIsNotFound(true);
    window.addEventListener('gyt:notfound', handler);
    return () => window.removeEventListener('gyt:notfound', handler);
  }, []);

  return (
    <ApolloProvider client={client}>
      <SessionValidator />
      {isNotFound ? <NotFound /> : children}
    </ApolloProvider>
  );
}
