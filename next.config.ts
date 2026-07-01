import path from 'path';
import { fileURLToPath } from 'url';
import type { NextConfig } from 'next';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  allowedDevOrigins: ['192.168.0.9', '172.17.0.9', 'localhost'],
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'm.nutrifarmer.kr', pathname: '/**' },
      { protocol: 'https', hostname: 'www.nutrifarmer.kr', pathname: '/**' },
      { protocol: 'https', hostname: 'nutrifarmer.kr', pathname: '/**' },
      { protocol: 'https', hostname: 'media.nutrifarmer.kr', pathname: '/**' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com', pathname: '/**' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
