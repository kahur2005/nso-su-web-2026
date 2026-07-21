import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions default to a 1MB request body limit (see
  // node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md:26).
  // Admin club/committee forms upload real photos (2-5MB phone photos), so raise
  // it. Still under `experimental` in Next 16.2.9 per that doc's example.
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
};

export default nextConfig;
