import type { AnswerSharedPayload, RoomState } from "@twilight/shared-types";

/**
 * Keeps the reveal transition atomic at the client boundary. A room snapshot is
 * authoritative when it includes the answer. If a same-turn shared snapshot is
 * missing that field, retain the payload already delivered by turn:answer_shared
 * instead of clearing it and rendering an empty stage.
 */
export function reconcileRoomSnapshot(
  currentRoom: RoomState | null,
  currentAnswer: AnswerSharedPayload | null,
  incomingRoom: RoomState,
): { room: RoomState; sharedAnswer: AnswerSharedPayload | null } {
  if (incomingRoom.turn.phase !== "shared") {
    const room = { ...incomingRoom, sharedAnswer: null };
    return { room, sharedAnswer: null };
  }

  const isSameSharedTurn =
    currentRoom?.roomId === incomingRoom.roomId &&
    currentRoom.turn.round === incomingRoom.turn.round &&
    currentRoom.turn.phase === "shared";
  const sharedAnswer =
    incomingRoom.sharedAnswer ??
    (isSameSharedTurn ? currentAnswer ?? currentRoom?.sharedAnswer ?? null : null);
  const room = { ...incomingRoom, sharedAnswer };

  return { room, sharedAnswer };
}
