import type { Server } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  RoomState,
  ServerToClientEvents,
  SocketData,
} from "@twilight/shared-types";
import { withRoomLock } from "../redis/client";
import { loadRoom, saveRoom } from "../rooms/state";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleCoinTossAdvance(io: AppServer, roomId: string, delayMs: number): void {
  const delay = Number.isFinite(delayMs) ? Math.max(0, Math.min(30000, delayMs)) : 0;
  const oldTimer = timers.get(roomId);
  if (oldTimer) clearTimeout(oldTimer);

  const timer = setTimeout(async () => {
    timers.delete(roomId);
    try {
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (!room || room.status !== "active" || room.turn.phase !== "coin_toss_flipping") return;

        const remaining = room.turn.phaseEndsAt ? Date.parse(room.turn.phaseEndsAt) - Date.now() : 0;
        if (remaining > 0) {
          scheduleCoinTossAdvance(io, roomId, remaining);
          return;
        }

        room.turn.phase = "choosing_category";
        room.turn.phaseEndsAt = null;
        await saveRoom(room);
        io.to(roomId).emit("turn:phase_update", { phase: "choosing_category" });
        io.to(roomId).emit("room:state_snapshot", room);
      });
    } catch (error) {
      console.error("[turn:flip_coin] Transition failed:", error);
    }
  }, delay);
  timers.set(roomId, timer);
}

export function resumeCoinTossAdvance(io: AppServer, room: RoomState): void {
  if (room.turn.phase !== "coin_toss_flipping") return;
  const delay = room.turn.phaseEndsAt ? Date.parse(room.turn.phaseEndsAt) - Date.now() : 0;
  scheduleCoinTossAdvance(io, room.roomId, delay);
}
