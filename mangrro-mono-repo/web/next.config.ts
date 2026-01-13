import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "delivery-star-bucket.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com", 
      },
    ],
    localPatterns: [
      {
        pathname: "/api/image-proxy",
      },
      {
        pathname: "/brand.png",
      },
      {
        pathname: "/**",  // <- BEST FIX: allows ALL public folder assets
      },
    ],
  },

};

export default nextConfig;
