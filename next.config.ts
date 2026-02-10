import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "instagram.fres2-2.fna.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "cdn.instagram.com", // covering bases
      }
    ],
  },
};

export default nextConfig;
