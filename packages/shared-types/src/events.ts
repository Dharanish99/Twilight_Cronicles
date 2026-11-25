// packages/shared-types/src/events.ts
import type { PlayerState, TurnState, RoomState, GameCompletedPayload } from "./room";
import type { AvatarId, CategoryId, IntensityCeiling, RelationshipType, TurnPhase, ReactionId } from "./categories";

export interface QuestionPayload {
  questionId: string;
  text: string;
  category: CategoryId;
  intensity: number;
  followUpPrompt?: string | null;
  estimatedAnswerSeconds: number;
}

export interface AnswerSharedPayload {
  questionId: string;
  text: string;
  category: CategoryId;
  answerText: string;
  answeredBy: { id: string; name: string; avatar: AvatarId };
}

/** A single entry in the session-persistent doodle gallery */
export interface DoodleEntry {
  id: string;
  dataUrl: string;
  senderPlayerId: string;
  senderName: string;
  round: number;
  timestamp: number;
  /** playerId → emoji (one reaction per player) */
  reactions: Record<string, string>;
}

/** Reactions supported by the Doodle gallery on both the client and server. */
export const DOODLE_REACTION_EMOJIS = ["❤️", "✨", "🥺", "💯", "😮", "👍", "😂"] as const;

export interface DoodleSendResult {
  ok: boolean;
  /** Safe, user-facing reason when a doodle was not accepted. */
  reason?: string;
}

// Server -> Client events
export interface ServerToClientEvents {
  "room:state_snapshot": (state: RoomState) => void;
  "room:player_joined": (payload: { player: PlayerState }) => void;
  "room:player_ready": (payload: { playerId: string; ready: boolean }) => void;
  "room:identity": (payload: { playerId: string; sessionToken: string; roomId: string }) => void;
  "room:resumed": () => void;
  "room:doodle_gallery_snapshot": (entries: DoodleEntry[]) => void;
  "question:report_received": () => void;

  "game:started": (payload: { firstActivePlayerId: string }) => void;
  "game:completed": (payload: GameCompletedPayload) => void;

  "turn:category_selection_started": (payload: { round: number }) => void;
  "turn:category_selected": (payload: { category: CategoryId }) => void;
  "turn:question_ready": (payload: QuestionPayload) => void;
  "turn:answer_locked": () => void;
  "turn:answer_draft_restored": (payload: { text: string }) => void;
  "turn:answer_shared": (payload: AnswerSharedPayload) => void;
  "turn:completed": (payload: { round: number; nextActivePlayerId: string }) => void;
  "turn:phase_update": (payload: { phase: TurnPhase; chosenCategory?: CategoryId }) => void;

  "player:disconnected": (payload: { playerId: string }) => void;
  "player:reconnected": (payload: { playerId: string }) => void;
  /** Emitted after ~5s grace period with no reconnect — player genuinely left */
  "player:left": (payload: { playerId: string; displayName: string }) => void;

  "error:invalid_room": (payload: { reason: string }) => void;
  "error:room_full": (payload: { reason: string }) => void;
  "error:generic": (payload: { reason: string }) => void;

  "reaction:received": (payload: { from: string; reaction: ReactionId }) => void;

  /** New doodle added to the session gallery — broadcast to both players immediately */
  "doodle:new": (payload: DoodleEntry) => void;
  /** Reaction updated on a doodle entry */
  "doodle:reaction_updated": (payload: {
    doodleId: string;
    playerId: string;
    emoji: string;
  }) => void;

  "pong": () => void;
}

// Client -> Server events
export interface ClientToServerEvents {
  "room:create": (payload: {
    displayName: string;
    avatar: AvatarId;
    settings: {
      rounds: number;
      intensityCeiling: IntensityCeiling;
      categories: CategoryId[];
      timerSeconds: number | null;
    };
    relationshipType?: RelationshipType;
  }) => void;

  "room:join": (payload: {
    inviteToken?: string;
    roomCode?: string;
    displayName: string;
    avatar: AvatarId;
    relationshipType?: RelationshipType;
  }) => void;

  "room:ready": () => void;
  "room:resume": (payload: { sessionToken: string }) => void;
  "room:leave": () => void;

  "turn:select_category": (payload: { category: CategoryId }) => void;
  "turn:answer_draft": (payload: { text: string }) => void;
  "turn:answer_lock": () => void;
  "turn:answer_unlock": () => void;
  "turn:answer_share": () => void;
  "turn:flip_coin": () => void;

  "reaction:send": (payload: { reaction: ReactionId }) => void;

  "question:report": (payload: { questionId: string; reason: string }) => void;

  /** Send a doodle — only valid when sender is the waiting (non-answering) player */
  "doodle:send": (
    payload: { dataUrl: string; round: number; clientId?: string },
    acknowledge?: (result: DoodleSendResult) => void,
  ) => void;
  /** React to an existing doodle with an emoji */
  "doodle:react": (payload: { doodleId: string; emoji: string }) => void;

  "game:start": () => void;
  "game:pause": () => void;
  "game:resume": () => void;

  "ping": () => void;
}

// Inter-server events (Socket.IO adapter)
export interface InterServerEvents {
  ping: () => void;
}

// Socket data attached per socket
export interface SocketData {
  playerId: string;
  roomId: string;
  sessionToken: string;
}
