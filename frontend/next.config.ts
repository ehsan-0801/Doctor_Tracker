import type { NextConfig } from "next";

// Express API origin. The browser always calls same-origin `/api/*`; Next.js
// proxies those requests so the session cookie stays first-party (no CORS).
const apiUrl = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Let phones/tablets on the local network load dev assets (e.g. http://192.168.1.3:3000).
  // Development only; production builds ignore this.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
