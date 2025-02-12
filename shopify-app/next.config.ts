import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['swiper'],
  images: {
    domains: ['cdn.shopify.com', 'localhost', 'magexo-25.vercel.app'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
        pathname: '/uploads/**',
      }
    ]
  },
};

export default nextConfig;
