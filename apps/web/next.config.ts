import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const realtimeUrl = process.env.INTERNAL_REALTIME_URL || "http://127.0.0.1:3001";
    return [
      {
        source: "/socket.io/:path*",
        destination: `${realtimeUrl}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
