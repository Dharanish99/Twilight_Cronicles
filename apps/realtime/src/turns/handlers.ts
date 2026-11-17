import type { Server, Socket } from "socket.io";
import type {
  CategoryId,
  ClientToServerEvents,
  DoodleEntry,
  InterServerEvents,
  ReactionId,
  RoomState,
  ServerToClientEvents,
  SocketData,
} from "@twilight/shared-types";
import { CATEGORY_IDS } from "@twilight/shared-types";
import {
  consumeRateLimit,
  deleteKey,
  getJson,
  keys,
  ROOM_TTL_SECONDS,
  setJson,
  TURN_DRAFT_TTL_SECONDS,
  withRoomLock,
} from "../redis/client";
import { loadRoom, playerChannel, saveRoom, touchRoom } from "../rooms/state";
import { selectQuestion, type SeedQuestion } from "../questions/select";
import { scheduleCoinTossAdvance } from "./schedule";
import { pickCoinTossWinner } from "./coin";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
const TRUST_PROXY = process.env.TRUST_PROXY === "true";

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

const CATEGORIES = new Set<CategoryId>(CATEGORY_IDS);
const REACTIONS = new Set<ReactionId>(["heart", "spark", "soft", "same", "surprising"]);
const REPORT_REASONS = new Set([
  "offensive", "too_personal", "repetitive", "poorly_written", "wrong_category", "other",
]);
const DOODLE_REACTIONS = new Set(["❤️", "✨", "🥺", "💯", "😮", "👍", "😂"]);

function questionPayload(question: SeedQuestion) {
  return {
    questionId: question.id,
    text: question.text,
    category: question.category as CategoryId,
    intensity: question.intensity,
    followUpPrompt: question.followUpPrompt ?? null,
    estimatedAnswerSeconds: question.estimatedAnswerSeconds,
  };
}

function setAnswerDeadline(room: RoomState): void {
  room.turn.answerDeadlineAt = room.settings.timerSeconds
    ? new Date(Date.now() + room.settings.timerSeconds * 1000).toISOString()
    : null;
}

function isParticipant(room: RoomState, playerId: string): boolean {
  return room.players.some((player) => player?.id === playerId);
}

function isDoodleDataUrl(value: unknown): value is string {
  return typeof value === "string" &&
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) &&
    value.length <= 80_000;
}

