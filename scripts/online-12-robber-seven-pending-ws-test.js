const { spawn } = require("node:child_process");
const WebSocket = require("ws");

const port = Number(process.env.TEST_PORT || 4877);
const url = `ws://127.0.0.1:${port}/`;
let requestSeq = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function startServer() {
  return spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), NODE_ENV: "test", DEBUG_ONLINE: "0" },
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const session = { ws, roomId: null, playerId: null, playerToken: null, state: null };
    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      if (message.state) session.state = message.state;
    });
    ws.once("open", () => resolve(session));
    ws.once("error", reject);
  });
}

function command(session, name, payload = {}) {
  const requestId = `r${++requestSeq}`;
  const body = {
    type: "command",
    requestId,
    roomId: session.roomId,
    playerId: session.playerId,
    playerToken: session.playerToken,
    payload: { name, ...payload }
  };
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`timeout waiting for ${name}`));
    }, 3000);
    function cleanup() {
      clearTimeout(timer);
      session.ws.off("message", onMessage);
    }
    function onMessage(data) {
      const message = JSON.parse(data.toString());
      if (message.requestId !== requestId) return;
      cleanup();
      if (message.type === "error") {
        const error = new Error(message.message || message.code || "error");
        error.code = message.code;
        reject(error);
        return;
      }
      if (message.roomId) session.roomId = message.roomId;
      if (message.playerId) session.playerId = message.playerId;
      if (message.playerToken) session.playerToken = message.playerToken;
      if (message.state) session.state = message.state;
      resolve(message);
    }
    session.ws.on("message", onMessage);
    session.ws.send(JSON.stringify(body));
  });
}

async function expectReject(label, promise, code) {
  try {
    await promise;
  } catch (error) {
    if (error.code === code) {
      console.log(`ok - ${label}: ${code}`);
      return;
    }
    throw new Error(`${label}: expected ${code}, got ${error.code || error.message}`);
  }
  throw new Error(`${label}: expected rejection ${code}`);
}

const match = (state) => state.matchState;
const resources = ["forest", "field", "pasture", "hill", "mountain"];

function adjacentVertices(state, vertexId) {
  return match(state).edges.filter((edge) => edge.a === vertexId || edge.b === vertexId).map((edge) => (edge.a === vertexId ? edge.b : edge.a));
}

function canSettlement(state, vertexId) {
  const vertex = match(state).vertices[vertexId];
  if (!vertex || vertex.owner !== null) return false;
  return adjacentVertices(state, vertexId).every((id) => match(state).vertices[id].owner === null);
}

function chooseSettlement(state) {
  return match(state).vertices.find((vertex) => canSettlement(state, vertex.id))?.id;
}

function chooseInitialRoad(state, vertexId) {
  return match(state).edges.find((edge) => edge.owner === null && (edge.a === vertexId || edge.b === vertexId))?.id;
}

function chooseTile(state, avoidTileId = match(state).robberTile) {
  return match(state).tiles.find((tile) => tile.id !== avoidTileId && tile.type !== "desert" && tile.number)?.id;
}

async function createPlayRoom() {
  const players = [await connect(), await connect(), await connect()];
  const created = await command(players[0], "createRoom", { playerName: "Host" });
  players.forEach((player) => { player.roomId = created.roomId; });
  await command(players[1], "joinRoom", { roomId: created.roomId, playerName: "Guest A" });
  await command(players[2], "joinRoom", { roomId: created.roomId, playerName: "Guest B" });
  const started = await command(players[0], "startGame");
  players.forEach((player) => { player.state = started.state; });
  for (const seat of [0, 1, 2, 2, 1, 0]) {
    const vertexId = chooseSettlement(players[seat].state);
    await command(players[seat], "placeInitialSettlement", { vertexId });
    await delay(10);
    await command(players[seat], "placeInitialRoad", { edgeId: chooseInitialRoad(players[seat].state, vertexId) });
    await delay(10);
  }
  await delay(80);
  for (let seat = 0; seat < 3; seat += 1) {
    for (const resource of resources) {
      await command(players[0], "testSetPlayerResource", { seatIndex: seat, resource, amount: seat === 0 ? 0 : 2 });
    }
  }
  await delay(50);
  return players;
}

