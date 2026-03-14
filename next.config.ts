import type { NextConfig } from 'next';

const GRAPHQL_BACKEND = process.env.NEXT_PUBLIC_GRAPHQL_URL?.replace('/graphql', '') ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/graphql',
        destination: `${GRAPHQL_BACKEND}/graphql`,
      },
    ];
  },
};

export default nextConfig;
