"use client";

import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@twilight/shared-types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: TypedSocket | null = null;
let listenersInitialized = false;
let resumeSocketId: string | null = null;

export function getSocket(): TypedSocket {
  if (!socketInstance) {
    let url = process.env.NEXT_PUBLIC_REALTIME_URL;

    if (!url) {
      if (typeof window !== "undefined") {
        const isLocal =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        // Local development can use the adjacent realtime service. Remote and
        // production builds must explicitly name a browser-reachable endpoint.
        if (isLocal) url = "http://localhost:3001";
        else throw new Error("NEXT_PUBLIC_REALTIME_URL must be configured for this site.");
      } else {
        url = "http://localhost:3001";
      }
    }

    socketInstance = io(url, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
      tryAllTransports: true,
      withCredentials: false,
    });

    socketInstance.on("connect", () => {
      resumeSocketId = null;
      console.log("[Socket] Connected to realtime server with id:", socketInstance?.id);
    });

    socketInstance.on("disconnect", (reason) => {
      resumeSocketId = null;
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
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    listenersInitialized = false;
    resumeSocketId = null;
  }
}

export function resumeSocketSession(sessionToken: string): void {
  const socket = connectSocket();
  if (!socket.connected || !socket.id || resumeSocketId === socket.id) return;
  resumeSocketId = socket.id;
  socket.emit("room:resume", { sessionToken });
}

/**
 * Returns true if game-event listeners have already been registered.
 * Call markListenersInitialized() after registering them once.
 */
export function areListenersInitialized(): boolean {
  return listenersInitialized;
}

export function markListenersInitialized(): void {
  listenersInitialized = true;
}
