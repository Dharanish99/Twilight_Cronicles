import Redis from "ioredis";
import { createHash, randomBytes } from "crypto";

const REDIS_URL = process.env.REDIS_URL;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const redisClient = new Redis(REDIS_URL ?? "redis://localhost:6379", {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (!IS_PRODUCTION && times > 5) return null;
    return Math.min(200 * 2 ** (times - 1), 10000);
  },
});

export let redisPubClient: Redis | null = null;
export let redisSubClient: Redis | null = null;

redisClient.on("connect", () => console.log("[redis] Connected"));
redisClient.on("error", (err) => console.warn("[redis] Connection error:", err.message));

// Key patterns
export const keys = {
  room: (roomId: string) => `room:${roomId}`,
  roomByCode: (code: string) => `room_code:${code.toUpperCase()}`,
  roomByToken: (token: string) => `room_token:${token}`,
  session: (token: string) => `session:${token}`,
  roomSessions: (roomId: string) => `room_sessions:${roomId}`,
  roomActivityThrottle: (roomId: string) => `room_activity_throttle:${roomId}`,
  turnDraft: (sessionId: string) => `turn_draft:${sessionId}`,
  turnQuestion: (sessionId: string) => `turn_question:${sessionId}`,
  doodleGallery: (roomId: string) => `doodle:gallery:${roomId}`,
  usedQuestions: (sessionId: string) => `used_questions:${sessionId}`,
  questionReports: "question:reports",
  roomLock: (roomId: string) => `room_lock:${roomId}`,
  rateLimit: (ip: string, action: string) => `ratelimit:${action}:${ip}`,
};

export const ROOM_TTL_SECONDS = 86400;
export const TURN_DRAFT_TTL_SECONDS = ROOM_TTL_SECONDS;

const memoryStore = new Map<string, { value: string; expiresAt?: number }>();
const localRoomQueues = new Map<string, Promise<void>>();
const memoryRateLimits = new Map<string, { count: number; expiresAt: number }>();

function memoryGet(key: string): string | null {
  const item = memoryStore.get(key);
  if (!item || (item.expiresAt && Date.now() > item.expiresAt)) {
    memoryStore.delete(key);
    return null;
  }
  return item.value;
}

function assertStorageAvailable(): void {
  if (IS_PRODUCTION) {
    throw new Error("Redis is required for production room state");
  }
}

/** Connect Redis before accepting traffic. Production intentionally fails closed. */
export async function connectRedis(): Promise<boolean> {
  if (!REDIS_URL && IS_PRODUCTION) {
    throw new Error("REDIS_URL must be configured in production");
  }

  try {
    if (redisClient.status === "wait") await redisClient.connect();
    if (redisClient.status !== "ready") throw new Error(`Redis status is ${redisClient.status}`);

    redisPubClient = redisClient.duplicate();
    redisSubClient = redisClient.duplicate();
    await Promise.all([redisPubClient.connect(), redisSubClient.connect()]);
    console.log("[redis] Socket.IO pub/sub clients ready");
    return true;
  } catch (error) {
    if (IS_PRODUCTION) throw error;
    console.warn("[redis] Unavailable; using local in-memory storage for development");
    redisClient.disconnect();
    redisPubClient?.disconnect();
    redisSubClient?.disconnect();
    redisPubClient = null;
    redisSubClient = null;
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  const clients = [redisClient, redisPubClient, redisSubClient].filter(
    (client): client is Redis => Boolean(client)
  );
  await Promise.all(
    clients.map(async (client) => {
      if (client.status === "ready") await client.quit();
      else client.disconnect();
    })
  );
}

export async function setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const json = JSON.stringify(value);
  if (redisClient.status === "ready") {
    try {
      if (ttlSeconds) await redisClient.setex(key, ttlSeconds, json);
      else await redisClient.set(key, json);
      return;
    } catch (error) {
      assertStorageAvailable();
      console.warn("[redis] Write failed; using development memory storage");
    }
  } else {
    assertStorageAvailable();
  }

  memoryStore.set(key, {
    value: json,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
  });
}

export async function setJsonIfAbsent<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<boolean> {
  const json = JSON.stringify(value);
  if (redisClient.status === "ready") {
    const result = await redisClient.set(key, json, "EX", ttlSeconds, "NX");
    return result === "OK";
  }
  assertStorageAvailable();
  if (memoryGet(key) !== null) return false;
  memoryStore.set(key, { value: json, expiresAt: Date.now() + ttlSeconds * 1000 });
  return true;
}

export async function getJson<T>(key: string): Promise<T | null> {
  if (redisClient.status === "ready") {
    try {
      const data = await redisClient.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (error) {
      assertStorageAvailable();
      console.warn("[redis] Read failed; using development memory storage");
    }
  } else {
    assertStorageAvailable();
  }

  const value = memoryGet(key);
  return value === null ? null : (JSON.parse(value) as T);
}

export async function deleteKey(key: string): Promise<void> {
  if (redisClient.status === "ready") {
    try {
      await redisClient.del(key);
    } catch {
      assertStorageAvailable();
    }
  } else {
    assertStorageAvailable();
  }
  memoryStore.delete(key);
}

export async function refreshTtl(key: string, ttlSeconds: number): Promise<void> {
  if (redisClient.status === "ready") {
    try {
      await redisClient.expire(key, ttlSeconds);
    } catch {
      assertStorageAvailable();
    }
  } else {
    assertStorageAvailable();
  }
  const item = memoryStore.get(key);
  if (item) item.expiresAt = Date.now() + ttlSeconds * 1000;
}

export async function consumeRateLimit(
  ipAddress: string,
  action: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const ipHash = createHash("sha256").update(ipAddress || "unknown").digest("hex");
  const key = keys.rateLimit(ipHash, action);
  if (redisClient.status === "ready") {
    const count = await redisClient.eval(
      "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return count",
      1,
      key,
      String(windowSeconds)
    );
    return Number(count) <= maxRequests;
  }
  assertStorageAvailable();

  const now = Date.now();
  const current = memoryRateLimits.get(key);
  if (!current || current.expiresAt <= now) {
    memoryRateLimits.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return true;
  }
  current.count += 1;
  return current.count <= maxRequests;
}

/** Serialize room transitions across realtime replicas (and async handlers locally). */
export async function withRoomLock<T>(roomId: string, task: () => Promise<T>): Promise<T> {
  const prior = localRoomQueues.get(roomId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = prior.then(() => gate);
  localRoomQueues.set(roomId, tail);
  await prior;

  try {
    if (redisClient.status !== "ready") {
      assertStorageAvailable();
      return await task();
    }

    const lockKey = keys.roomLock(roomId);
    const token = randomBytes(16).toString("hex");
    const timeoutAt = Date.now() + 15000;
    while (Date.now() < timeoutAt) {
      const acquired = await redisClient.set(lockKey, token, "PX", 30000, "NX");
      if (acquired === "OK") {
        try {
          return await task();
        } finally {
          await redisClient.eval(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            1,
            lockKey,
            token
          );
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error("Room is busy; please try again");
  } finally {
    release();
    if (localRoomQueues.get(roomId) === tail) localRoomQueues.delete(roomId);
  }
}
