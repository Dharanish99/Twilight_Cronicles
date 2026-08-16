"use client";

import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@twilight/shared-types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: TypedSocket | null = null;
let listenersInitialized = false;

export function getSocket(): TypedSocket {
  if (!socketInstance) {
    let url = process.env.NEXT_PUBLIC_REALTIME_URL;

    if (!url) {
      if (typeof window !== "undefined") {
        const isLocal =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        // On localhost connect directly to 3001, on ngrok/remote connect to same origin via proxy
        url = isLocal ? "http://localhost:3001" : window.location.origin;
      } else {
        url = "http://localhost:3001";
      }
    }

    socketInstance = io(url, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["polling", "websocket"],
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
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    listenersInitialized = false;
  }
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
