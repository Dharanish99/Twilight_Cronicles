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
  QuestionPayload,
  AnswerSharedPayload,
  GameCompletedPayload,
  RoomSettings,
  DoodleEntry,
} from "@twilight/shared-types";
import {
  getSocket,
  connectSocket,
  areListenersInitialized,
  markListenersInitialized,
} from "../socket/client";

interface LocalPlayer {
  id: string;
  displayName: string;
  avatar: AvatarId;
  relationshipType?: string;
  sessionToken?: string;
}

interface ToastMessage {
  id: string;
  message: string;
  variant?: "success" | "neutral";
}

interface GameStore {
  localPlayer: LocalPlayer | null;
  setLocalPlayer: (player: LocalPlayer) => void;

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
    relationshipType?: string
  ) => void;
  joinRoom: (
    displayName: string,
    avatar: AvatarId,
    roomCode?: string,
    inviteToken?: string,
    relationshipType?: string
  ) => void;
  toggleReady: () => void;
  startGame: () => void;
  flipCoin: () => void;
  selectCategory: (category: CategoryId) => void;
  sendDraftUpdate: (text: string) => void;
  lockAnswer: () => void;
  shareAnswer: () => void;
  skipQuestion: () => void;
  sendReaction: (reaction: ReactionId) => void;
  sendDoodle: (dataUrl: string, round: number) => void;
  sendDoodleReaction: (doodleId: string, emoji: string) => void;
  resetGame: () => void;
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
        });

        socket.on("disconnect", () => {
          set({ connectionStatus: "disconnected" });
        });

        socket.on("connect_error", () => {
          set({ connectionStatus: "reconnecting" });
        });

        socket.on("room:identity", ({ playerId }: { playerId: string }) => {
          console.log(`[Store] Received official identity from server: ${playerId}`);
          set({ myServerId: playerId });
        });

        socket.on("room:state_snapshot", (roomState: RoomState) => {
          set({ room: roomState });
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
          set((state) => ({
            currentQuestion: questionPayload,
            draftText: "",
            isDraftLocked: false,
            sharedAnswer: null,
            room: state.room
              ? {
                  ...state.room,
                  turn: {
                    ...state.room.turn,
                    phase: "answering" as TurnPhase,
                    chosenCategory: questionPayload.category,
                  },
                }
              : null,
          }));
        });

        socket.on("turn:phase_update", ({ phase, chosenCategory }: { phase: TurnPhase; chosenCategory?: CategoryId }) => {
          set((state) => {
            if (!state.room) return {};
            return {
              room: {
                ...state.room,
                turn: {
                  ...state.room.turn,
                  phase,
                  ...(chosenCategory ? { chosenCategory } : {}),
                },
              },
            };
          });
        });

        socket.on("turn:answer_locked", () => {
          set({ isDraftLocked: true });
        });

        socket.on("turn:answer_shared", (payload: AnswerSharedPayload) => {
          set((state) => ({
            sharedAnswer: payload,
            room: state.room
              ? {
                  ...state.room,
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
            return { room: { ...state.room, players: updated } };
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

      toggleReady: () => {
        getSocket().emit("room:ready");
      },

      startGame: () => {
        getSocket().emit("game:start");
      },

      flipCoin: () => {
        getSocket().emit("turn:flip_coin");
      },

      selectCategory: (category) => {
        getSocket().emit("turn:select_category", { category });
      },

      sendDraftUpdate: (text) => {
        set({ draftText: text });
        getSocket().emit("turn:answer_draft", { text });
      },

      lockAnswer: () => {
        set({ isDraftLocked: true });
        getSocket().emit("turn:answer_lock");
      },

      shareAnswer: () => {
        getSocket().emit("turn:answer_share");
      },

      skipQuestion: () => {
        getSocket().emit("turn:skip");
      },

      sendReaction: (reaction) => {
        getSocket().emit("reaction:send", { reaction });
      },

      sendDoodle: (dataUrl, round) => {
        getSocket().emit("doodle:send", { dataUrl, round });
      },

      sendDoodleReaction: (doodleId, emoji) => {
        getSocket().emit("doodle:react", { doodleId, emoji });
      },

      resetGame: () => {
        set({
          room: null,
          currentQuestion: null,
          sharedAnswer: null,
          draftText: "",
          isDraftLocked: false,
          gameCompletedData: null,
          activeReactions: [],
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
