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
  tossWinnerId?: string;
  round: number;
  phase: TurnPhase;
  chosenCategory?: CategoryId;
  skipsThisTurn: number;
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
}

export interface GameCompletedPayload {
  roundsCompleted: number;
  categoriesUsed: CategoryId[];
  durationSeconds: number;
}
