import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/events", destination: "/trips", permanent: true },
      { source: "/events/:path*", destination: "/trips/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
