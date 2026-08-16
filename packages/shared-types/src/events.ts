// packages/shared-types/src/events.ts
import type { PlayerState, TurnState, RoomState, GameCompletedPayload } from "./room";
import type { CategoryId, TurnPhase, ReactionId } from "./categories";

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
  answeredBy: { id: string; name: string; avatar: string };
}

// Server -> Client events
export interface ServerToClientEvents {
  "room:state_snapshot": (state: RoomState) => void;
  "room:player_joined": (payload: { player: PlayerState }) => void;
  "room:player_ready": (payload: { playerId: string; ready: boolean }) => void;

  "game:started": (payload: { firstActivePlayerId: string }) => void;
  "game:completed": (payload: GameCompletedPayload) => void;

  "turn:category_selection_started": (payload: { round: number }) => void;
  "turn:category_selected": (payload: { category: CategoryId }) => void;
  "turn:question_ready": (payload: QuestionPayload) => void;
  "turn:answer_locked": () => void;
  "turn:answer_shared": (payload: AnswerSharedPayload) => void;
  "turn:completed": (payload: { round: number; nextActivePlayerId: string }) => void;
  "turn:phase_update": (payload: { phase: TurnPhase; chosenCategory?: CategoryId }) => void;

  "player:disconnected": (payload: { playerId: string }) => void;
  "player:reconnected": (payload: { playerId: string }) => void;

  "error:invalid_room": (payload: { reason: string }) => void;
  "error:room_full": (payload: { reason: string }) => void;
  "error:generic": (payload: { reason: string }) => void;

  "reaction:received": (payload: { from: string; reaction: ReactionId }) => void;

  "pong": () => void;
}

// Client -> Server events
export interface ClientToServerEvents {
  "room:create": (payload: {
    displayName: string;
    avatar: string;
    settings: {
      rounds: number;
      intensityCeiling: string;
      categories: CategoryId[];
      timerSeconds: number | null;
    };
    relationshipType?: string;
  }) => void;

  "room:join": (payload: {
    inviteToken?: string;
    roomCode?: string;
    displayName: string;
    avatar: string;
    relationshipType?: string;
  }) => void;

  "room:ready": () => void;

  "turn:select_category": (payload: { category: CategoryId }) => void;
  "turn:answer_draft": (payload: { text: string }) => void;
  "turn:answer_lock": () => void;
  "turn:answer_share": () => void;
  "turn:skip": () => void;

  "reaction:send": (payload: { reaction: ReactionId }) => void;

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
