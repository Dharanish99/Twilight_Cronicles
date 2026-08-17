/**
 * Copy pools for Twilight Chronicles.
 * All pools live here so they can be shared between components and tested in isolation.
 *
 * pickCopy(): weighted random selection — same rigor as the question-randomisation fix.
 * Weights are whole integers; a weight of N is equivalent to including the item N times.
 * The function never sequences or cycles — each call is an independent uniform draw
 * from the expanded pool, so it can't be predicted or gamed into a fixed rotation.
 */

export interface WeightedLine {
  text: string;
  weight: number;
}

/**
 * Weighted random pick from a pool.
 * Pure function — no side effects, no persistent state.
 */
export function pickCopy(pool: WeightedLine[]): string {
  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight === 0) return pool[0]?.text ?? "";

  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.text;
  }
  // Floating-point safety: return last item
  return pool[pool.length - 1]!.text;
}

// ─── Copy Pools ───────────────────────────────────────────────────────────────

/**
 * Shown during the question-loading beat (category chosen → question arrives).
 * Pick once per turn, hold for the fixed 400–900ms loading beat.
 * Weight keeps the default line as plurality so brand voice doesn't dilute.
 */
export const CHOOSING_QUESTION_COPY: WeightedLine[] = [
  { text: "Choosing your question...", weight: 4 },
  { text: "Thinking of something for you...", weight: 2 },
  { text: "Picking something worth asking...", weight: 2 },
  { text: "One moment...", weight: 1 },
  { text: "This one's for you...", weight: 1 },
];

/**
 * Time-tiered copy for the answering-phase waiting screen.
 * afterSeconds = elapsed seconds in the answering phase.
 * The consuming component picks the tier with the highest afterSeconds
 * that has been passed. {name} is replaced with the partner's display name.
 */
export interface TimedLine {
  afterSeconds: number;
  text: string;
}

export const WAITING_ANSWERING_COPY: TimedLine[] = [
  { afterSeconds: 0,  text: "{name} is answering..." },
  { afterSeconds: 20, text: "{name} is still thinking..." },
  { afterSeconds: 45, text: "Good answers take a moment." },
  { afterSeconds: 90, text: "Almost there." },
];

/**
 * Shown only when the just-locked question's intensity >= 5.
 * Only shown to the answerer; never broadcast.
 * Pick fresh on each lock — don't hold a stable choice per session.
 */
export const HIGH_INTENSITY_LOCK_ACK: WeightedLine[] = [
  { text: "That one wasn't easy.", weight: 1 },
  { text: "Thanks for being honest.", weight: 1 },
  { text: "That's a real answer.", weight: 1 },
];

/**
 * Get the appropriate timed copy tier for elapsed seconds.
 * Returns the highest matching tier text, with {name} replaced.
 */
export function getTimedCopy(elapsedSeconds: number, name: string): string {
  let chosen = WAITING_ANSWERING_COPY[0]!;
  for (const tier of WAITING_ANSWERING_COPY) {
    if (elapsedSeconds >= tier.afterSeconds) {
      chosen = tier;
    }
  }
  return chosen.text.replace("{name}", name);
}
