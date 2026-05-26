const { spawn } = require("node:child_process");
const WebSocket = require("ws");

const port = Number(process.env.TEST_PORT || 4874);
const url = `ws://127.0.0.1:${port}/`;
let requestSeq = 0;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startServer() {
  return spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), NODE_ENV: "test", DEBUG_ONLINE: "0" },
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function connect(name) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const session = { ws, name, roomId: null, playerId: null, playerToken: null, state: null };
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

function adjacentVertices(state, vertexId) {
  return match(state).edges
    .filter((edge) => edge.a === vertexId || edge.b === vertexId)
    .map((edge) => (edge.a === vertexId ? edge.b : edge.a));
}

function adjacentTiles(state, vertexId) {
  return match(state).tiles.filter((tile) => tile.vertexIds.includes(vertexId));
}

function vertexResources(state, vertexId) {
  return new Set(adjacentTiles(state, vertexId).map((tile) => tile.type).filter((type) => type !== "desert"));
}

function canSettlement(state, vertexId) {
  const vertex = match(state).vertices[vertexId];
  if (!vertex || vertex.owner !== null) return false;
  return adjacentVertices(state, vertexId).every((id) => match(state).vertices[id].owner === null);
}

function scoreVertex(state, vertexId, wanted) {
  const resources = vertexResources(state, vertexId);
  return wanted.reduce((sum, type) => sum + (resources.has(type) ? 1 : 0), 0) * 10 + resources.size;
}

function chooseSettlement(state, wanted = []) {
  return match(state).vertices
    .filter((vertex) => canSettlement(state, vertex.id))
    .sort((a, b) => scoreVertex(state, b.id, wanted) - scoreVertex(state, a.id, wanted))[0]?.id;
}

function chooseInitialRoad(state, vertexId) {
  return match(state).edges.find((edge) => edge.owner === null && (edge.a === vertexId || edge.b === vertexId))?.id;
}

function hostProductionMap(state) {
  const result = new Map();
  const robberTile = match(state).robberTile;
  for (const vertex of match(state).vertices.filter((entry) => entry.owner === 0)) {
    for (const tile of adjacentTiles(state, vertex.id)) {
      if (tile.type === "desert" || tile.id === robberTile || !tile.number) continue;
      if (!result.has(tile.type)) result.set(tile.type, tile.number);
    }
  }
  return result;
}

async function createStartedRoom() {
  const players = [await connect("Host"), await connect("Guest A"), await connect("Guest B")];
  const created = await command(players[0], "createRoom", { playerName: "Host" });
  const roomId = created.roomId;
  players.forEach((player) => { player.roomId = roomId; });
  await command(players[1], "joinRoom", { roomId, playerName: "Guest A" });
  await command(players[2], "joinRoom", { roomId, playerName: "Guest B" });
  const started = await command(players[0], "startGame");
  players.forEach((player) => { player.state = started.state; });

  for (const seat of [0, 1, 2, 2, 1, 0]) {
    const wanted = seat === 0 ? ["forest", "hill", "pasture", "field", "mountain"] : [];
    const vertexId = chooseSettlement(players[seat].state, wanted);
    await command(players[seat], "placeInitialSettlement", { vertexId });
    await delay(20);
    await command(players[seat], "placeInitialRoad", { edgeId: chooseInitialRoad(players[seat].state, vertexId) });
    await delay(20);
  }
  await delay(100);
  return players;
}

async function rollAndEnd(player, total) {
  await command(player, "rollDice", { testTotal: total });
  await command(player, "endTurn");
}

async function cycleHostRoll(players, total) {
  await rollAndEnd(players[0], total);
  await rollAndEnd(players[1], 2);
  await rollAndEnd(players[2], 2);
}

async function makeTradeRoom() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const players = await createStartedRoom();
    const production = hostProductionMap(players[0].state);
    const resources = ["forest", "hill", "pasture", "field", "mountain"];
    if (resources.every((type) => production.has(type))) {
      for (const type of resources) {
        for (let i = 0; i < 4; i += 1) await cycleHostRoll(players, production.get(type));
      }
      await command(players[0], "rollDice", { testTotal: production.get("forest") });
      return players;
    }
    players.forEach((player) => player.ws.close());
  }
  throw new Error("could not create trade fixture");
}

async function main() {
  const server = startServer();
  try {
    await delay(500);

    {
      const players = await createStartedRoom();
      await expectReject("trade before roll", command(players[0], "bankTrade", { give: "forest", get: "field" }), "ROLL_REQUIRED");
      await command(players[0], "rollDice", { testTotal: 2 });
      await expectReject("wrong turn trade", command(players[1], "bankTrade", { give: "forest", get: "field" }), "NOT_YOUR_TURN");
      await expectReject("same resource trade", command(players[0], "bankTrade", { give: "forest", get: "forest" }), "SAME_RESOURCE");
      await expectReject("invalid resource trade", command(players[0], "bankTrade", { give: "bogus", get: "field" }), "INVALID_RESOURCE");
      players.forEach((player) => player.ws.close());
    }

    {
      const players = await makeTradeRoom();
      const host = match(players[0].state).game.players[0];
      const give = Object.entries(host.resources).find(([type, amount]) => amount >= (host.trade.ratios[type] || 4))[0];
      const get = Object.keys(host.resources).find((type) => type !== give && match(players[0].state).game.bank[type] > 0);
      const beforeGive = host.resources[give];
      const ratio = host.trade.ratios[give];
      await command(players[0], "bankTrade", { give, get });
      await delay(100);
      const afterHost = match(players[0].state).game.players[0];
      if (afterHost.resources[give] !== beforeGive - ratio) throw new Error("viewer resource detail did not decrease by ratio");
      if (afterHost.resources[get] < host.resources[get] + 1) throw new Error("viewer resource detail did not receive resource");
      const opponentHostView = match(players[1].state).game.players[0];
      if (opponentHostView.resources) throw new Error("opponent view leaked resource details");
      if (typeof opponentHostView.resourceCount !== "number") throw new Error("opponent view missing resourceCount");
      console.log("ok - bankTrade success and private view preserved");
      players[2].ws.close();
      await delay(200);
      await expectReject("connected=false blocks trade", command(players[0], "bankTrade", { give, get }), "ROOM_NOT_READY");
      players.forEach((player) => player.ws.close());
    }

    {
      const players = await createStartedRoom();
      await command(players[0], "rollDice", { testTotal: 2 });
      const give = "forest";
      const get = "field";
      await command(players[0], "testSetPlayerResource", { resource: give, amount: 4 });
      await command(players[0], "testSetBankResource", { resource: get, amount: 0 });
      await expectReject("bank resource empty blocks trade", command(players[0], "bankTrade", { give, get }), "BANK_RESOURCE_EMPTY");
      players.forEach((player) => player.ws.close());
    }

    {
      const players = await makeTradeRoom();
      const host = match(players[0].state).game.players[0];
      const give = Object.entries(host.resources).find(([type, amount]) => amount >= (host.trade.ratios[type] || 4))[0];
      const get = Object.keys(host.resources).find((type) => type !== give);
      await command(players[0], "leaveRoom");
      await delay(100);
      await expectReject("ended room blocks trade", command(players[1], "bankTrade", { give, get }), "ROOM_ENDED");
      players.forEach((player) => player.ws.close());
    }

    console.log("online-09 bank trade websocket tests passed");
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
