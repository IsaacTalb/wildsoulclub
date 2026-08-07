import type { NextConfig } from "next";

const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
const r2RemotePattern = r2PublicBaseUrl
  ? new URL(`${r2PublicBaseUrl.replace(/\/$/, "")}/**`)
  : {
      protocol: "https" as const,
      hostname: "*.r2.dev",
      port: "",
      pathname: "/**",
      search: "",
    };

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [r2RemotePattern],
    // R2 keys are UUID-versioned, so optimized variants can be retained safely.
    minimumCacheTTL: 2_678_400,
  },
};

export default nextConfig;
