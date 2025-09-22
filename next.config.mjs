import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  env: {
    // Map our custom env vars to Next.js public vars
    NEXT_PUBLIC_BASE_URL: process.env.DASHRR_BASE_URL,
    NEXT_PUBLIC_UNIFI_SITES: process.env.UNIFI_SITES,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
};

export default withMDX(config);
