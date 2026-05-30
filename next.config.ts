import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mammoth", "puppeteer"],
  eslint: {
    // Skip running ESLint during `next build` to speed CI/builds.
    // Run linting as a separate step in CI if you want checks before deploy.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
