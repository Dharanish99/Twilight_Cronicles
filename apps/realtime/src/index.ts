import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "@twilight/shared-types";
import { redisClient } from "./redis/client";
import { registerRoomHandlers } from "./rooms/handlers";
import { registerTurnHandlers } from "./turns/handlers";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";

const app = express();
app.use(cors({ origin: WEB_ORIGIN, credentials: true }));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "twilight-realtime", ts: Date.now() });
});

const httpServer = createServer(app);

export const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
  pingTimeout: 20000,
  pingInterval: 10000,
});

io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on("ping", () => {
    socket.emit("pong");
  });

  registerRoomHandlers(io, socket);
  registerTurnHandlers(io, socket);

  socket.on("disconnect", (reason) => {
    console.log(`[socket] disconnected: ${socket.id} (${reason})`);
  });
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  await redisClient.quit();
  httpServer.close(() => process.exit(0));
});

httpServer.listen(PORT, () => {
  console.log(
    `[twilight-realtime] Server listening on port ${PORT} (web origin: ${WEB_ORIGIN})`
  );
});
