import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Cố định root monorepo để tránh nhận nhầm lockfile ngoài máy host
  outputFileTracingRoot: path.resolve(__dirname, '..'),
};

export default nextConfig;
