import path from 'path';
import { fileURLToPath } from 'url';
import type { NextConfig } from 'next';
import { APP_VERSION } from './lib/app-version';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  allowedDevOrigins: ['192.168.0.9', '172.17.0.9', 'localhost'],
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
  },
  generateBuildId: async () => {
    const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12);
    return sha ? `${APP_VERSION}-${sha}` : `${APP_VERSION}-${Date.now()}`;
  },
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