export function registerTurnHandlers(io: AppServer, socket: AppSocket): void {
  socket.on("turn:select_category", async (payload) => {
    const category = payload?.category;
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId || !category || !CATEGORIES.has(category)) return;

    try {
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (
          !room || room.status !== "active" || room.turn.phase !== "choosing_category" ||
          room.turn.pickerPlayerId !== playerId || !room.settings.categories.includes(category)
        ) return;

        room.turn.phase = "question_loading";
        room.turn.chosenCategory = category;
        await saveRoom(room);
        io.to(roomId).emit("turn:category_selected", { category });
        io.to(roomId).emit("turn:phase_update", { phase: "question_loading", chosenCategory: category });

        const hostRelationship = room.players[0]?.relationshipTypeShared;
        let question: SeedQuestion | null;
        try {
          question = await selectQuestion({
            category,
            round: room.turn.round,
            settings: room.settings,
            sessionId: roomId,
            skipsThisTurn: room.turn.skipsThisTurn,
            relationshipType: hostRelationship,
          });
        } catch (error) {
          room.turn.phase = "choosing_category";
          room.turn.chosenCategory = undefined;
          await saveRoom(room);
          io.to(roomId).emit("room:state_snapshot", room);
          throw error;
        }

        if (!question) {
          room.turn.phase = "choosing_category";
          room.turn.chosenCategory = undefined;
          await saveRoom(room);
          io.to(roomId).emit("room:state_snapshot", room);
          socket.emit("error:generic", { reason: "No questions are available for that mood right now." });
          return;
        }

        await setJson(keys.turnQuestion(roomId), question, TURN_DRAFT_TTL_SECONDS);
        await deleteKey(keys.turnDraft(roomId));
        room.turn.phase = "answering";
        room.turn.activePlayerId = room.turn.answererPlayerId;
        room.sharedAnswer = null;
        room.usedCategories = Array.from(new Set([...(room.usedCategories ?? []), category]));
        setAnswerDeadline(room);
        await saveRoom(room);

        io.to(roomId).emit("turn:phase_update", { phase: "answering", chosenCategory: category });
        io.to(roomId).emit("room:state_snapshot", room);
        io.to(playerChannel(roomId, room.turn.answererPlayerId)).emit("turn:question_ready", questionPayload(question));
      });
    } catch (error) {
      console.error("[turn:select_category] Failed:", error);
      socket.emit("error:generic", { reason: "We couldn't load the next question. Please try again." });
    }
  });

  socket.on("turn:answer_draft", async (payload) => {
    const text = payload?.text;
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId || typeof text !== "string" || text.length > 3000) return;
    try {
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (!room || room.status !== "active" || room.turn.answererPlayerId !== playerId || room.turn.phase !== "answering") return;
        await setJson(keys.turnDraft(roomId), { text, playerId }, TURN_DRAFT_TTL_SECONDS);
        await touchRoom(room);
      });
    } catch (error) {
      console.error("[turn:answer_draft] Failed:", error);
      socket.emit("error:generic", { reason: "Your draft couldn't sync. Check your connection and try again." });
    }
  });

  socket.on("turn:answer_lock", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;
    try {
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (!room || room.status !== "active" || room.turn.answererPlayerId !== playerId || room.turn.phase !== "answering") return;
        const draft = await getJson<{ text: string; playerId: string }>(keys.turnDraft(roomId));
        if (draft?.playerId !== playerId || !draft.text.trim()) {
          socket.emit("error:generic", { reason: "Write an answer before locking it in." });
          return;
        }
        room.turn.phase = "locked";
        await saveRoom(room);
        io.to(playerChannel(roomId, playerId)).emit("turn:answer_locked");
        io.to(roomId).emit("turn:phase_update", { phase: "locked" });
        io.to(roomId).emit("room:state_snapshot", room);
      });
    } catch (error) {
      console.error("[turn:answer_lock] Failed:", error);
      socket.emit("error:generic", { reason: "We couldn't lock your answer. Please try again." });
    }
  });

  socket.on("turn:answer_unlock", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;
    try {
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (!room || room.status !== "active" || room.turn.answererPlayerId !== playerId || room.turn.phase !== "locked") return;
        room.turn.phase = "answering";
        await saveRoom(room);
        io.to(roomId).emit("turn:phase_update", { phase: "answering" });
        io.to(roomId).emit("room:state_snapshot", room);
      });
    } catch (error) {
      console.error("[turn:answer_unlock] Failed:", error);
      socket.emit("error:generic", { reason: "We couldn't reopen your answer. Please try again." });
    }
  });

  socket.on("turn:answer_share", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;
    try {
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (!room || room.status !== "active" || !isParticipant(room, playerId)) return;

        if (room.turn.phase === "shared") {
          if (room.turn.pickerPlayerId !== playerId) return;
          const nextRound = room.turn.round + 1;
          if (nextRound > room.settings.rounds) {
            room.status = "completed";
            room.sessionCount = (room.sessionCount ?? 0) + 1;
            room.completedAt = new Date().toISOString();
            room.turn.answerDeadlineAt = null;
            await saveRoom(room);
            const startedAt = room.startedAt ? Date.parse(room.startedAt) : Date.now();
            io.to(roomId).emit("game:completed", {
              roundsCompleted: room.turn.round,
              categoriesUsed: room.usedCategories ?? [],
              durationSeconds: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
            });
            io.to(roomId).emit("room:state_snapshot", room);
            return;
          }

          const [p1, p2] = room.players;
          if (!p1 || !p2) return;
          const nextTosser = room.turn.tosserPlayerId === p1.id ? p2.id : p1.id;
          room.sharedAnswer = null;
          room.turn = {
            activePlayerId: nextTosser,
            pickerPlayerId: "",
            answererPlayerId: "",
            tosserPlayerId: nextTosser,
            round: nextRound,
            phase: "coin_toss_waiting",
            skipsThisTurn: 0,
            answerDeadlineAt: null,
            phaseEndsAt: null,
          };
          await deleteKey(keys.turnDraft(roomId));
          await deleteKey(keys.turnQuestion(roomId));
          await saveRoom(room);
          io.to(roomId).emit("turn:completed", { round: nextRound, nextActivePlayerId: nextTosser });
          io.to(roomId).emit("room:state_snapshot", room);
          return;
        }

        if (room.turn.phase !== "locked" || room.turn.answererPlayerId !== playerId) return;
        const question = await getJson<SeedQuestion>(keys.turnQuestion(roomId));
        const draft = await getJson<{ text: string; playerId: string }>(keys.turnDraft(roomId));
        const answerer = room.players.find((player) => player?.id === playerId);
        if (!question || !draft || draft.playerId !== playerId || !draft.text.trim() || !answerer) return;

        const sharedAnswer = {
          questionId: question.id,
          text: question.text,
          category: question.category as CategoryId,
          answerText: draft.text,
          answeredBy: {
            id: playerId,
            name: answerer.displayName,
            avatar: answerer.avatar,
          },
        };
        room.turn.phase = "shared";
        room.sharedAnswer = sharedAnswer;
        await saveRoom(room);
        await deleteKey(keys.turnDraft(roomId));
        io.to(roomId).emit("turn:answer_shared", sharedAnswer);
        io.to(roomId).emit("room:state_snapshot", room);
      });
    } catch (error) {
      console.error("[turn:answer_share] Failed:", error);
      socket.emit("error:generic", { reason: "We couldn't share that answer. Please try again." });
    }
  });

  socket.on("turn:skip", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;
    try {
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (
          !room || room.status !== "active" || room.turn.answererPlayerId !== playerId ||
          room.turn.phase !== "answering" || !room.turn.chosenCategory
        ) return;

        const skipCount = room.turn.skipsThisTurn + 1;
        const question = await selectQuestion({
          category: room.turn.chosenCategory,
          round: room.turn.round,
          settings: room.settings,
          sessionId: roomId,
          skipsThisTurn: skipCount,
          relationshipType: room.players[0]?.relationshipTypeShared,
        });
        if (!question) return;

        await setJson(keys.turnQuestion(roomId), question, TURN_DRAFT_TTL_SECONDS);
        await deleteKey(keys.turnDraft(roomId));
        room.turn.skipsThisTurn = skipCount;
        room.sharedAnswer = null;
        setAnswerDeadline(room);
        await saveRoom(room);
        io.to(roomId).emit("room:state_snapshot", room);
        io.to(playerChannel(roomId, playerId)).emit("turn:question_ready", questionPayload(question));
      });
    } catch (error) {
      console.error("[turn:skip] Failed:", error);
      socket.emit("error:generic", { reason: "We couldn't skip to another question. Please try again." });
    }
  });

  socket.on("turn:flip_coin", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;
    try {
      let transitionDelay = 0;
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (
          !room || room.status !== "active" || room.turn.phase !== "coin_toss_waiting" ||
          room.turn.tosserPlayerId !== playerId
        ) return;
        const [p1, p2] = room.players;
        if (!p1 || !p2 || p1.connection !== "connected" || p2.connection !== "connected") {
          socket.emit("error:generic", { reason: "Both players need to be connected for the coin toss." });
          return;
        }

        const winner = pickCoinTossWinner([p1, p2]);
        const loser = winner.id === p1.id ? p2 : p1;
        transitionDelay = 4500;
        room.turn.phase = "coin_toss_flipping";
        room.turn.phaseEndsAt = new Date(Date.now() + transitionDelay).toISOString();
        room.turn.tossWinnerId = winner.id;
        room.turn.pickerPlayerId = winner.id;
        room.turn.answererPlayerId = loser.id;
        room.turn.activePlayerId = winner.id;
        await saveRoom(room);
        io.to(roomId).emit("turn:phase_update", { phase: "coin_toss_flipping" });
        io.to(roomId).emit("room:state_snapshot", room);
      });
      if (transitionDelay) scheduleCoinTossAdvance(io, roomId, transitionDelay);
    } catch (error) {
      console.error("[turn:flip_coin] Failed:", error);
      socket.emit("error:generic", { reason: "We couldn't flip the coin. Please try again." });
    }
  });

  socket.on("reaction:send", async (payload) => {
    const reaction = payload?.reaction;
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId || !reaction || !REACTIONS.has(reaction)) return;
    const room = await loadRoom(roomId).catch(() => null);
    if (!room || room.turn.phase !== "shared" || !isParticipant(room, playerId)) return;
    io.to(roomId).emit("reaction:received", { from: playerId, reaction });
  });

  socket.on("question:report", async (payload) => {
    const questionId = payload?.questionId;
    const reason = payload?.reason;
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId || typeof questionId !== "string" || questionId.length > 80 || typeof reason !== "string" || !REPORT_REASONS.has(reason)) return;
    try {
      if (!await consumeRateLimit(clientAddress(socket), "report", 8, 60)) {
        socket.emit("error:generic", { reason: "Too many reports were sent. Please wait a minute." });
        return;
      }
      const room = await loadRoom(roomId);
      const question = room ? await getJson<SeedQuestion>(keys.turnQuestion(roomId)) : null;
      const isCurrentQuestion = question?.id === questionId || room?.sharedAnswer?.questionId === questionId;
      if (!room || !isParticipant(room, playerId) || !isCurrentQuestion) return;
      await withRoomLock("question-reports", async () => {
        const reports = (await getJson<Array<Record<string, string>>>(keys.questionReports)) ?? [];
        const now = Date.now();
        const retentionCutoff = now - 90 * 24 * 60 * 60 * 1000;
        const recentReports = reports.filter((report) => {
          const submittedAt = Date.parse(report.submittedAt ?? "");
          return Number.isFinite(submittedAt) && submittedAt >= retentionCutoff;
        });
        recentReports.push({ questionId, reason, roomId, submittedAt: new Date(now).toISOString() });
        if (recentReports.length > 500) recentReports.splice(0, recentReports.length - 500);
        await setJson(keys.questionReports, recentReports, 90 * 24 * 60 * 60);
      });
      socket.emit("question:report_received");
    } catch (error) {
      console.error("[question:report] Failed to store report:", error);
      socket.emit("error:generic", { reason: "Your report couldn't be sent right now." });
    }
  });

  socket.on("doodle:send", async (payload) => {
    const dataUrl = payload?.dataUrl;
    const round = payload?.round;
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId || !isDoodleDataUrl(dataUrl) || typeof round !== "number" || !Number.isInteger(round)) return;
    try {
      if (!await consumeRateLimit(clientAddress(socket), "doodle", 12, 60)) {
        socket.emit("error:generic", { reason: "Too many doodles were sent. Please wait a minute." });
        return;
      }
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (
          !room || room.status !== "active" || room.turn.answererPlayerId === playerId ||
          room.turn.round !== round || !["answering", "locked"].includes(room.turn.phase)
        ) return;
        const sender = room.players.find((player) => player?.id === playerId);
        if (!sender) return;

        const gallery = (await getJson<DoodleEntry[]>(keys.doodleGallery(roomId))) ?? [];
        const entry: DoodleEntry = {
          id: `${Date.now()}-${randomDoodleSuffix()}`,
          dataUrl,
          senderPlayerId: playerId,
          senderName: sender.displayName,
          round,
          timestamp: Date.now(),
          reactions: {},
        };
        if (gallery.length >= 20) gallery.shift();
        gallery.push(entry);
        await setJson(keys.doodleGallery(roomId), gallery, ROOM_TTL_SECONDS);
        io.to(roomId).emit("doodle:new", entry);
      });
    } catch (error) {
      console.error("[doodle:send] Failed:", error);
      socket.emit("error:generic", { reason: "Your doodle couldn't sync. Please try again." });
    }
  });

  socket.on("doodle:react", async (payload) => {
    const doodleId = payload?.doodleId;
    const emoji = payload?.emoji;
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId || typeof doodleId !== "string" || doodleId.length > 80 || typeof emoji !== "string" || !DOODLE_REACTIONS.has(emoji)) return;
    try {
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (!room || !isParticipant(room, playerId)) return;
        const gallery = (await getJson<DoodleEntry[]>(keys.doodleGallery(roomId))) ?? [];
        const entry = gallery.find((candidate) => candidate.id === doodleId);
        if (!entry) return;
        entry.reactions[playerId] = emoji;
        await setJson(keys.doodleGallery(roomId), gallery, ROOM_TTL_SECONDS);
        io.to(roomId).emit("doodle:reaction_updated", { doodleId, playerId, emoji });
      });
    } catch (error) {
      console.error("[doodle:react] Failed:", error);
      socket.emit("error:generic", { reason: "That reaction couldn't sync. Please try again." });
    }
  });
}

function randomDoodleSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}
