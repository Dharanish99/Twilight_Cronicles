// packages/shared-types/src/room.ts
import type { CategoryId, AvatarId, TurnPhase, IntensityCeiling, RelationshipType } from "./categories";

export interface PlayerState {
  id: string;
  displayName: string;
  avatar: AvatarId;
  relationshipTypeShared?: RelationshipType;
  connection: "connected" | "reconnecting" | "disconnected";
  ready: boolean;
}

export interface TurnState {
  activePlayerId: string;
  pickerPlayerId: string;
  answererPlayerId: string;
  tosserPlayerId?: string;
  tossWinnerId?: string;
  round: number;
  phase: TurnPhase;
  chosenCategory?: CategoryId;
  /** Server timestamp used to keep answer timers in sync after reconnects. */
  answerDeadlineAt?: string | null;
  /** Server timestamp used to resume a coin-toss transition after a restart. */
  phaseEndsAt?: string | null;
}

export interface RoomSettings {
  rounds: number;
  intensityCeiling: IntensityCeiling;
  categories: CategoryId[];
  timerSeconds: number | null;
}

export interface RoomState {
  roomId: string;
  inviteToken: string;
  status: "waiting" | "active" | "paused" | "completed" | "expired";
  settings: RoomSettings;
  players: [PlayerState, PlayerState?];
  turn: TurnState;
  expiresAt: string;
  startedAt?: string;
  completedAt?: string;
  usedCategories?: CategoryId[];
  /** Visible only after the answer has been shared with both players. */
  sharedAnswer?: {
    questionId: string;
    text: string;
    category: CategoryId;
    answerText: string;
    answeredBy: { id: string; name: string; avatar: AvatarId };
  } | null;
  /** How many times this room pair has completed a full game session */
  sessionCount?: number;
}

export interface GameCompletedPayload {
  roundsCompleted: number;
  categoriesUsed: CategoryId[];
  durationSeconds: number;
}
