import { randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import type { Server, Socket } from "socket.io";
import type {
  AvatarId,
  CategoryId,
  ClientToServerEvents,
  InterServerEvents,
  PlayerState,
  RoomSettings,
  RoomState,
  ServerToClientEvents,
  SocketData,
} from "@twilight/shared-types";
import {
  deleteKey,
  consumeRateLimit,
  getJson,
  keys,
  ROOM_TTL_SECONDS,
  setJson,
  setJsonIfAbsent,
  TURN_DRAFT_TTL_SECONDS,
  withRoomLock,
} from "../redis/client";
import { loadRoom, playerChannel, saveRoom } from "./state";
import { resumeCoinTossAdvance } from "../turns/schedule";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const ROOM_CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const AVATAR_IDS: AvatarId[] = ["ember", "dusk", "stone", "sage", "plum", "gold", "slate", "rose"];
const RELATIONSHIPS = ["friends", "more_than_friends", "just_meeting"] as const;
const ROUND_OPTIONS = [6, 10, 15, 20];
const TIMER_OPTIONS = [60, 90, 120];
const RECONNECT_GRACE_MS = 30000;
const TRUST_PROXY = process.env.TRUST_PROXY === "true";
const graceTimers = new Map<string, ReturnType<typeof setTimeout>>();

interface SessionLocation {
  roomId: string;
  playerId: string;
}

function roomCode(): string {
  const bytes = randomBytes(6);
  return Array.from(bytes, (byte) => ROOM_CODE_CHARS[byte % ROOM_CODE_CHARS.length]).join("");
}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

function clientAddress(socket: AppSocket): string {
  if (TRUST_PROXY) {
    const forwarded = socket.handshake.headers["x-forwarded-for"];
    const firstAddress = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      ?.split(",")[0]
      ?.trim();
    if (firstAddress) return firstAddress;
  }
  return socket.handshake.address || "unknown";
}

function isAvatar(value: unknown): value is AvatarId {
  return typeof value === "string" && AVATAR_IDS.includes(value as AvatarId);
}

function isRelationship(value: unknown): value is (typeof RELATIONSHIPS)[number] {
  return typeof value === "string" && RELATIONSHIPS.includes(value as (typeof RELATIONSHIPS)[number]);
}

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/[\u0000-\u001F\u007F]/g, "");
  return name.length > 0 && name.length <= 24 ? name : null;
}

function validSettings(input: RoomSettings): boolean {
  const allowedCategories = new Set<CategoryId>([
    "deep", "playful", "emotional", "curious", "memories", "future", "chaotic",
    "wouldYouRather", "friendship", "gettingToKnowYou",
  ]);
  return Boolean(
    input &&
      ROUND_OPTIONS.includes(input.rounds) &&
      ["gentle", "balanced", "deep"].includes(input.intensityCeiling) &&
      Array.isArray(input.categories) &&
      input.categories.length >= 2 &&
      input.categories.length <= allowedCategories.size &&
      input.categories.every((category) => allowedCategories.has(category)) &&
      new Set(input.categories).size === input.categories.length &&
      (input.timerSeconds === null || TIMER_OPTIONS.includes(input.timerSeconds))
  );
}

function clearGraceTimer(roomId: string, playerId: string): void {
  const key = `${roomId}:${playerId}`;
  const timer = graceTimers.get(key);
  if (timer) clearTimeout(timer);
  graceTimers.delete(key);
}

function clearSocketIdentity(socket: AppSocket): void {
  socket.data = { playerId: "", roomId: "", sessionToken: "" };
}

async function markPlayerLeft(io: AppServer, roomId: string, playerId: string): Promise<void> {
  clearGraceTimer(roomId, playerId);
  await withRoomLock(roomId, async () => {
    const activeSockets = await io.in(playerChannel(roomId, playerId)).fetchSockets();
    if (activeSockets.length > 0) return;
    const room = await loadRoom(roomId);
    if (!room) return;
    const player = room.players.find((candidate) => candidate?.id === playerId);
    if (!player || player.connection === "disconnected") return;

    player.connection = "disconnected";
    if (room.status === "waiting") {
      const playerIndex = room.players.findIndex((candidate) => candidate?.id === playerId);
      if (playerIndex === 1) {
        room.players = [room.players[0], undefined];
      } else if (playerIndex === 0) {
        room.status = "expired";
      }
    }
    await saveRoom(room);
    io.to(roomId).emit("player:left", { playerId, displayName: player.displayName });
    io.to(roomId).emit("room:state_snapshot", room);
  });
}

