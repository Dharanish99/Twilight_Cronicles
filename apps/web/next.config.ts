import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production") {
  const realtimeUrl = process.env.NEXT_PUBLIC_REALTIME_URL;
  if (!realtimeUrl) {
    throw new Error("Set NEXT_PUBLIC_REALTIME_URL to a browser-reachable realtime service before building for production.");
  }
  try {
    const parsed = new URL(realtimeUrl);
    if (
      parsed.protocol !== "https:" ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash ||
      parsed.username ||
      parsed.password
    ) {
      throw new Error("Expected a public HTTPS origin without credentials or a path.");
    }
  } catch {
    throw new Error("NEXT_PUBLIC_REALTIME_URL must be a valid HTTPS origin (for example, https://realtime.example.com).");
  }
}

const nextConfig: NextConfig = {
  // Allow all ngrok tunnels, local network IPs, and custom dev origins
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
};

export default nextConfig;