async function closePlayers(players) {
  players.forEach((player) => player.ws.close());
  await delay(20);
}

async function clearAllResources(players) {
  for (let seat = 0; seat < 3; seat += 1) {
    for (const resource of resources) {
      await command(players[0], "testSetPlayerResource", { seatIndex: seat, resource, amount: 0 });
    }
  }
}

async function main() {
  const server = startServer();
  try {
    await delay(500);

    {
      const players = await createPlayRoom();
      for (const resource of resources) {
        await command(players[0], "testSetPlayerResource", { seatIndex: 1, resource, amount: 0 });
        await command(players[0], "testSetPlayerResource", { seatIndex: 2, resource, amount: 0 });
      }
      await command(players[0], "testSetPlayerResource", { seatIndex: 1, resource: "forest", amount: 8 });
      await command(players[0], "testSetPlayerResource", { seatIndex: 2, resource: "forest", amount: 7 });
      await command(players[0], "rollDice", { testTotal: 7 });
      await delay(100);
      const view = match(players[1].state).game.pendingActionView;
      if (match(players[0].state).game.pendingAction !== null) throw new Error("raw pendingAction was exposed");
      if (match(players[0].state).game.pendingActionView.type !== "discardForSeven") throw new Error("roll seven did not create discard pending view");
      if (view.role !== "discarder" || view.needed !== 4) throw new Error("discarder view was not restored");
      await expectReject("non discarder cannot discard", command(players[2], "discardForSeven", { resources: { forest: 3 } }), "DISCARD_NOT_REQUIRED");
      await expectReject("wrong discard total rejected", command(players[1], "discardForSeven", { resources: { forest: 3 } }), "INVALID_DISCARD");
      await command(players[1], "discardForSeven", { resources: { forest: 4 } });
      await delay(100);
      if (match(players[0].state).game.pendingActionView.type !== "moveRobber") throw new Error("discard did not advance to moveRobber");
      await expectReject("endTurn blocked by robber pending", command(players[0], "endTurn"), "INVALID_ACTION");
      console.log("ok - seven creates discard pending and advances to moveRobber");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await clearAllResources(players);
      const tileId = chooseTile(players[0].state);
      await command(players[0], "testSetBoardOwnership", {
        reset: true,
        vertexOwners: [{ vertexId: match(players[0].state).tiles[tileId].vertexIds[0], owner: 1, city: false }]
      });
      await command(players[0], "testSetPlayerResource", { seatIndex: 1, resource: "hill", amount: 1 });
      await command(players[0], "rollDice", { testTotal: 7 });
      await expectReject("same robber tile rejected", command(players[0], "moveRobber", { tileId: match(players[0].state).robberTile }), "ROBBER_SAME_TILE");
      await command(players[0], "moveRobber", { tileId });
      await delay(100);
      const actorResult = match(players[0].state).game.lastRobberResult;
      const victimResult = match(players[1].state).game.lastRobberResult;
      const otherResult = match(players[2].state).game.lastRobberResult;
      if (match(players[0].state).game.pendingActionView !== null) throw new Error("single-victim robber did not finish pending");
      if (actorResult.victimSeatIndex !== 1 || actorResult.resource !== "hill") throw new Error("actor did not see stolen resource");
      if (victimResult.resource !== "hill") throw new Error("victim did not see stolen resource");
      if (otherResult.resource !== null) throw new Error("other saw stolen resource detail");
      console.log("ok - moveRobber auto-steals one victim and preserves result privacy");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await clearAllResources(players);
      const tileId = chooseTile(players[0].state);
      const tile = match(players[0].state).tiles[tileId];
      await command(players[0], "testSetBoardOwnership", {
        reset: true,
        vertexOwners: [
          { vertexId: tile.vertexIds[0], owner: 1, city: false },
          { vertexId: tile.vertexIds[1], owner: 2, city: false }
        ]
      });
      await command(players[0], "testSetPlayerResource", { seatIndex: 1, resource: "forest", amount: 1 });
      await command(players[0], "testSetPlayerResource", { seatIndex: 2, resource: "field", amount: 1 });
      await command(players[0], "rollDice", { testTotal: 7 });
      await command(players[0], "moveRobber", { tileId });
      await delay(100);
      const pending = match(players[0].state).game.pendingActionView;
      if (pending.type !== "chooseRobberVictim") throw new Error("multi-victim robber did not create choice pending");
      if (match(players[0].state).game.pendingActionView.victims.length !== 2) throw new Error("actor did not see victim choices");
      if (match(players[1].state).game.pendingActionView.victims.length !== 0) throw new Error("non-actor saw victim choices");
      await expectReject("invalid victim rejected", command(players[0], "chooseRobberVictim", { victimSeatIndex: 0 }), "INVALID_ROBBER_VICTIM");
      await command(players[0], "chooseRobberVictim", { victimSeatIndex: 2 });
      await delay(100);
      if (match(players[0].state).game.pendingActionView !== null) throw new Error("chooseRobberVictim did not clear pending");
      if (match(players[0].state).game.lastRobberResult.victimSeatIndex !== 2) throw new Error("wrong victim chosen");
      console.log("ok - chooseRobberVictim uses victimSeatIndex and resolves steal");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await clearAllResources(players);
      await command(players[0], "rollDice", { testTotal: 7 });
      const tileId = chooseTile(players[0].state);
      await command(players[0], "moveRobber", { tileId });
      await delay(100);
      if (match(players[0].state).game.lastRobberResult.reason !== "NO_VICTIM") throw new Error("NO_VICTIM result missing");
      console.log("ok - robber move with no victims records NO_VICTIM");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await clearAllResources(players);
      const tileId = chooseTile(players[0].state);
      const tile = match(players[0].state).tiles[tileId];
      await command(players[0], "testSetBoardOwnership", {
        reset: true,
        vertexOwners: [{ vertexId: tile.vertexIds[0], owner: 0, city: false }]
      });
      await command(players[0], "testSetPlayerResource", { seatIndex: 0, resource: tile.type, amount: 0 });
      await command(players[0], "rollDice", { testTotal: 7 });
      await command(players[0], "moveRobber", { tileId });
      await command(players[0], "endTurn");
      await command(players[1], "rollDice", { testTotal: tile.number });
      await delay(100);
      if ((match(players[0].state).game.players[0].resources[tile.type] || 0) !== 0) throw new Error("robber tile produced resources");
      console.log("ok - robberTile blocks later production");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await clearAllResources(players);
      const tileId = chooseTile(players[0].state);
      const tile = match(players[0].state).tiles[tileId];
      await command(players[0], "testSetBoardOwnership", {
        reset: true,
        vertexOwners: [
          { vertexId: tile.vertexIds[0], owner: 1, city: false },
          { vertexId: tile.vertexIds[1], owner: 2, city: false }
        ]
      });
      await command(players[0], "testSetBankResource", { resource: tile.type, amount: 1 });
      await command(players[0], "rollDice", { testTotal: tile.number });
      await delay(100);
      if ((match(players[1].state).game.players[1].resources[tile.type] || 0) !== 0) throw new Error("bank shortage paid first affected player");
      if ((match(players[2].state).game.players[2].resources[tile.type] || 0) !== 0) throw new Error("bank shortage paid second affected player");
      if ((match(players[0].state).game.bank[tile.type] || 0) !== 1) throw new Error("bank shortage should leave scarce resource in bank");
      console.log("ok - bank shortage skips multi-player production for scarce resource");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await clearAllResources(players);
      const tileId = chooseTile(players[0].state);
      await command(players[0], "testSetPlayerDevCards", { seatIndex: 0, cardTypes: ["knight"] });
      const card = match(players[0].state).game.players[0].dev[0];
      await command(players[0], "playDevCard", { cardId: card.id });
      await delay(100);
      if (match(players[0].state).game.pendingActionView.type !== "moveRobber") throw new Error("knight did not create moveRobber pending");
      if (match(players[0].state).game.pendingActionView.source !== "knight") throw new Error("knight pending source incorrect");
      if (match(players[0].state).game.pendingDiscards.length) throw new Error("knight created discard pending");
      await command(players[0], "moveRobber", { tileId });
      await delay(100);
      if (match(players[0].state).game.pendingActionView) throw new Error("knight robber pending did not resolve");
      console.log("ok - knight enters robber flow without discard");
      await closePlayers(players);
    }

    console.log("online-12 robber seven pending websocket tests passed");
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