/** Leave any previous room before this socket attaches to a new player identity. */
async function releaseCurrentRoom(io: AppServer, socket: AppSocket): Promise<void> {
  const { roomId, playerId, sessionToken } = socket.data;
  if (!roomId || !playerId) return;
  await socket.leave(roomId);
  await socket.leave(playerChannel(roomId, playerId));
  const remainingSockets = await io.in(playerChannel(roomId, playerId)).fetchSockets();
  if (remainingSockets.length === 0) {
    await markPlayerLeft(io, roomId, playerId);
    if (sessionToken) await deleteKey(keys.session(sessionToken));
  }
  clearSocketIdentity(socket);
}

async function attachPlayerSocket(
  io: AppServer,
  socket: AppSocket,
  room: RoomState,
  player: PlayerState,
  sessionToken: string,
  isResume: boolean
): Promise<void> {
  if (socket.data.roomId && (socket.data.roomId !== room.roomId || socket.data.playerId !== player.id)) {
    await releaseCurrentRoom(io, socket);
  }

  const wasDisconnected = player.connection !== "connected";
  player.connection = "connected";
  await saveRoom(room);
  await setJson(keys.session(sessionToken), { roomId: room.roomId, playerId: player.id }, ROOM_TTL_SECONDS);

  socket.data = { playerId: player.id, roomId: room.roomId, sessionToken };
  await socket.join(room.roomId);
  await socket.join(playerChannel(room.roomId, player.id));
  clearGraceTimer(room.roomId, player.id);

  socket.emit("room:identity", { playerId: player.id, sessionToken, roomId: room.roomId });
  if (wasDisconnected && isResume) {
    io.to(room.roomId).emit("player:reconnected", { playerId: player.id });
  }
  socket.emit("room:state_snapshot", room);

  if (isResume) {
    const { turn } = room;
    if (
      turn.answererPlayerId === player.id &&
      (turn.phase === "answering" || turn.phase === "locked")
    ) {
      const question = await getJson<{
        id: string;
        text: string;
        category: CategoryId;
        intensity: number;
        followUpPrompt?: string;
        estimatedAnswerSeconds: number;
      }>(keys.turnQuestion(room.roomId));
      if (question) {
        socket.emit("turn:question_ready", {
          questionId: question.id,
          text: question.text,
          category: question.category,
          intensity: question.intensity,
          followUpPrompt: question.followUpPrompt,
          estimatedAnswerSeconds: question.estimatedAnswerSeconds,
        });
        const draft = await getJson<{ text: string; playerId: string }>(keys.turnDraft(room.roomId));
        socket.emit("turn:answer_draft_restored", {
          text: draft?.playerId === player.id ? draft.text : "",
        });
        if (turn.phase === "locked") socket.emit("turn:answer_locked");
      }
    }

    const gallery = (await getJson<import("@twilight/shared-types").DoodleEntry[]>(keys.doodleGallery(room.roomId))) ?? [];
    socket.emit("room:doodle_gallery_snapshot", gallery);
    socket.emit("room:resumed");
  }
}

function schedulePlayerLeft(io: AppServer, roomId: string, playerId: string): void {
  clearGraceTimer(roomId, playerId);
  const timerKey = `${roomId}:${playerId}`;
  const timer = setTimeout(async () => {
    graceTimers.delete(timerKey);
    try {
      const sockets = await io.in(playerChannel(roomId, playerId)).fetchSockets();
      if (sockets.length === 0) await markPlayerLeft(io, roomId, playerId);
    } catch (error) {
      console.error("[disconnect] Grace-period check failed:", error);
    }
  }, RECONNECT_GRACE_MS);
  graceTimers.set(timerKey, timer);
}

