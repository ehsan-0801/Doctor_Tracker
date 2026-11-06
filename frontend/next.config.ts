import type { NextConfig } from "next";

// Express API origin. The browser always calls same-origin `/api/*`; Next.js
// proxies those requests so the session cookie stays first-party (no CORS).
// Trailing slashes are stripped so "https://api.example.com/" also works.
const apiUrl = (process.env.API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // The end-to-end suite builds into its own folder so it never overwrites the normal build.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
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
