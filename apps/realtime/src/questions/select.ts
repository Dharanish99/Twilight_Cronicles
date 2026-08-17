import type { CategoryId, RoomSettings } from "@twilight/shared-types";
import path from "path";
import fs from "fs";
import { redisClient, keys } from "../redis/client";

const SEED_PATH = path.resolve(
  __dirname,
  "../../../../packages/content/seed-questions.json"
);

export interface SeedQuestion {
  id: string;
  text: string;
  category: string;
  intensity: number;
  minRound: number;
  relationshipFit: string[];
  tags: string[];
  status: string;
  estimatedAnswerSeconds: number;
  skipSensitivity: string;
  contentWarningLevel: string;
  subcategory?: string;
  followUpPrompt?: string;
}

let seedQuestions: SeedQuestion[] = [];

function loadSeed() {
  if (seedQuestions.length > 0) return;
  try {
    const raw = fs.readFileSync(SEED_PATH, "utf-8");
    const all = JSON.parse(raw) as SeedQuestion[];
    seedQuestions = all.filter((q) => q.status === "published");
    console.log(`[questions] Loaded ${seedQuestions.length} seed questions`);
  } catch (err) {
    console.warn("[questions] Failed to load seed questions file directly, trying fallback:", err);
  }
}

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
  sessionId: string;
  skipsThisTurn?: number;
  relationshipType?: string;
  previousSubcategory?: string;
}

export async function selectQuestion(
  opts: SelectOptions
): Promise<SeedQuestion | null> {
  loadSeed();

  const {
    category,
    round,
    settings,
    sessionId,
    skipsThisTurn = 0,
    relationshipType,
    previousSubcategory,
  } = opts;

  let usedIds = new Set<string>();
  try {
    if (redisClient.status === "ready") {
      const members = await redisClient.smembers(keys.usedQuestions(sessionId));
      usedIds = new Set(members);
    }
  } catch {
    // fallback
  }

  let ceiling = getCeiling(round, settings);
  if (skipsThisTurn >= 2) ceiling = Math.max(1, ceiling - 1);

  function filterCandidates(intCeiling: number, ignoreRelationship = false): SeedQuestion[] {
    return seedQuestions.filter((q) => {
      if (q.category !== category) return false;
      if (q.intensity > intCeiling) return false;
      if (q.intensity < 1) return false;
      if (q.minRound && round < q.minRound) return false;
      if (usedIds.has(q.id)) return false;
      // Apply relationship filter to all categories unless told to ignore it
      if (!ignoreRelationship && relationshipType && !q.relationshipFit.includes(relationshipType)) {
        return false;
      }
      return true;
    });
  }

  let candidates = filterCandidates(ceiling);

  // Fallback 1: drop relationship filter (keeps intensity constraint)
  if (candidates.length === 0 && relationshipType) {
    candidates = filterCandidates(ceiling, true);
  }

  // Fallback 2: widen intensity by 1 (with relationship filter)
  if (candidates.length === 0) {
    candidates = filterCandidates(ceiling + 1);
  }

  // Fallback 3: widen intensity AND drop relationship filter
  if (candidates.length === 0) {
    candidates = filterCandidates(ceiling + 1, true);
  }

  // Fallback 4: safe-default questions in the same category
  if (candidates.length === 0) {
    candidates = seedQuestions.filter(
      (q) => q.category === category && q.tags.includes("safe_default") && !usedIds.has(q.id)
    );
  }

  // Fallback 5: any unused question in this category
  if (candidates.length === 0) {
    candidates = seedQuestions.filter((q) => q.category === category && !usedIds.has(q.id));
  }

  // Fallback 6: any question in this category (pool exhausted)
  if (candidates.length === 0) {
    candidates = seedQuestions.filter((q) => q.category === category);
  }

  if (candidates.length === 0) {
    return {
      id: `fallback-${Date.now()}`,
      text: "What is something on your mind tonight that you haven't said out loud yet?",
      category,
      intensity: 2,
      minRound: 1,
      relationshipFit: ["friends", "more_than_friends", "just_meeting"],
      tags: ["safe_default"],
      status: "published",
      estimatedAnswerSeconds: 60,
      skipSensitivity: "standard",
      contentWarningLevel: "none",
    };
  }

  let pool = candidates;
  if (previousSubcategory) {
    const diffSub = candidates.filter((q) => q.subcategory !== previousSubcategory);
    if (diffSub.length > 0) pool = diffSub;
  }

  // Fresh uniform random pick — no ordering bias
  const picked = pool[Math.floor(Math.random() * pool.length)]!;
  return picked;
}
