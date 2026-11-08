import type { NextConfig } from 'next';
import path from 'path';

const isBaristaDev =
  process.env.PORT === '3002' ||
  process.argv.includes('3002') ||
  process.env.BARISTA_DEV === 'true';

const nextConfig: NextConfig = {
  // Khi chạy port 3002, dùng thư mục cache riêng để không xung đột file manifest với port 3000
  distDir: isBaristaDev ? '.next-barista' : '.next',
  output: 'standalone',
  // Cố định root monorepo để tránh nhận nhầm lockfile ngoài máy host
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  // Chuyển tiếp route /health từ frontend (port 3000) sang backend (port 3001) để máy người dùng kiểm tra trực tiếp
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    return [
      {
        source: '/health',
        destination: `${apiUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
