import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Force Next.js to treat this directory as the workspace root.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
