import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  images: {
    qualities: [75, 100],
  },
  reactStrictMode: true,
};

export default nextConfig;
