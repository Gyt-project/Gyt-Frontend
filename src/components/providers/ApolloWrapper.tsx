'use client';

import { ApolloProvider } from '@apollo/client';
import { getApolloClient } from '@/lib/apollo-client';
import { ReactNode, useState, useEffect } from 'react';
import NotFound from '@/app/not-found';

export function ApolloWrapper({ children }: { children: ReactNode }) {
  const client = getApolloClient();
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    const handler = () => setIsNotFound(true);
    window.addEventListener('gyt:notfound', handler);
    return () => window.removeEventListener('gyt:notfound', handler);
  }, []);

  return (
    <ApolloProvider client={client}>
      {isNotFound ? <NotFound /> : children}
    </ApolloProvider>
  );
}
