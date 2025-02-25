/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'cdn.shopify.com',
      'example.com',
      // any other domains you need
    ],
  },
  // Any other configuration options you have
};

module.exports = nextConfig;
