import { createHmac } from "node:crypto";
import type { CategoryId, PlayerState } from "@twilight/shared-types";

/** Keep a pair's prompt history long enough to cover recurring play. */
export const PAIR_HISTORY_TTL_SECONDS = 90 * 24 * 60 * 60;

export interface PairQuestionHistory {
  version: 1;
  /** Curated prompt IDs already shown to this pair across rooms. */
  usedSeedQuestionIds: string[];
  /** Monotonic per-category position in the generated living deck. */
  nextLivingSequence: Partial<Record<CategoryId, number>>;
  updatedAt: string;
}

const MAX_RETAINED_SEED_IDS = 2_000;

function normalizeName(name: string): string {
  return name.normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

/**
 * Builds an opaque, order-independent identifier for a returning pair. The
 * identifier is used only as a Redis key suffix, never sent to either browser.
 */
export function getPairQuestionHistoryId(players: readonly PlayerState[]): string | null {
  if (players.length !== 2 || !players[0] || !players[1]) return null;

  const names = players.map((player) => normalizeName(player.displayName)).sort();
  if (!names[0] || !names[1]) return null;

  const relationship = players
    .map((player) => player.relationshipTypeShared ?? "unspecified")
    .sort()
    .join("|");
  // Redis is private in production. A deployment-specific secret makes this
  // identifier non-enumerable; REDIS_URL still provides a secret fallback for
  // existing deployments while PAIR_HISTORY_SECRET can be set explicitly.
  const secret = process.env.PAIR_HISTORY_SECRET ?? process.env.REDIS_URL ?? "twilight-local-pair-history";
  return createHmac("sha256", secret)
    .update(`pair-history:v1|${relationship}|${names.join("|")}`)
    .digest("hex");
}

export function emptyPairQuestionHistory(now = new Date().toISOString()): PairQuestionHistory {
  return {
    version: 1,
    usedSeedQuestionIds: [],
    nextLivingSequence: {},
    updatedAt: now,
  };
}

export function recordSeedQuestion(
  history: PairQuestionHistory,
  questionId: string,
  now = new Date().toISOString(),
): PairQuestionHistory {
  const ids = history.usedSeedQuestionIds.includes(questionId)
    ? history.usedSeedQuestionIds
    : [...history.usedSeedQuestionIds, questionId].slice(-MAX_RETAINED_SEED_IDS);
  return { ...history, usedSeedQuestionIds: ids, updatedAt: now };
}

export function takeLivingSequence(
  history: PairQuestionHistory,
  category: CategoryId,
  now = new Date().toISOString(),
): { sequence: number; history: PairQuestionHistory } {
  const sequence = history.nextLivingSequence[category] ?? 0;
  return {
    sequence,
    history: {
      ...history,
      nextLivingSequence: {
        ...history.nextLivingSequence,
        [category]: sequence + 1,
      },
      updatedAt: now,
    },
  };
}
