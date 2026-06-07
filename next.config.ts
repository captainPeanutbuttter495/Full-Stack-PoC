import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Emit a self-contained build (.next/standalone) for the Docker image.
  // Only affects `next build` output; `pnpm dev`/`pnpm start` are unchanged.
  output: "standalone",
};

export default nextConfig;
