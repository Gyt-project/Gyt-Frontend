import type { NextConfig } from 'next';

// Routing is handled entirely by HAProxy.
// NEXT_PUBLIC_GRAPHQL_URL  — baked at build time, used by Apollo Client in the browser.
// NEXT_PUBLIC_LIVE_API_URL — baked at build time, used for WebSocket/SSE base URL.
// No server-side rewrites needed.
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;
