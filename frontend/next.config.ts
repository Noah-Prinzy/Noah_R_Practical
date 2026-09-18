import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The figures are already-sized PNGs exported by R; serve them as-is.
    unoptimized: true,
  },
};

export default nextConfig;
