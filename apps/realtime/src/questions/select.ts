import { randomInt } from "node:crypto";
import type { CategoryId, RoomSettings } from "@twilight/shared-types";
import seedQuestionData from "../../../../packages/content/seed-questions.json";
import {
  getJson,
  keys,
  ROOM_TTL_SECONDS,
  setJson,
  withRoomLock,
} from "../redis/client";
import { createLivingQuestion } from "./livingDeck";
import {
  emptyPairQuestionHistory,
  PAIR_HISTORY_TTL_SECONDS,
  recordSeedQuestion,
  takeLivingSequence,
  type PairQuestionHistory,
} from "./pairHistory";

export interface SeedQuestion {
  id: string;
  text: string;
  category: string;
  intensity: number;
  minRound: number;
  maxRound?: number;
  relationshipFit: string[];
  tags: string[];
  status: string;
  estimatedAnswerSeconds: number;
  skipSensitivity: string;
  contentWarningLevel: string;
  subcategory?: string;
  followUpPrompt?: string;
}

const seedQuestions = (seedQuestionData as SeedQuestion[]).filter((q) => q.status === "published");

const ROUND_INTENSITY_CEILING: Record<number, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 4,
  5: 4,
  6: 4,
};

function getCeiling(round: number, settings: RoomSettings): number {
  const roundCeiling = ROUND_INTENSITY_CEILING[round] ?? 5;
  const settingsCeiling =
    settings.intensityCeiling === "gentle"
      ? 2
      : settings.intensityCeiling === "balanced"
      ? 4
      : 5;
  return Math.min(roundCeiling, settingsCeiling);
}

interface SelectOptions {
  category: CategoryId;
  round: number;
  settings: RoomSettings;
  /** Questions already used in the current room. */
  sessionId: string;
  /** Opaque server-only identifier for a returning two-player pair. */
  pairHistoryId?: string | null;
  relationshipType?: string;
  previousSubcategory?: string;
}

function pickFrom<T>(items: readonly T[]): T {
  return items[randomInt(items.length)]!;
}

async function selectQuestionUnlocked(opts: SelectOptions): Promise<SeedQuestion> {
  const {
    category,
    round,
    settings,
    sessionId,
    pairHistoryId,
    relationshipType,
    previousSubcategory,
  } = opts;

  const [storedRoomIds, storedPairHistory] = await Promise.all([
    getJson<string[]>(keys.usedQuestions(sessionId)),
    pairHistoryId
      ? getJson<PairQuestionHistory>(keys.pairQuestionHistory(pairHistoryId))
      : Promise.resolve(null),
  ]);
  const usedInRoom = new Set(storedRoomIds ?? []);
  let pairHistory = storedPairHistory ?? emptyPairQuestionHistory();
  const usedByPair = new Set(pairHistory.usedSeedQuestionIds);
  const ceiling = getCeiling(round, settings);

  function filterCandidates(intCeiling: number, ignoreRelationship = false): SeedQuestion[] {
    return seedQuestions.filter((q) => {
      if (q.category !== category) return false;
      if (q.intensity > intCeiling || q.intensity < 1) return false;
      if (q.minRound && round < q.minRound) return false;
      if (q.maxRound && round > q.maxRound) return false;
      if (usedInRoom.has(q.id) || usedByPair.has(q.id)) return false;
      if (!ignoreRelationship && relationshipType && !q.relationshipFit.includes(relationshipType)) {
        return false;
      }
      return true;
    });
  }

  // We progressively relax matching preferences, never the no-repeat rule for
  // this pair. Once curated questions are exhausted, the living deck takes over.
  let candidates = filterCandidates(ceiling);
  if (candidates.length === 0 && relationshipType) candidates = filterCandidates(ceiling, true);
  if (candidates.length === 0) candidates = filterCandidates(ceiling + 1);
  if (candidates.length === 0) candidates = filterCandidates(ceiling + 1, true);
  if (candidates.length === 0) {
    candidates = seedQuestions.filter(
      (q) =>
        q.category === category &&
        q.tags.includes("safe_default") &&
        !usedInRoom.has(q.id) &&
        !usedByPair.has(q.id)
    );
  }
  if (candidates.length === 0) {
    candidates = seedQuestions.filter(
      (q) => q.category === category && !usedInRoom.has(q.id) && !usedByPair.has(q.id)
    );
  }

  let selected: SeedQuestion;
  if (candidates.length > 0) {
    const differentSubcategory = previousSubcategory
      ? candidates.filter((q) => q.subcategory !== previousSubcategory)
      : [];
    selected = pickFrom(differentSubcategory.length > 0 ? differentSubcategory : candidates);
    if (pairHistoryId) pairHistory = recordSeedQuestion(pairHistory, selected.id);
  } else {
    const living = takeLivingSequence(pairHistory, category);
    pairHistory = living.history;
    selected = createLivingQuestion({
      category,
      pairHistoryId: pairHistoryId ?? sessionId,
      sequence: living.sequence,
    });
  }

  usedInRoom.add(selected.id);
  await Promise.all([
    setJson(keys.usedQuestions(sessionId), [...usedInRoom], ROOM_TTL_SECONDS),
    ...(pairHistoryId
      ? [setJson(keys.pairQuestionHistory(pairHistoryId), pairHistory, PAIR_HISTORY_TTL_SECONDS)]
      : []),
  ]);
  return selected;
}

/**
 * Selects a fresh prompt. A pair-level lock makes concurrent rooms for the
 * same returning two people advance the shared deck exactly once per prompt.
 */
export async function selectQuestion(opts: SelectOptions): Promise<SeedQuestion> {
  if (!opts.pairHistoryId) return selectQuestionUnlocked(opts);
  return withRoomLock(`pair-question-history:${opts.pairHistoryId}`, () => selectQuestionUnlocked(opts));
}
