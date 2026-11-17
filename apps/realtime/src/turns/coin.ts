import { randomInt } from "node:crypto";

/** Resolve the shared coin-toss outcome once on the server using an unbiased index. */
export function pickCoinTossWinner<T>(
  players: readonly [T, T],
  resultIndex = randomInt(2),
): T {
  if (resultIndex !== 0 && resultIndex !== 1) {
    throw new RangeError("Coin toss result must be either player index 0 or 1");
  }
  return players[resultIndex];
}
