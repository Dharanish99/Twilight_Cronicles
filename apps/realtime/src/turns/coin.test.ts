import assert from "node:assert/strict";
import test from "node:test";
import { pickCoinTossWinner } from "./coin";

test("coin toss index zero selects the first player", () => {
  assert.equal(pickCoinTossWinner(["first", "second"], 0), "first");
});

test("coin toss index one selects the second player", () => {
  assert.equal(pickCoinTossWinner(["first", "second"], 1), "second");
});

test("coin toss rejects a result outside the two-player range", () => {
  assert.throws(() => pickCoinTossWinner(["first", "second"], 2), RangeError);
});
