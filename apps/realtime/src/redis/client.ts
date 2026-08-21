import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redisClient = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) return null;
    return Math.min(times * 200, 2000);
  },
});

redisClient.on("connect", () => {
  console.log("[redis] Connected successfully");
});

redisClient.on("error", (err) => {
  console.warn("[redis] Redis warning/error (fallback in-memory mode active):", err.message);
});

// Key patterns
export const keys = {
  room: (roomId: string) => `room:${roomId}`,
  roomByCode: (code: string) => `room_code:${code.toUpperCase()}`,
  roomByToken: (token: string) => `room_token:${token}`,
  session: (token: string) => `session:${token}`,
  turnDraft: (sessionId: string) => `turn_draft:${sessionId}`,
  turnLocked: (sessionId: string) => `turn_locked:${sessionId}`,
  turnQuestion: (sessionId: string) => `turn_question:${sessionId}`,
  turnDoodle: (sessionId: string) => `turn_doodle:${sessionId}`,
  doodleGallery: (roomId: string) => `doodle:gallery:${roomId}`,
  usedQuestions: (sessionId: string) => `used_questions:${sessionId}`,
  rateLimit: (ip: string, action: string) => `ratelimit:${action}:${ip}`,
};

export const ROOM_TTL_SECONDS = 86400; // 24 hours
export const SESSION_TOKEN_TTL_SECONDS = 86400; // 24 hours
export const TURN_DRAFT_TTL_SECONDS = 3600; // 1 hour

// In-memory fallback map if Redis is not running locally during dev
const memoryStore = new Map<string, { value: string; expiresAt?: number }>();

function isMemoryExpired(item?: { value: string; expiresAt?: number }): boolean {
  if (!item) return true;
  if (!item.expiresAt) return false;
  return Date.now() > item.expiresAt;
}

export async function setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const json = JSON.stringify(value);
  try {
    if (redisClient.status === "ready") {
      if (ttlSeconds) {
        await redisClient.setex(key, ttlSeconds, json);
      } else {
        await redisClient.set(key, json);
      }
      return;
    }
  } catch {
    // fallback
  }

  memoryStore.set(key, {
    value: json,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
  });
}

export async function getJson<T>(key: string): Promise<T | null> {
  try {
    if (redisClient.status === "ready") {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    }
  } catch {
    // fallback
  }

  const mem = memoryStore.get(key);
  if (!mem || isMemoryExpired(mem)) {
    memoryStore.delete(key);
    return null;
  }
  return JSON.parse(mem.value) as T;
}

export async function deleteKey(key: string): Promise<void> {
  try {
    if (redisClient.status === "ready") {
      await redisClient.del(key);
    }
  } catch {
    // fallback
  }
  memoryStore.delete(key);
}

export async function refreshTtl(key: string, ttlSeconds: number): Promise<void> {
  try {
    if (redisClient.status === "ready") {
      await redisClient.expire(key, ttlSeconds);
    }
  } catch {
    // fallback
  }
  const mem = memoryStore.get(key);
  if (mem) {
    mem.expiresAt = Date.now() + ttlSeconds * 1000;
  }
}
