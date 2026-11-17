"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  RoomState,
  PlayerState,
  TurnPhase,
  CategoryId,
  AvatarId,
  ReactionId,
  RelationshipType,
  QuestionPayload,
  AnswerSharedPayload,
  GameCompletedPayload,
  RoomSettings,
  DoodleEntry,
} from "@twilight/shared-types";
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  clearSocketSessionResume,
  resumeSocketSession,
  areListenersInitialized,
  markListenersInitialized,
} from "../socket/client";
import { reconcileRoomSnapshot } from "./reconcileRoomSnapshot";
import {
  hydrateLocalPlayerProfile,
  mergeLocalPlayerIdentity,
  type LocalPlayerIdentity,
} from "./localPlayerIdentity";

interface ToastMessage {
  id: string;
  message: string;
  variant?: "success" | "neutral";
}

interface GameStore {
  localPlayer: LocalPlayerIdentity | null;
  setLocalPlayer: (player: LocalPlayerIdentity) => void;

  myServerId: string | null;
  setMyServerId: (id: string | null) => void;

  connectionStatus: "connected" | "reconnecting" | "disconnected";
  setConnectionStatus: (status: "connected" | "reconnecting" | "disconnected") => void;

  room: RoomState | null;
  setRoom: (room: RoomState | null) => void;

  currentQuestion: QuestionPayload | null;
  setCurrentQuestion: (q: QuestionPayload | null) => void;

  sharedAnswer: AnswerSharedPayload | null;
  setSharedAnswer: (ans: AnswerSharedPayload | null) => void;

  draftText: string;
  setDraftText: (text: string) => void;
  isDraftLocked: boolean;
  setIsDraftLocked: (locked: boolean) => void;

  activeReactions: { from: string; reaction: ReactionId; id: string }[];
  addReaction: (from: string, reaction: ReactionId) => void;

  gameCompletedData: GameCompletedPayload | null;
  setGameCompletedData: (data: GameCompletedPayload | null) => void;

  /** Session-persistent doodle gallery — all doodles from both players this session */
  doodleGallery: DoodleEntry[];
  addDoodleEntry: (entry: DoodleEntry) => void;
  updateDoodleReaction: (doodleId: string, playerId: string, emoji: string) => void;

  /** Set when a player has permanently left (5s after disconnect) */
  partnerLeft: { playerId: string; displayName: string } | null;
  setPartnerLeft: (info: { playerId: string; displayName: string } | null) => void;

  toasts: ToastMessage[];
  addToast: (message: string, variant?: "success" | "neutral") => void;
  removeToast: (id: string) => void;

  initSocketListeners: () => void;
  createRoom: (
    displayName: string,
    avatar: AvatarId,
    settings: RoomSettings,
    relationshipType?: RelationshipType
  ) => void;
  joinRoom: (
    displayName: string,
    avatar: AvatarId,
    roomCode?: string,
    inviteToken?: string,
    relationshipType?: RelationshipType
  ) => void;
  resumeRoom: () => void;
  syncRoomState: () => void;
  leaveRoom: () => void;
  clearLocalData: () => void;
  toggleReady: () => void;
  startGame: () => void;
  flipCoin: () => void;
  selectCategory: (category: CategoryId) => void;
  sendDraftUpdate: (text: string) => void;
  lockAnswer: () => void;
  unlockAnswer: () => void;
  shareAnswer: () => void;
  skipQuestion: () => void;
  sendReaction: (reaction: ReactionId) => void;
  sendDoodle: (dataUrl: string, round: number) => void;
  sendDoodleReaction: (doodleId: string, emoji: string) => void;
  resetGame: () => void;
}

let draftSyncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingDraftText: string | null = null;
let preserveLocalDraftOnRestore = false;

function queueDraftSync(text: string): void {
  pendingDraftText = text;
  if (draftSyncTimer) clearTimeout(draftSyncTimer);
  draftSyncTimer = setTimeout(() => {
    draftSyncTimer = null;
    const socket = getSocket();
    if (pendingDraftText !== null && socket.connected) {
      socket.emit("turn:answer_draft", { text: pendingDraftText });
      pendingDraftText = null;
    }
  }, 120);
}

