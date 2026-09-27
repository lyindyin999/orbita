import type { NextConfig } from "next";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const basePath = isGitHubActions ? "/orbita" : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath,
};

export default nextConfig;
