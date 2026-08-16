import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow all ngrok tunnels, local network IPs, and custom dev origins
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
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
