import type { RoomState } from "@twilight/shared-types";
import {
  getJson,
  keys,
  refreshTtl,
  ROOM_TTL_SECONDS,
  setJson,
  setJsonIfAbsent,
} from "../redis/client";

export const playerChannel = (roomId: string, playerId: string) =>
  `room:${roomId}:player:${playerId}`;

export async function loadRoom(roomId: string): Promise<RoomState | null> {
  return getJson<RoomState>(keys.room(roomId));
}

export async function saveRoom(room: RoomState): Promise<void> {
  room.expiresAt = new Date(Date.now() + ROOM_TTL_SECONDS * 1000).toISOString();
  await setJson(keys.room(room.roomId), room, ROOM_TTL_SECONDS);
  await setJson(keys.roomByCode(room.roomId), { roomId: room.roomId }, ROOM_TTL_SECONDS);
  await setJson(keys.roomByToken(room.inviteToken), { roomId: room.roomId }, ROOM_TTL_SECONDS);
  const tokens = (await getJson<string[]>(keys.roomSessions(room.roomId))) ?? [];
  if (tokens.length) await refreshTtl(keys.roomSessions(room.roomId), ROOM_TTL_SECONDS);
  await Promise.all(tokens.map((token) => refreshTtl(keys.session(token), ROOM_TTL_SECONDS)));
  if (room.status === "active" && ["answering", "locked"].includes(room.turn.phase)) {
    await Promise.all([
      refreshTtl(keys.turnQuestion(room.roomId), ROOM_TTL_SECONDS),
      refreshTtl(keys.turnDraft(room.roomId), ROOM_TTL_SECONDS),
    ]);
  }
}

/** Refresh a room TTL for sustained typing without rewriting the room per keystroke. */
export async function touchRoom(room: RoomState): Promise<void> {
  const shouldTouch = await setJsonIfAbsent(
    keys.roomActivityThrottle(room.roomId),
    true,
    5 * 60
  );
  if (shouldTouch) await saveRoom(room);
}
