import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['source.unsplash.com', 'images.unsplash.com', 'storage.googleapis.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '**',
      }
    ],
  }
};

export default nextConfig;
