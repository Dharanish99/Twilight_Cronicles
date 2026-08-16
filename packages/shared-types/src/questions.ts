// packages/shared-types/src/questions.ts
import type { CategoryId } from "./categories";

export type SkipSensitivity = "low" | "standard" | "handle_with_care";
export type ContentWarningLevel = "none" | "mild" | "notable";
export type QuestionStatus = "draft" | "published" | "flagged" | "retired";

export interface Question {
  id: string;
  text: string;
  category: CategoryId;
  subcategory?: string;
  intensity: number; // 1-5
  relationshipFit: string[];
  minRound?: number;
  maxRound?: number;
  skipSensitivity: SkipSensitivity;
  contentWarningLevel: ContentWarningLevel;
  estimatedAnswerSeconds: number;
  followUpPrompt?: string;
  tags: string[];
  status: QuestionStatus;
  timesShown: number;
  timesCompleted: number;
  timesSkipped: number;
  reportCount: number;
  createdAt: string;
}
