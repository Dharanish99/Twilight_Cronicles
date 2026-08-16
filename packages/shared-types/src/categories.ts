// packages/shared-types/src/categories.ts
export const CATEGORY_IDS = [
  "deep",
  "playful",
  "emotional",
  "curious",
  "memories",
  "future",
  "chaotic",
  "wouldYouRather",
  "friendship",
  "gettingToKnowYou",
] as const;

export type CategoryId = typeof CATEGORY_IDS[number];

export type RelationshipType = "friends" | "more_than_friends" | "just_meeting";

export type AvatarId =
  | "ember"
  | "dusk"
  | "stone"
  | "sage"
  | "plum"
  | "gold"
  | "slate"
  | "rose";

export type ReactionId = "heart" | "spark" | "soft" | "same" | "surprising";

export type TurnPhase =
  | "coin_toss_waiting"
  | "coin_toss_flipping"
  | "choosing_category"
  | "question_loading"
  | "answering"
  | "locked"
  | "shared"
  | "transitioning";

export type IntensityCeiling = "gentle" | "balanced" | "deep";
