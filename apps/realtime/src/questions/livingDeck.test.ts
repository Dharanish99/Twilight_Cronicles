import assert from "node:assert/strict";
import test from "node:test";
import { CATEGORY_IDS } from "@twilight/shared-types";
import { createLivingQuestion, livingQuestionCount } from "./livingDeck";

test("every living deck has a large, unique first rotation", () => {
  for (const category of CATEGORY_IDS) {
    const count = livingQuestionCount(category);
    assert.ok(count >= 700, `${category} should offer a long generated rotation`);

    const questions = Array.from({ length: count }, (_, sequence) =>
      createLivingQuestion({ category, pairHistoryId: "test-pair", sequence })
    );
    assert.equal(new Set(questions.map((question) => question.id)).size, count);
    assert.equal(new Set(questions.map((question) => question.text)).size, count);
    assert.ok(questions.every((question) => question.tags.includes("living_deck")));
  }
});

test("living deck order remains stable for the same pair", () => {
  const firstForPair = createLivingQuestion({
    category: "playful",
    pairHistoryId: "pair-one",
    sequence: 0,
  });
  const repeatedForPair = createLivingQuestion({
    category: "playful",
    pairHistoryId: "pair-one",
    sequence: 0,
  });
  assert.deepEqual(firstForPair, repeatedForPair);
});
