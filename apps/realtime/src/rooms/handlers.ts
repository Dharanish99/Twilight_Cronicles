import { randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import type { Server, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  RoomState,
  PlayerState,
  AvatarId,
  CategoryId,
} from "@twilight/shared-types";
import {
  setJson,
  getJson,
  keys,
  ROOM_TTL_SECONDS,
} from "../redis/client";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

function generateRoomCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function generateInviteToken(): string {
  return randomBytes(24).toString("hex");
}

function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function registerRoomHandlers(io: AppServer, socket: AppSocket): void {
  // room:create
  socket.on("room:create", async ({ displayName, avatar, settings, relationshipType }) => {
    try {
      const roomId = generateRoomCode();
      const inviteToken = generateInviteToken();
      const hostSessionToken = generateSessionToken();
      const hostPlayerId = uuidv4();

      const hostPlayer: PlayerState = {
        id: hostPlayerId,
        displayName: displayName.trim(),
        avatar: avatar as AvatarId,
        relationshipTypeShared: relationshipType as any,
        connection: "connected",
        ready: false,
      };

      const expiresAt = new Date(Date.now() + ROOM_TTL_SECONDS * 1000).toISOString();

      const roomState: RoomState = {
        roomId,
        inviteToken,
        status: "waiting",
        settings: {
          rounds: settings.rounds,
          intensityCeiling: settings.intensityCeiling as any,
          categories: settings.categories as CategoryId[],
          timerSeconds: settings.timerSeconds,
        },
        players: [hostPlayer],
        turn: {
          activePlayerId: hostPlayerId,
          pickerPlayerId: hostPlayerId,
          answererPlayerId: "",
          round: 1,
          phase: "choosing_category",
          skipsThisTurn: 0,
        },
        expiresAt,
      };

      await setJson(keys.room(roomId), roomState, ROOM_TTL_SECONDS);
      await setJson(keys.roomByCode(roomId), { roomId }, ROOM_TTL_SECONDS);
      await setJson(keys.roomByToken(inviteToken), { roomId }, ROOM_TTL_SECONDS);

      socket.data = {
        playerId: hostPlayerId,
        roomId,
        sessionToken: hostSessionToken,
      };

      socket.join(roomId);

      socket.emit("room:state_snapshot", roomState);
      console.log(`[room:create] Room ${roomId} created by ${displayName} (waiting for partner)`);
    } catch (err: any) {
      console.error("[room:create] Error:", err);
      socket.emit("error:generic", { reason: "Failed to create room" });
    }
  });

  // room:join
  socket.on("room:join", async ({ roomCode, inviteToken, displayName, avatar, relationshipType }) => {
    try {
      let targetRoomId = roomCode ? roomCode.toUpperCase() : "";

      if (!targetRoomId && inviteToken) {
        const tokenMapping = await getJson<{ roomId: string }>(keys.roomByToken(inviteToken));
        if (tokenMapping) {
          targetRoomId = tokenMapping.roomId;
        }
      }

      if (!targetRoomId) {
        socket.emit("error:invalid_room", { reason: "Invalid room code or invite link" });
        return;
      }

      const roomState = await getJson<RoomState>(keys.room(targetRoomId));
      if (!roomState) {
        socket.emit("error:invalid_room", { reason: "Room not found or expired" });
        return;
      }

      // Check if existing player or new player 2
      const p1 = roomState.players[0];
      const p2 = roomState.players[1];

      let guestPlayerId = uuidv4();

      if (p1 && p1.displayName === displayName.trim()) {
        // Reconnecting host
        guestPlayerId = p1.id;
        p1.connection = "connected";
      } else if (p2 && p2.displayName === displayName.trim()) {
        // Reconnecting guest
        guestPlayerId = p2.id;
        p2.connection = "connected";
      } else if (p2 && p2.connection === "connected") {
        socket.emit("error:room_full", { reason: "Room already has two active participants" });
        return;
      } else {
        // New guest joining
        const guestPlayer: PlayerState = {
          id: guestPlayerId,
          displayName: displayName.trim(),
          avatar: avatar as AvatarId,
          relationshipTypeShared: relationshipType as any,
          connection: "connected",
          ready: false,
        };
        roomState.players = [p1, guestPlayer];
        roomState.turn.answererPlayerId = guestPlayerId;
      }

      const guestSessionToken = generateSessionToken();

      await setJson(keys.room(targetRoomId), roomState, ROOM_TTL_SECONDS);

      socket.data = {
        playerId: guestPlayerId,
        roomId: targetRoomId,
        sessionToken: guestSessionToken,
      };

      socket.join(targetRoomId);

      const joinedPlayer = roomState.players.find((p) => p && p.id === guestPlayerId)!;
      io.to(targetRoomId).emit("room:player_joined", { player: joinedPlayer });
      io.to(targetRoomId).emit("room:state_snapshot", roomState);

      console.log(`[room:join] Player ${displayName} connected to room ${targetRoomId}`);
    } catch (err: any) {
      console.error("[room:join] Error:", err);
      socket.emit("error:generic", { reason: "Failed to join room" });
    }
  });

  // room:ready
  socket.on("room:ready", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    try {
      const roomState = await getJson<RoomState>(keys.room(roomId));
      if (!roomState) return;

      const player = roomState.players.find((p) => p && p.id === playerId);
      if (!player) return;

      player.ready = !player.ready;
      await setJson(keys.room(roomId), roomState, ROOM_TTL_SECONDS);

      io.to(roomId).emit("room:player_ready", { playerId, ready: player.ready });
      io.to(roomId).emit("room:state_snapshot", roomState);
    } catch (err: any) {
      console.error("[room:ready] Error:", err);
    }
  });

  // game:start
  socket.on("game:start", async () => {
    const { roomId } = socket.data;
    if (!roomId) return;

    try {
      const roomState = await getJson<RoomState>(keys.room(roomId));
      if (!roomState) return;

      const p1 = roomState.players[0];
      const p2 = roomState.players[1];

      // Must have both players
      if (!p1 || !p2) {
        socket.emit("error:generic", { reason: "Need both players in room before starting" });
        return;
      }

      roomState.status = "active";
      // Player 1 picks the mood for Player 2
      roomState.turn = {
        activePlayerId: p1.id,
        pickerPlayerId: p1.id,
        answererPlayerId: p2.id,
        round: 1,
        phase: "choosing_category",
        skipsThisTurn: 0,
      };

      await setJson(keys.room(roomId), roomState, ROOM_TTL_SECONDS);

      io.to(roomId).emit("game:started", { firstActivePlayerId: p1.id });
      io.to(roomId).emit("room:state_snapshot", roomState);
      console.log(`[game:start] Game started in room ${roomId}. Host ${p1.displayName} is picking mood for ${p2.displayName}`);
    } catch (err: any) {
      console.error("[game:start] Error:", err);
    }
  });

  // Disconnect handler
  socket.on("disconnect", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    try {
      const roomState = await getJson<RoomState>(keys.room(roomId));
      if (!roomState) return;

      const player = roomState.players.find((p) => p && p.id === playerId);
      if (player) {
        player.connection = "reconnecting";
        await setJson(keys.room(roomId), roomState, ROOM_TTL_SECONDS);
        io.to(roomId).emit("player:disconnected", { playerId });
      }
    } catch (err) {
      console.error("[disconnect] Error:", err);
    }
  });
}
