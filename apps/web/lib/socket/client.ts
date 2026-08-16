"use client";

import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@twilight/shared-types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socketInstance) {
    const url =
      process.env.NEXT_PUBLIC_REALTIME_URL || "http://localhost:3001";

    socketInstance = io(url, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketInstance.on("connect", () => {
      console.log("[Socket] Connected to realtime server with id:", socketInstance?.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });
  }

  return socketInstance;
}

export function connectSocket(): TypedSocket {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
