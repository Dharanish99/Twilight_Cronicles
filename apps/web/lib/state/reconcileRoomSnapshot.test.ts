import assert from "node:assert/strict";
import test from "node:test";
import type { AnswerSharedPayload, RoomState } from "@twilight/shared-types";
import { reconcileRoomSnapshot } from "./reconcileRoomSnapshot";

const answer: AnswerSharedPayload = {
  questionId: "question-1",
  text: "A test question?",
  category: "playful",
  answerText: "A test answer.",
  answeredBy: { id: "p2", name: "Player Two", avatar: "rose" },
};

function room(
  phase: RoomState["turn"]["phase"],
  round = 1,
  sharedAnswer: AnswerSharedPayload | null = null,
  roomId = "ROOM1",
): RoomState {
  return {
    roomId,
    inviteToken: "invite-token",
    status: "active",
    expiresAt: "2026-11-18T00:00:00.000Z",
    settings: {
      rounds: 6,
      intensityCeiling: "balanced",
      categories: ["deep", "playful"],
      timerSeconds: null,
    },
    players: [
      { id: "p1", displayName: "Player One", avatar: "ember", connection: "connected", ready: true },
      { id: "p2", displayName: "Player Two", avatar: "rose", connection: "connected", ready: true },
    ],
    turn: {
      activePlayerId: "p1",
      pickerPlayerId: "p1",
      answererPlayerId: "p2",
      tosserPlayerId: "p1",
      round,
      phase,
      skipsThisTurn: 0,
    },
    sharedAnswer,
  };
}

test("uses the answer in an authoritative shared snapshot", () => {
  const result = reconcileRoomSnapshot(room("locked"), null, room("shared", 1, answer));
  assert.equal(result.sharedAnswer?.answerText, answer.answerText);
  assert.equal(result.room.sharedAnswer?.questionId, answer.questionId);
});

test("does not let a same-turn incomplete snapshot erase a delivered reveal", () => {
  const current = room("shared", 1, answer);
  const result = reconcileRoomSnapshot(current, answer, room("shared", 1, null));
  assert.equal(result.sharedAnswer?.answerText, answer.answerText);
  assert.equal(result.room.sharedAnswer?.answerText, answer.answerText);
});

test("does not carry a previous turn reveal into a new turn", () => {
  const current = room("shared", 1, answer);
  const result = reconcileRoomSnapshot(current, answer, room("shared", 2, null));
  assert.equal(result.sharedAnswer, null);
  assert.equal(result.room.sharedAnswer, null);
});

test("clears reveal data as soon as the room leaves the shared phase", () => {
  const current = room("shared", 1, answer);
  const result = reconcileRoomSnapshot(current, answer, room("coin_toss_waiting", 2, answer));
  assert.equal(result.sharedAnswer, null);
  assert.equal(result.room.sharedAnswer, null);
});
