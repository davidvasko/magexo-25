'use client';

import { ApolloProvider } from '@apollo/client';
import { shopifyClient } from '../lib/shopify';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={shopifyClient}>
      {children}
    </ApolloProvider>
  );
}