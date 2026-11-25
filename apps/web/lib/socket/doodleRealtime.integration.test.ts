import assert from "node:assert/strict";
import test from "node:test";
import { io, type Socket } from "socket.io-client";

type RoomSnapshot = {
  roomId: string;
  players: Array<{ id: string; ready: boolean } | undefined>;
  turn: {
    phase: string;
    round: number;
    pickerPlayerId: string;
    answererPlayerId: string;
  };
};

type Identity = { playerId: string; roomId: string; sessionToken: string };
type Doodle = { id: string; senderPlayerId: string; round: number; dataUrl: string };
type DoodleResult = { ok: boolean; reason?: string };

function waitFor<T>(
  socket: Socket,
  event: string,
  matches: (payload: T) => boolean = () => true,
  timeoutMs = 8_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);
    const handler = (payload: T) => {
      if (!matches(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    };
    socket.on(event, handler);
  });
}

function connect(url: string): Promise<Socket> {
  const socket = io(url, { forceNew: true, transports: ["websocket"] });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error("Timed out connecting to the realtime service"));
    }, 8_000);
    socket.once("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timer);
      socket.disconnect();
      reject(error);
    });
  });
}

function waitForIdentity(socket: Socket, timeoutMs = 8_000): Promise<Identity> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for room:identity"));
    }, timeoutMs);
    const cleanup = () => {
      clearTimeout(timer);
      socket.off("room:identity", onIdentity);
      socket.off("error:generic", onError);
      socket.off("error:invalid_room", onError);
      socket.off("error:room_full", onError);
    };
    const onIdentity = (identity: Identity) => {
      cleanup();
      resolve(identity);
    };
    const onError = (payload: { reason?: string }) => {
      cleanup();
      reject(new Error(`Realtime service rejected the request: ${payload.reason ?? "unknown reason"}`));
    };
    socket.on("room:identity", onIdentity);
    socket.on("error:generic", onError);
    socket.on("error:invalid_room", onError);
    socket.on("error:room_full", onError);
  });
}

function sendDoodle(
  socket: Socket,
  payload: { dataUrl: string; round: number; clientId: string },
): Promise<DoodleResult> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out waiting for doodle acknowledgement")), 8_000);
    socket.emit("doodle:send", payload, (result: DoodleResult) => {
      clearTimeout(timer);
      resolve(result);
    });
  });
}

test("doodle acknowledgement and broadcast stay in sync for both players", {
  skip: !process.env.REALTIME_URL,
  timeout: 20_000,
}, async (t) => {
  const realtimeUrl = process.env.REALTIME_URL;
  assert.ok(realtimeUrl);
  const sockets: Socket[] = [];
  t.after(() => sockets.forEach((socket) => socket.disconnect()));

  const playerOne = await connect(realtimeUrl);
  sockets.push(playerOne);
  const playerOneIdentity = waitForIdentity(playerOne);
  const firstRoomSnapshot = waitFor<RoomSnapshot>(playerOne, "room:state_snapshot");
  playerOne.emit("room:create", {
    displayName: "Doodle Tester One",
    avatar: "ember",
    relationshipType: "friends",
    settings: {
      rounds: 6,
      intensityCeiling: "gentle",
      categories: ["playful", "curious"],
      timerSeconds: null,
    },
  });
  const [identityOne] = await Promise.all([playerOneIdentity, firstRoomSnapshot]);

  const playerTwo = await connect(realtimeUrl);
  sockets.push(playerTwo);
  const playerTwoIdentity = waitForIdentity(playerTwo);
  const joinedRoom = waitFor<RoomSnapshot>(
    playerOne,
    "room:state_snapshot",
    (room) => room.players.filter(Boolean).length === 2,
  );
  playerTwo.emit("room:join", {
    roomCode: identityOne.roomId,
    displayName: "Doodle Tester Two",
    avatar: "rose",
    relationshipType: "friends",
  });
  const [identityTwo] = await Promise.all([playerTwoIdentity, joinedRoom]);

  const bothReady = waitFor<RoomSnapshot>(
    playerOne,
    "room:state_snapshot",
    (room) => room.players.every((player) => player?.ready),
  );
  playerOne.emit("room:ready");
  playerTwo.emit("room:ready");
  await bothReady;

  const gameStarted = waitFor<RoomSnapshot>(
    playerOne,
    "room:state_snapshot",
    (room) => room.turn.phase === "coin_toss_waiting",
  );
  playerOne.emit("game:start");
  await gameStarted;

  const tossStarted = waitFor<RoomSnapshot>(
    playerOne,
    "room:state_snapshot",
    (room) => room.turn.phase === "coin_toss_flipping",
  );
  playerOne.emit("turn:flip_coin");
  await tossStarted;

  const categoryChoice = waitFor<RoomSnapshot>(
    playerOne,
    "room:state_snapshot",
    (room) => room.turn.phase === "choosing_category",
    10_000,
  );
  const choosingRoom = await categoryChoice;
  const picker = choosingRoom.turn.pickerPlayerId === identityOne.playerId ? playerOne : playerTwo;
  const answerer = choosingRoom.turn.answererPlayerId === identityOne.playerId ? playerOne : playerTwo;
  const waitingPlayer = answerer === playerOne ? playerTwo : playerOne;
  const waitingIdentity = answerer === playerOne ? identityTwo : identityOne;

  const answeringState = waitFor<RoomSnapshot>(
    playerOne,
    "room:state_snapshot",
    (room) => room.turn.phase === "answering",
  );
  picker.emit("turn:select_category", { category: "playful" });
  const roomWhileAnswering = await answeringState;

  const clientId = `doodle_integration_${Date.now().toString(36)}`;
  const payload = {
    dataUrl: "data:image/jpeg;base64,AA==",
    round: roomWhileAnswering.turn.round,
    clientId,
  };
  const playerOneBroadcast = waitFor<Doodle>(playerOne, "doodle:new");
  const playerTwoBroadcast = waitFor<Doodle>(playerTwo, "doodle:new");
  const acknowledgement = await sendDoodle(waitingPlayer, payload);
  const [receivedByOne, receivedByTwo] = await Promise.all([playerOneBroadcast, playerTwoBroadcast]);

  assert.deepEqual(acknowledgement, { ok: true });
  assert.equal(receivedByOne.id, clientId);
  assert.equal(receivedByTwo.id, clientId);
  assert.equal(receivedByOne.senderPlayerId, waitingIdentity.playerId);
  assert.equal(receivedByOne.dataUrl, payload.dataUrl);

  const retryAcknowledgement = await sendDoodle(waitingPlayer, payload);
  assert.deepEqual(retryAcknowledgement, { ok: true });

  const rejectedAcknowledgement = await sendDoodle(answerer, {
    ...payload,
    clientId: `${clientId}_answerer`,
  });
  assert.equal(rejectedAcknowledgement.ok, false);
  assert.match(rejectedAcknowledgement.reason ?? "", /available while your partner is answering/i);
});