export function registerRoomHandlers(io: AppServer, socket: AppSocket): void {
  socket.on("room:create", async (payload) => {
    try {
      if (!await consumeRateLimit(clientAddress(socket), "create", 12, 60)) {
        socket.emit("error:generic", { reason: "Too many rooms were created from this connection. Please wait a minute." });
        return;
      }
      const name = cleanName(payload?.displayName);
      if (!name || !isAvatar(payload.avatar) || !validSettings(payload.settings)) {
        socket.emit("error:generic", { reason: "Check your name, avatar, and game settings." });
        return;
      }
      await releaseCurrentRoom(io, socket);

      const inviteToken = randomHex(24);
      const sessionToken = randomHex(32);
      const playerId = uuidv4();
      const player: PlayerState = {
        id: playerId,
        displayName: name,
        avatar: payload.avatar,
        relationshipTypeShared: isRelationship(payload.relationshipType)
          ? payload.relationshipType
          : undefined,
        connection: "connected",
        ready: false,
      };

      let id = "";
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const candidate = roomCode();
        if (await setJsonIfAbsent(keys.roomByCode(candidate), { roomId: candidate }, ROOM_TTL_SECONDS)) {
          id = candidate;
          break;
        }
      }
      if (!id) throw new Error("Could not reserve a room code");

      const room: RoomState = {
        roomId: id,
        inviteToken,
        status: "waiting",
        settings: {
          ...payload.settings,
          categories: [...payload.settings.categories],
        },
        players: [player],
        turn: {
          activePlayerId: playerId,
          pickerPlayerId: playerId,
          answererPlayerId: "",
          round: 1,
          phase: "choosing_category",
          skipsThisTurn: 0,
        },
        usedCategories: [],
        sharedAnswer: null,
        expiresAt: new Date(Date.now() + ROOM_TTL_SECONDS * 1000).toISOString(),
      };

      try {
        await saveRoom(room);
        await setJson(keys.roomByToken(inviteToken), { roomId: id }, ROOM_TTL_SECONDS);
        await setJson(keys.session(sessionToken), { roomId: id, playerId }, ROOM_TTL_SECONDS);
        await setJson(keys.roomSessions(id), [sessionToken], ROOM_TTL_SECONDS);
      } catch (error) {
        await deleteKey(keys.roomByCode(id));
        throw error;
      }

      socket.data = { playerId, roomId: id, sessionToken };
      await socket.join(id);
      await socket.join(playerChannel(id, playerId));
      socket.emit("room:identity", { playerId, sessionToken, roomId: id });
      socket.emit("room:state_snapshot", room);
      console.log(`[room:create] Room ${id} created`);
    } catch (error) {
      console.error("[room:create] Failed:", error);
      socket.emit("error:generic", { reason: "We couldn't create that room. Please try again." });
    }
  });

  socket.on("room:join", async (payload) => {
    try {
      if (!await consumeRateLimit(clientAddress(socket), "join", 30, 60)) {
        socket.emit("error:invalid_room", { reason: "Too many join attempts. Please wait a minute." });
        return;
      }
      const name = cleanName(payload?.displayName);
      if (!name || !isAvatar(payload.avatar) || (payload.relationshipType && !isRelationship(payload.relationshipType))) {
        socket.emit("error:generic", { reason: "Check your name and avatar, then try again." });
        return;
      }

      let targetRoomId = "";
      if (payload.roomCode) {
        const code = payload.roomCode.trim().toUpperCase();
        if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(code)) {
          socket.emit("error:invalid_room", { reason: "Enter a valid six-character room code." });
          return;
        }
        targetRoomId = code;
      } else if (payload.inviteToken && /^[a-f0-9]{48}$/i.test(payload.inviteToken)) {
        const tokenMapping = await getJson<{ roomId: string }>(keys.roomByToken(payload.inviteToken));
        targetRoomId = tokenMapping?.roomId ?? "";
      }

      if (!targetRoomId) {
        socket.emit("error:invalid_room", { reason: "That room code or invite link isn't valid." });
        return;
      }

      const availableRoom = await loadRoom(targetRoomId);
      if (!availableRoom || availableRoom.status !== "waiting") {
        socket.emit("error:invalid_room", { reason: "That room is no longer waiting for a player." });
        return;
      }
      if (availableRoom.players[1]) {
        socket.emit("error:room_full", { reason: "This room already has two players." });
        return;
      }
      await releaseCurrentRoom(io, socket);

      const joined = await withRoomLock(targetRoomId, async () => {
        const room = await loadRoom(targetRoomId);
        if (!room || room.status !== "waiting") return { error: "invalid" as const };
        if (room.players[1]) return { error: "full" as const };

        const guestId = uuidv4();
        const guest: PlayerState = {
          id: guestId,
          displayName: name,
          avatar: payload.avatar,
          relationshipTypeShared: payload.relationshipType,
          connection: "connected",
          ready: false,
        };
        room.players = [room.players[0], guest];
        const sessionToken = randomHex(32);
        await saveRoom(room);
        await setJson(keys.session(sessionToken), { roomId: targetRoomId, playerId: guestId }, ROOM_TTL_SECONDS);
        const sessions = (await getJson<string[]>(keys.roomSessions(targetRoomId))) ?? [];
        await setJson(keys.roomSessions(targetRoomId), [...sessions, sessionToken], ROOM_TTL_SECONDS);
        return { room, guest, sessionToken };
      });

      if ("error" in joined) {
        socket.emit(
          joined.error === "full" ? "error:room_full" : "error:invalid_room",
          { reason: joined.error === "full" ? "This room already has two players." : "That room is no longer waiting for a player." }
        );
        return;
      }

      socket.data = { playerId: joined.guest.id, roomId: targetRoomId, sessionToken: joined.sessionToken };
      await socket.join(targetRoomId);
      await socket.join(playerChannel(targetRoomId, joined.guest.id));
      socket.emit("room:identity", {
        playerId: joined.guest.id,
        sessionToken: joined.sessionToken,
        roomId: targetRoomId,
      });
      socket.to(targetRoomId).emit("room:player_joined", { player: joined.guest });
      io.to(targetRoomId).emit("room:state_snapshot", joined.room);
      console.log(`[room:join] Player joined room ${targetRoomId}`);
    } catch (error) {
      console.error("[room:join] Failed:", error);
      socket.emit("error:generic", { reason: "We couldn't join that room. Please try again." });
    }
  });

  socket.on("room:resume", async (payload) => {
    try {
      if (!await consumeRateLimit(clientAddress(socket), "resume", 120, 60)) {
        socket.emit("error:generic", { reason: "Please wait before reconnecting again." });
        return;
      }
      const sessionToken = payload?.sessionToken;
      if (typeof sessionToken !== "string" || !/^[a-f0-9]{64}$/i.test(sessionToken)) {
        socket.emit("error:invalid_room", { reason: "Your room session has expired. Rejoin with the room code." });
        return;
      }

      const location = await getJson<SessionLocation>(keys.session(sessionToken));
      if (!location) {
        socket.emit("error:invalid_room", { reason: "Your room session has expired. Rejoin with the room code." });
        return;
      }

      if (socket.data.roomId !== location.roomId || socket.data.playerId !== location.playerId) {
        await releaseCurrentRoom(io, socket);
      }
      const resumed = await withRoomLock(location.roomId, async () => {
        const room = await loadRoom(location.roomId);
        const player = room?.players.find((candidate) => candidate?.id === location.playerId);
        if (!room || !player || room.status === "expired") return null;
        if (room.status === "active" && room.turn.phase === "question_loading") {
          room.turn.phase = "choosing_category";
          room.turn.chosenCategory = undefined;
          room.turn.answerDeadlineAt = null;
          await saveRoom(room);
        }
        await attachPlayerSocket(io, socket, room, player, sessionToken, true);
        return { room, player };
      });
      if (!resumed) {
        socket.emit("error:invalid_room", { reason: "That room has expired." });
        return;
      }

      resumeCoinTossAdvance(io, resumed.room);
      console.log(`[room:resume] Player resumed room ${location.roomId}`);
    } catch (error) {
      console.error("[room:resume] Failed:", error);
      socket.emit("error:generic", { reason: "We couldn't restore your room yet. Reconnecting…" });
    }
  });

  socket.on("room:ready", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;
    try {
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (!room || room.status !== "waiting" || !room.players[1]) return;
        const player = room.players.find((candidate) => candidate?.id === playerId);
        if (!player) return;
        player.ready = !player.ready;
        await saveRoom(room);
        io.to(roomId).emit("room:player_ready", { playerId, ready: player.ready });
        io.to(roomId).emit("room:state_snapshot", room);
      });
    } catch (error) {
      console.error("[room:ready] Failed:", error);
      socket.emit("error:generic", { reason: "We couldn't update your ready status." });
    }
  });

  socket.on("game:start", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;
    try {
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        const [p1, p2] = room?.players ?? [];
        if (!room || room.status !== "waiting") return;
        if (!p1 || !p2) {
          socket.emit("error:generic", { reason: "Both players need to join before the game can start." });
          return;
        }
        if (!room.players.some((player) => player?.id === playerId)) return;
        if (!p1.ready || !p2.ready || p1.connection !== "connected" || p2.connection !== "connected") {
          socket.emit("error:generic", { reason: "Both players need to be connected and ready." });
          return;
        }

        room.status = "active";
        room.startedAt = new Date().toISOString();
        room.usedCategories = [];
        room.sharedAnswer = null;
        room.turn = {
          activePlayerId: p1.id,
          pickerPlayerId: "",
          answererPlayerId: "",
          tosserPlayerId: p1.id,
          round: 1,
          phase: "coin_toss_waiting",
          skipsThisTurn: 0,
        };
        await saveRoom(room);
        io.to(roomId).emit("game:started", { firstActivePlayerId: p1.id });
        io.to(roomId).emit("room:state_snapshot", room);
        console.log(`[game:start] Room ${roomId} started`);
      });
    } catch (error) {
      console.error("[game:start] Failed:", error);
      socket.emit("error:generic", { reason: "We couldn't start the game. Please try again." });
    }
  });

  socket.on("room:leave", async () => {
    try {
      await releaseCurrentRoom(io, socket);
    } catch (error) {
      console.error("[room:leave] Failed:", error);
      clearSocketIdentity(socket);
    }
  });

  socket.on("disconnect", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;
    try {
      const sockets = await io.in(playerChannel(roomId, playerId)).fetchSockets();
      if (sockets.length > 0) return;

      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        const player = room?.players.find((candidate) => candidate?.id === playerId);
        if (!room || !player) return;
        player.connection = "reconnecting";
        await saveRoom(room);
        io.to(roomId).emit("player:disconnected", { playerId });
        io.to(roomId).emit("room:state_snapshot", room);
      });
      schedulePlayerLeft(io, roomId, playerId);
    } catch (error) {
      console.error("[disconnect] Failed:", error);
    }
  });
}
