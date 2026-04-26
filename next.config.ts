import type { NextConfig } from 'next';

const GRAPHQL_BACKEND = process.env.NEXT_PUBLIC_GRAPHQL_URL?.replace('/graphql', '') ?? 'http://localhost:8080';
const LIVE_BACKEND = process.env.NEXT_PUBLIC_LIVE_API_URL ?? 'http://localhost:8090';

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
      {
        source: '/ws/:path*',
        destination: `${GRAPHQL_BACKEND}/ws/:path*`,
      },
      {
        source: '/live/:path*',
        destination: `${LIVE_BACKEND}/live/:path*`,
      },
    ];
  },
};

export default nextConfig;