function flushDraftSync(): void {
  if (draftSyncTimer) clearTimeout(draftSyncTimer);
  draftSyncTimer = null;
  if (pendingDraftText === null) return;
  const socket = getSocket();
  if (!socket.connected) return;
  socket.emit("turn:answer_draft", { text: pendingDraftText });
  pendingDraftText = null;
}

function cancelDraftSync(): void {
  if (draftSyncTimer) clearTimeout(draftSyncTimer);
  draftSyncTimer = null;
  pendingDraftText = null;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      localPlayer: null,
      setLocalPlayer: (player) => set({ localPlayer: player }),

      myServerId: null,
      setMyServerId: (id) => set({ myServerId: id }),

      connectionStatus: "disconnected",
      setConnectionStatus: (status) => set({ connectionStatus: status }),

      room: null,
      setRoom: (room) => set({ room }),

      currentQuestion: null,
      setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),

      sharedAnswer: null,
      setSharedAnswer: (sharedAnswer) => set({ sharedAnswer }),

      draftText: "",
      setDraftText: (draftText) => set({ draftText }),

      isDraftLocked: false,
      setIsDraftLocked: (isDraftLocked) => set({ isDraftLocked }),

      activeReactions: [],
      addReaction: (from, reaction) => {
        const id = `${Date.now()}-${Math.random()}`;
        set((state) => ({
          activeReactions: [...state.activeReactions, { from, reaction, id }],
        }));
        setTimeout(() => {
          set((state) => ({
            activeReactions: state.activeReactions.filter((r) => r.id !== id),
          }));
        }, 3000);
      },

      gameCompletedData: null,
      setGameCompletedData: (data) => set({ gameCompletedData: data }),

      doodleGallery: [],
      addDoodleEntry: (entry) =>
        set((state) => ({ doodleGallery: [...state.doodleGallery, entry] })),
      updateDoodleReaction: (doodleId, playerId, emoji) =>
        set((state) => ({
          doodleGallery: state.doodleGallery.map((d) =>
            d.id === doodleId
              ? { ...d, reactions: { ...d.reactions, [playerId]: emoji } }
              : d
          ),
        })),

      partnerLeft: null,
      setPartnerLeft: (info) => set({ partnerLeft: info }),

      toasts: [],
      addToast: (message, variant = "neutral") => {
        const id = `${Date.now()}-${Math.random()}`;
        set((state) => ({
          toasts: [...state.toasts, { id, message, variant }],
        }));
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, 4000);
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // ─────────── SOCKET LISTENERS (registered exactly once) ───────────
      initSocketListeners: () => {
        // CRITICAL: Only register listeners once per socket lifecycle
        if (areListenersInitialized()) return;
        markListenersInitialized();

        const socket = connectSocket();

        socket.on("connect", () => {
          set({ connectionStatus: "connected" });
          const token = get().localPlayer?.sessionToken;
          if (token) resumeSocketSession(token);
        });

        socket.on("disconnect", (reason) => {
          set({ connectionStatus: reason === "io client disconnect" ? "disconnected" : "reconnecting" });
        });

        socket.on("connect_error", () => {
          set({ connectionStatus: "reconnecting" });
        });

        socket.on("room:identity", ({ playerId, sessionToken, roomId }) => {
          set((state) => ({
            myServerId: playerId,
            localPlayer: mergeLocalPlayerIdentity(state.localPlayer, { playerId, sessionToken, roomId }),
          }));
        });

        socket.on("room:state_snapshot", (roomState: RoomState) => {
          set((state) => {
            const shouldClearTurnDraft =
              roomState.status === "completed" ||
              ["coin_toss_waiting", "coin_toss_flipping", "choosing_category"].includes(roomState.turn.phase);
            const reconciled = reconcileRoomSnapshot(state.room, state.sharedAnswer, roomState);
            const ownPlayer = state.myServerId
              ? roomState.players.find((player) => player?.id === state.myServerId)
              : undefined;
            if (shouldClearTurnDraft) cancelDraftSync();
            return {
              room: reconciled.room,
              sharedAnswer: reconciled.sharedAnswer,
              ...(ownPlayer ? { localPlayer: hydrateLocalPlayerProfile(state.localPlayer, ownPlayer) } : {}),
              ...(shouldClearTurnDraft
                ? { currentQuestion: null, draftText: "", isDraftLocked: false }
                : {}),
            };
          });
        });

        socket.on("room:resumed", () => {
          const state = get();
          if (
            state.room?.turn.answererPlayerId === state.myServerId &&
            state.room.turn.phase === "answering" &&
            state.draftText
          ) {
            pendingDraftText = state.draftText;
            flushDraftSync();
          }
          preserveLocalDraftOnRestore = false;
        });

        socket.on("room:doodle_gallery_snapshot", (entries) => {
          set({ doodleGallery: entries });
        });

        socket.on("room:player_joined", ({ player }: { player: PlayerState }) => {
          get().addToast(`${player.displayName} joined the room`, "success");
        });

        socket.on("room:player_ready", ({ playerId, ready }: { playerId: string; ready: boolean }) => {
          set((state) => {
            if (!state.room) return {};
            const updatedPlayers = state.room.players.map((p) =>
              p && p.id === playerId ? { ...p, ready } : p
            ) as [PlayerState, PlayerState?];
            return {
              room: { ...state.room, players: updatedPlayers },
            };
          });
        });

        socket.on("game:started", () => {
          get().addToast("🪙 Game on! Time for the first coin toss!", "success");
        });

        socket.on("turn:category_selected", ({ category }: { category: CategoryId }) => {
          set((state) => {
            if (!state.room) return {};
            return {
              room: {
                ...state.room,
                turn: {
                  ...state.room.turn,
                  phase: "question_loading" as TurnPhase,
                  chosenCategory: category,
                },
              },
            };
          });
        });

        socket.on("turn:question_ready", (questionPayload: QuestionPayload) => {
          set((state) => {
            const sameQuestion = state.currentQuestion?.questionId === questionPayload.questionId;
            preserveLocalDraftOnRestore = sameQuestion;
            if (!sameQuestion) cancelDraftSync();
            return {
              currentQuestion: questionPayload,
              ...(!sameQuestion ? { draftText: "" } : {}),
              isDraftLocked: false,
              sharedAnswer: null,
              room: state.room
                ? {
                    ...state.room,
                    turn: {
                      ...state.room.turn,
                      chosenCategory: questionPayload.category,
                    },
                  }
                : null,
            };
          });
        });

        socket.on("turn:phase_update", ({ phase, chosenCategory }: { phase: TurnPhase; chosenCategory?: CategoryId }) => {
          set((state) => {
            if (!state.room) return {};
            const sharedAnswer = phase === "shared" ? state.sharedAnswer ?? state.room.sharedAnswer ?? null : null;
            return {
              room: {
                ...state.room,
                sharedAnswer,
                turn: {
                  ...state.room.turn,
                  phase,
                  ...(chosenCategory ? { chosenCategory } : {}),
                },
              },
              sharedAnswer,
              ...(phase === "answering" ? { isDraftLocked: false } : {}),
            };
          });
        });

        socket.on("turn:answer_locked", () => {
          set((state) => ({
            isDraftLocked: true,
            room: state.room
              ? { ...state.room, turn: { ...state.room.turn, phase: "locked" as TurnPhase } }
              : null,
          }));
        });

        socket.on("turn:answer_draft_restored", ({ text }) => {
          if (!preserveLocalDraftOnRestore && pendingDraftText === null) set({ draftText: text });
          set({ isDraftLocked: false });
        });

        socket.on("turn:answer_shared", (payload: AnswerSharedPayload) => {
          cancelDraftSync();
          set((state) => ({
            sharedAnswer: payload,
            room: state.room
              ? {
                  ...state.room,
                  sharedAnswer: payload,
                  turn: {
                    ...state.room.turn,
                    phase: "shared" as TurnPhase,
                  },
                }
              : null,
          }));
        });

        socket.on("turn:completed", ({ round, nextActivePlayerId }: { round: number; nextActivePlayerId: string }) => {
          set((state) => {
            if (!state.room) {
              return {
                currentQuestion: null,
                sharedAnswer: null,
                draftText: "",
                isDraftLocked: false,
              };
            }

            return {
              currentQuestion: null,
              sharedAnswer: null,
              draftText: "",
              isDraftLocked: false,
              room: {
                ...state.room,
                turn: {
                  activePlayerId: nextActivePlayerId,
                  pickerPlayerId: "",
                  answererPlayerId: "",
                  tosserPlayerId: nextActivePlayerId,
                  round,
                  phase: "coin_toss_waiting" as TurnPhase,
                  skipsThisTurn: 0,
                },
              },
            };
          });
        });

        socket.on("game:completed", (data: GameCompletedPayload) => {
          set((state) => ({
            gameCompletedData: data,
            // Also mark the room as completed so play/page.tsx's router effect fires
            room: state.room ? { ...state.room, status: "completed" } : null,
          }));
        });

        socket.on("reaction:received", ({ from, reaction }: { from: string; reaction: ReactionId }) => {
          get().addReaction(from, reaction);
          // Show toast with player name and emoji
          const state = get();
          const emojiMap: Record<string, string> = {
            heart: "❤️", spark: "✨", soft: "🥺", same: "💯", surprising: "😮",
          };
          const emoji = emojiMap[reaction] || "✨";
          // Find who reacted by playerId
          const reactor = state.room?.players.find((p) => p && p.id === from);
          if (reactor && from !== state.myServerId) {
            get().addToast(`${reactor.displayName} reacted ${emoji}`, "success");
          }
        });

        socket.on("player:disconnected", ({ playerId }: { playerId: string }) => {
          set((state) => {
            if (!state.room) return {};
            const updated = state.room.players.map((p) =>
              p && p.id === playerId ? { ...p, connection: "reconnecting" as const } : p
            ) as [PlayerState, PlayerState?];
            return { room: { ...state.room, players: updated } };
          });
        });

        socket.on("player:reconnected", ({ playerId }: { playerId: string }) => {
          set((state) => {
            if (!state.room) return {};
            const updated = state.room.players.map((p) =>
              p && p.id === playerId ? { ...p, connection: "connected" as const } : p
            ) as [PlayerState, PlayerState?];
            return { room: { ...state.room, players: updated }, partnerLeft: null };
          });
        });

        socket.on("doodle:new", (entry: DoodleEntry) => {
          get().addDoodleEntry(entry);
        });

        socket.on("doodle:reaction_updated", ({ doodleId, playerId, emoji }: { doodleId: string; playerId: string; emoji: string }) => {
          get().updateDoodleReaction(doodleId, playerId, emoji);
        });

        socket.on("player:left", ({ playerId, displayName }: { playerId: string; displayName: string }) => {
          set({ partnerLeft: { playerId, displayName } });
        });

        socket.on("error:invalid_room", ({ reason }: { reason: string }) => {
          if (/session has expired|room has expired/i.test(reason)) {
            clearSocketSessionResume();
            set((state) => ({
              localPlayer: state.localPlayer
                ? { ...state.localPlayer, sessionToken: undefined, roomId: undefined }
                : null,
            }));
          }
          get().addToast(reason || "Invalid room", "neutral");
        });

        socket.on("error:room_full", ({ reason }: { reason: string }) => {
          get().addToast(reason || "Room is full", "neutral");
        });

        socket.on("error:generic", ({ reason }: { reason: string }) => {
          get().addToast(reason || "An error occurred", "neutral");
        });
      },

      // ─────────── ACTIONS ───────────

      createRoom: (displayName, avatar, settings, relationshipType) => {
        cancelDraftSync();
        set({ room: null, myServerId: null, currentQuestion: null, sharedAnswer: null, draftText: "", isDraftLocked: false, gameCompletedData: null, doodleGallery: [] });
        get().initSocketListeners();
        const socket = getSocket();
        socket.emit("room:create", {
          displayName,
          avatar,
          settings,
          relationshipType,
        });
      },

      joinRoom: (displayName, avatar, roomCode, inviteToken, relationshipType) => {
        cancelDraftSync();
        set({ room: null, myServerId: null, currentQuestion: null, sharedAnswer: null, draftText: "", isDraftLocked: false, gameCompletedData: null, doodleGallery: [] });
        get().initSocketListeners();
        const socket = getSocket();
        socket.emit("room:join", {
          displayName,
          avatar,
          roomCode,
          inviteToken,
          relationshipType,
        });
      },

      resumeRoom: () => {
        const sessionToken = get().localPlayer?.sessionToken;
        if (!sessionToken) return;
        get().initSocketListeners();
        resumeSocketSession(sessionToken);
      },

      syncRoomState: () => {
        const sessionToken = get().localPlayer?.sessionToken;
        if (!sessionToken) return;
        get().initSocketListeners();
        resumeSocketSession(sessionToken);
      },

      leaveRoom: () => {
        cancelDraftSync();
        clearSocketSessionResume();
        const socket = getSocket();
        if (socket.connected) socket.emit("room:leave");
        set((state) => ({
          localPlayer: state.localPlayer
            ? { ...state.localPlayer, sessionToken: undefined, roomId: undefined }
            : null,
          room: null,
          myServerId: null,
          currentQuestion: null,
          sharedAnswer: null,
          draftText: "",
          isDraftLocked: false,
          gameCompletedData: null,
          doodleGallery: [],
          partnerLeft: null,
        }));
      },

      clearLocalData: () => {
        cancelDraftSync();
        const socket = getSocket();
        if (socket.connected) socket.emit("room:leave");
        disconnectSocket();
        set({
          localPlayer: null,
          myServerId: null,
          connectionStatus: "disconnected",
          room: null,
          currentQuestion: null,
          sharedAnswer: null,
          draftText: "",
          isDraftLocked: false,
          gameCompletedData: null,
          doodleGallery: [],
          activeReactions: [],
          partnerLeft: null,
        });
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("twilight-game-store");
          window.localStorage.removeItem("twilight-theme");
        }
      },

      toggleReady: () => {
        if (getSocket().connected) getSocket().emit("room:ready");
        else get().addToast("Reconnecting before updating your ready status…", "neutral");
      },

      startGame: () => {
        if (getSocket().connected) getSocket().emit("game:start");
        else get().addToast("Reconnect before starting the conversation.", "neutral");
      },

      flipCoin: () => {
        if (getSocket().connected) getSocket().emit("turn:flip_coin");
        else get().addToast("Reconnect before flipping the coin.", "neutral");
      },

      selectCategory: (category) => {
        if (getSocket().connected) getSocket().emit("turn:select_category", { category });
        else get().addToast("Reconnect before choosing a mood.", "neutral");
      },

      sendDraftUpdate: (text) => {
        set({ draftText: text });
        queueDraftSync(text);
      },

      lockAnswer: () => {
        if (getSocket().connected) {
          flushDraftSync();
          getSocket().emit("turn:answer_lock");
        }
        else get().addToast("Reconnect before locking your answer.", "neutral");
      },

      unlockAnswer: () => {
        if (getSocket().connected) getSocket().emit("turn:answer_unlock");
        else get().addToast("Reconnect before editing your answer.", "neutral");
      },

      shareAnswer: () => {
        if (getSocket().connected) getSocket().emit("turn:answer_share");
        else get().addToast("Reconnect before continuing.", "neutral");
      },

      skipQuestion: () => {
        if (getSocket().connected) getSocket().emit("turn:skip");
        else get().addToast("Reconnect before skipping this question.", "neutral");
      },

      sendReaction: (reaction) => {
        if (getSocket().connected) getSocket().emit("reaction:send", { reaction });
      },

      sendDoodle: (dataUrl, round) => {
        if (getSocket().connected) getSocket().emit("doodle:send", { dataUrl, round });
        else get().addToast("Reconnect before sending your doodle.", "neutral");
      },

      sendDoodleReaction: (doodleId, emoji) => {
        if (getSocket().connected) getSocket().emit("doodle:react", { doodleId, emoji });
      },

      resetGame: () => {
        cancelDraftSync();
        set({
          room: null,
          myServerId: null,
          currentQuestion: null,
          sharedAnswer: null,
          draftText: "",
          isDraftLocked: false,
          gameCompletedData: null,
          activeReactions: [],
          doodleGallery: [],
          partnerLeft: null,
        });
      },
    }),
    {
      name: "twilight-game-store",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") return sessionStorage;
        // SSR fallback
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        localPlayer: state.localPlayer,
      }),
    }
  )
);
