import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@twilight/shared-types";
import { closeRedis, connectRedis, redisClient, redisPubClient, redisSubClient } from "./redis/client";
import { registerRoomHandlers } from "./rooms/handlers";
import { registerTurnHandlers } from "./turns/handlers";

const PORT = Number.parseInt(process.env.PORT ?? "3001", 10);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const ALLOWED_ORIGINS = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(ALLOWED_ORIGINS);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be a valid TCP port");
}
if (IS_PRODUCTION && (!process.env.WEB_ORIGIN || ALLOWED_ORIGINS.length === 0)) {
  throw new Error("WEB_ORIGIN must list the production web origin(s)");
}

const app = express();
app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed"));
  },
  credentials: true,
  maxAge: 600,
}));
app.use(express.json({ limit: "100kb" }));

app.get("/health/live", (_req, res) => {
  res.json({ status: "ok", service: "twilight-realtime" });
});

app.get("/health", (_req, res) => {
  const redisReady =
    redisClient.status === "ready" &&
    (!IS_PRODUCTION || (redisPubClient?.status === "ready" && redisSubClient?.status === "ready"));
  const status = redisReady ? "ok" : "degraded";
  res.status(IS_PRODUCTION && !redisReady ? 503 : 200).json({
    status,
    service: "twilight-realtime",
    storage: redisReady ? "redis" : "memory",
  });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof Error && error.message === "Origin is not allowed") {
    res.status(403).json({ error: "Origin is not allowed" });
    return;
  }
  res.status(400).json({ error: "Invalid request" });
});

const httpServer = createServer(app);
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout = 66000;

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowRequest(request, callback) {
    const origin = request.headers.origin;
    callback(null, !origin || allowedOrigins.has(origin));
  },
  maxHttpBufferSize: 500_000,
  pingTimeout: 20000,
  pingInterval: 10000,
  connectTimeout: 20000,
});

io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);
  registerRoomHandlers(io, socket);
  registerTurnHandlers(io, socket);
  socket.on("ping", () => socket.emit("pong"));
  socket.on("disconnect", (reason) => console.log(`[socket] disconnected: ${socket.id} (${reason})`));
});

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received; closing realtime service`);
  await new Promise<void>((resolve) => io.close(() => resolve()));
  await closeRedis();
}

process.on("SIGTERM", () => void shutdown("SIGTERM").finally(() => process.exit(0)));
process.on("SIGINT", () => void shutdown("SIGINT").finally(() => process.exit(0)));

async function start(): Promise<void> {
  const redisAvailable = await connectRedis();
  if (redisAvailable && redisPubClient && redisSubClient) {
    io.adapter(createAdapter(redisPubClient, redisSubClient));
  }

  httpServer.listen(PORT, () => {
    console.log(
      `[twilight-realtime] Listening on ${PORT}; allowed web origins: ${ALLOWED_ORIGINS.join(", ")}`
    );
  });
}

void start().catch(async (error) => {
  console.error("[server] Startup failed:", error);
  await closeRedis().catch(() => {});
  process.exitCode = 1;
});
