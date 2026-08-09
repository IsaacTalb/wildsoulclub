import type { NextConfig } from "next";

const r2PublicBaseUrl = (
  process.env.R2_PUBLIC_BASE_URL ?? "https://images.wildsoulclub.com"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL(`${r2PublicBaseUrl}/**`)],
    // R2 keys are UUID-versioned, so optimized variants can be retained safely.
    minimumCacheTTL: 2_678_400,
  },
};

export default nextConfig;
