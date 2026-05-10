import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/**",
      },
      {
        protocol: "https",
        hostname: "freedomhouse.org",
        pathname: "/themes/**",
      },
      {
        protocol: "https",
        hostname: "www.amnesty.org",
        pathname: "/en/wp-content/**",
      },
    ],
  },
};

export default nextConfig;
