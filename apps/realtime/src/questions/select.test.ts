import assert from "node:assert/strict";
import test from "node:test";
import type { RoomSettings } from "@twilight/shared-types";
import { selectQuestion } from "./select";

const settings: RoomSettings = {
  rounds: 6,
  intensityCeiling: "deep",
  categories: ["playful"],
  timerSeconds: null,
};

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

test("a returning pair never repeats a curated prompt before using the living deck", async () => {
  const pairHistoryId = uniqueId("pair-history");
  const sessionId = uniqueId("room");
  const questions = [];

  for (let index = 0; index < 16; index += 1) {
    questions.push(await selectQuestion({
      category: "playful",
      round: 6,
      settings,
      sessionId,
      pairHistoryId,
    }));
  }

  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
  assert.ok(questions.some((question) => question.id.startsWith("living-playful-")));
});

test("simultaneous rooms for one pair advance their shared prompt history safely", async () => {
  const pairHistoryId = uniqueId("concurrent-pair");
  const [first, second] = await Promise.all([
    selectQuestion({
      category: "curious",
      round: 6,
      settings: { ...settings, categories: ["curious"] },
      sessionId: uniqueId("room-a"),
      pairHistoryId,
    }),
    selectQuestion({
      category: "curious",
      round: 6,
      settings: { ...settings, categories: ["curious"] },
      sessionId: uniqueId("room-b"),
      pairHistoryId,
    }),
  ]);

  assert.notEqual(first.id, second.id);
});
