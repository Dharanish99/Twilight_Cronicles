import type { Server, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  RoomState,
  ReactionId,
} from "@twilight/shared-types";
import {
  setJson,
  getJson,
  keys,
  redisClient,
  ROOM_TTL_SECONDS,
  TURN_DRAFT_TTL_SECONDS,
} from "../redis/client";
import { selectQuestion, type SeedQuestion } from "../questions/select";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerTurnHandlers(io: AppServer, socket: AppSocket): void {
  // turn:select_category (Executed by the Picker for the Answerer)
  socket.on("turn:select_category", async ({ category }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    try {
      const roomState = await getJson<RoomState>(keys.room(roomId));
      if (!roomState) return;

      const { turn, settings, players } = roomState;
      // Must be the assigned picker
      if (turn.pickerPlayerId !== playerId) return;

      turn.phase = "question_loading";
      turn.chosenCategory = category;
      await setJson(keys.room(roomId), roomState, ROOM_TTL_SECONDS);

      io.to(roomId).emit("turn:category_selected", { category });

      // Select question for the Answerer
      const question = await selectQuestion({
        category,
        round: turn.round,
        settings,
        sessionId: roomId,
        skipsThisTurn: turn.skipsThisTurn,
      });

      if (!question) {
        socket.emit("error:generic", { reason: "No questions available in this category." });
        return;
      }

      await setJson(keys.turnQuestion(roomId), question, TURN_DRAFT_TTL_SECONDS);

      // Now set phase to answering for the Answerer
      turn.phase = "answering";
      turn.activePlayerId = turn.answererPlayerId;
      await setJson(keys.room(roomId), roomState, ROOM_TTL_SECONDS);

      // Deliver question strictly to the Answerer's socket(s)
      const answererSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.data.playerId === turn.answererPlayerId && s.data.roomId === roomId
      );

      const questionPayload = {
        questionId: question.id,
        text: question.text,
        category: question.category as any,
        intensity: question.intensity,
        followUpPrompt: question.followUpPrompt,
        estimatedAnswerSeconds: question.estimatedAnswerSeconds,
      };

      if (answererSocket) {
        answererSocket.emit("turn:question_ready", questionPayload);
      } else {
        // Fallback: if answerer reconnected on same socket, broadcast payload to them
        io.to(roomId).emit("turn:question_ready", questionPayload);
      }

      // Notify the room (and picker) of phase update without revealing question text
      socket.emit("turn:phase_update", {
        phase: "answering",
        chosenCategory: category,
      });
      socket.to(roomId).emit("turn:phase_update", {
        phase: "answering",
        chosenCategory: category,
      });
    } catch (err: any) {
      console.error("[turn:select_category] Error:", err);
    }
  });

  // turn:answer_draft (Sent by Answerer)
  socket.on("turn:answer_draft", async ({ text }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    try {
      await setJson(keys.turnDraft(roomId), { text, playerId }, TURN_DRAFT_TTL_SECONDS);
    } catch (err: any) {
      console.error("[turn:answer_draft] Error:", err);
    }
  });

  // turn:answer_lock (Sent by Answerer)
  socket.on("turn:answer_lock", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    try {
      const roomState = await getJson<RoomState>(keys.room(roomId));
      if (!roomState) return;

      roomState.turn.phase = "locked";
      await setJson(keys.room(roomId), roomState, ROOM_TTL_SECONDS);

      socket.emit("turn:answer_locked");
      socket.to(roomId).emit("turn:phase_update", { phase: "locked" });
    } catch (err: any) {
      console.error("[turn:answer_lock] Error:", err);
    }
  });

  // turn:answer_share
  socket.on("turn:answer_share", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    try {
      const roomState = await getJson<RoomState>(keys.room(roomId));
      if (!roomState) return;

      const question = await getJson<SeedQuestion>(keys.turnQuestion(roomId));
      const draft = await getJson<{ text: string; playerId: string }>(keys.turnDraft(roomId));

      if (roomState.turn.phase === "shared") {
        // Continue clicked -> next question via coin toss!
        const p1 = roomState.players[0];
        const p2 = roomState.players[1];
        if (!p2) return;

        // Each question = 1 round. Increment after every question.
        const nextRound = roomState.turn.round + 1;

        if (nextRound > roomState.settings.rounds) {
          roomState.status = "completed";
          roomState.sessionCount = (roomState.sessionCount ?? 0) + 1;
          await setJson(keys.room(roomId), roomState, ROOM_TTL_SECONDS);
          io.to(roomId).emit("game:completed", {
            roundsCompleted: roomState.settings.rounds,
            categoriesUsed: roomState.settings.categories,
            durationSeconds: 1200,
          });
          return;
        }

        // Alternate who gets to toss the coin each round
        const previousTosser = roomState.turn.tosserPlayerId;
        const nextTosser = previousTosser === p1.id ? p2.id : p1.id;

        roomState.turn = {
          activePlayerId: nextTosser,
          pickerPlayerId: "",
          answererPlayerId: "",
          tosserPlayerId: nextTosser,
          round: nextRound,
          phase: "coin_toss_waiting",
          skipsThisTurn: 0,
        };

        await setJson(keys.room(roomId), roomState, ROOM_TTL_SECONDS);

        io.to(roomId).emit("turn:completed", {
          round: nextRound,
          nextActivePlayerId: nextTosser,
        });
        io.to(roomId).emit("room:state_snapshot", roomState);
        console.log(`[turn:completed] Question ${nextRound}/${roomState.settings.rounds}. Next tosser: ${nextTosser}`);
        return;
      }

      if (!question) return;

      const answerer = roomState.players.find((p) => p && p.id === playerId);
      const answerText = draft?.text ?? "(No written response)";

      roomState.turn.phase = "shared";
      await setJson(keys.room(roomId), roomState, ROOM_TTL_SECONDS);

      io.to(roomId).emit("turn:answer_shared", {
        questionId: question.id,
        text: question.text,
        category: question.category as any,
        answerText,
        answeredBy: {
          id: playerId,
          name: answerer?.displayName ?? "Partner",
          avatar: (answerer?.avatar as string) ?? "ember",
        },
      });
      io.to(roomId).emit("room:state_snapshot", roomState);
    } catch (err: any) {
      console.error("[turn:answer_share] Error:", err);
    }
  });

  // turn:skip
  socket.on("turn:skip", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    try {
      const roomState = await getJson<RoomState>(keys.room(roomId));
      if (!roomState) return;

      const { turn, settings } = roomState;
      if (turn.answererPlayerId !== playerId) return;

      turn.skipsThisTurn = (turn.skipsThisTurn || 0) + 1;
      const category = turn.chosenCategory ?? "deep";

      const question = await selectQuestion({
        category,
        round: turn.round,
        settings,
        sessionId: roomId,
        skipsThisTurn: turn.skipsThisTurn,
      });

      if (!question) return;

      await setJson(keys.turnQuestion(roomId), question, TURN_DRAFT_TTL_SECONDS);
      await setJson(keys.room(roomId), roomState, ROOM_TTL_SECONDS);

      socket.emit("turn:question_ready", {
        questionId: question.id,
        text: question.text,
        category: question.category as any,
        intensity: question.intensity,
        followUpPrompt: question.followUpPrompt,
        estimatedAnswerSeconds: question.estimatedAnswerSeconds,
      });
    } catch (err: any) {
      console.error("[turn:skip] Error:", err);
    }
  });

  // reaction:send
  socket.on("reaction:send", ({ reaction }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId) return;
    io.to(roomId).emit("reaction:received", { from: playerId, reaction: reaction as ReactionId });
  });

  // turn:flip_coin (Sent by tosser)
  socket.on("turn:flip_coin", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    try {
      const roomState = await getJson<RoomState>(keys.room(roomId));
      if (!roomState) return;

      const { turn, players } = roomState;
      // Must be the assigned tosser and in the right phase
      if (turn.phase !== "coin_toss_waiting" || turn.tosserPlayerId !== playerId) return;

      const p1 = players[0];
      const p2 = players[1];
      if (!p1 || !p2) return;

      // Determine winner randomly
      const tossWinner = Math.random() < 0.5 ? p1 : p2;
      const tossLoser = tossWinner.id === p1.id ? p2 : p1;

      turn.phase = "coin_toss_flipping";
      turn.tossWinnerId = tossWinner.id;
      turn.pickerPlayerId = tossWinner.id;
      turn.answererPlayerId = tossLoser.id;
      turn.activePlayerId = tossWinner.id;

      await setJson(keys.room(roomId), roomState, ROOM_TTL_SECONDS);

      // Broadcast phase update and full snapshot
      io.to(roomId).emit("turn:phase_update", { phase: "coin_toss_flipping" });
      io.to(roomId).emit("room:state_snapshot", roomState);

      // Auto-advance to choosing category after animation (4.5s)
      setTimeout(async () => {
        const latestRoom = await getJson<RoomState>(keys.room(roomId));
        if (latestRoom && latestRoom.turn.phase === "coin_toss_flipping") {
          latestRoom.turn.phase = "choosing_category";
          await setJson(keys.room(roomId), latestRoom, ROOM_TTL_SECONDS);
          io.to(roomId).emit("turn:phase_update", { phase: "choosing_category" });
          io.to(roomId).emit("room:state_snapshot", latestRoom);
          console.log(`[turn:flip_coin] Finished. ${tossWinner.displayName} is now picking category.`);
        }
      }, 4500);

    } catch (err: any) {
      console.error("[turn:flip_coin] Error:", err);
    }
  });

  // question:report — in-session flag; logs report and confirms without interrupting turn
  socket.on("question:report", async ({ questionId, reason }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;
    const entry = { questionId, reason, playerId, roomId, ts: new Date().toISOString() };
    console.warn("[question:report]", JSON.stringify(entry));
    try {
      if (redisClient.status === "ready") {
        await redisClient.rpush("question:reports", JSON.stringify(entry));
      }
    } catch {
      // Non-fatal — report is already logged to console
    }
  });
}
