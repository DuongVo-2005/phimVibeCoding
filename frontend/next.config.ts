import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Ảnh mock dùng nguyên văn từ design/homepage.html (Phase 10.2) — chỉ để dựng UI tĩnh khớp
    // thiết kế, chưa phải nguồn ảnh thật của dự án (sẽ thay khi có dữ liệu phim thật từ backend).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
