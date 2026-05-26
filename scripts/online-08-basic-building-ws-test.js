const { spawn } = require("node:child_process");
const WebSocket = require("ws");

const port = Number(process.env.TEST_PORT || 4873);
const url = `ws://127.0.0.1:${port}/`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startServer() {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), NODE_ENV: "test", DEBUG_ONLINE: "0" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  return child;
}

function connect(name) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const session = { ws, name, roomId: null, playerId: null, playerToken: null, state: null, messages: [] };
    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      session.messages.push(message);
      if (message.state) session.state = message.state;
    });
    ws.once("open", () => resolve(session));
    ws.once("error", reject);
  });
}

let requestSeq = 0;

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
        error.response = message;
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

function match(state) {
  return state.matchState;
}

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

function canConnectThrough(state, seat, vertexId) {
  const owner = match(state).vertices[vertexId].owner;
  return owner === null || owner === seat;
}

function canRoad(state, seat, edgeId) {
  const edge = match(state).edges[edgeId];
  if (!edge || edge.owner !== null) return false;
  const touchesOwnBuilding = match(state).vertices[edge.a].owner === seat || match(state).vertices[edge.b].owner === seat;
  const touchesOwnRoad = [edge.a, edge.b].some((vertexId) => {
    if (!canConnectThrough(state, seat, vertexId)) return false;
    return match(state).edges.some((other) => other.id !== edgeId && other.owner === seat && (other.a === vertexId || other.b === vertexId));
  });
  return touchesOwnBuilding || touchesOwnRoad;
}

function canSettlementWithRoad(state, seat, vertexId) {
  if (!canSettlement(state, vertexId)) return false;
  return match(state).edges.some((edge) => edge.owner === seat && (edge.a === vertexId || edge.b === vertexId));
}

function chooseRoadThenSettlement(state, seat) {
  for (const edge of match(state).edges) {
    if (!canRoad(state, seat, edge.id)) continue;
    const clone = JSON.parse(JSON.stringify(state));
    clone.matchState.edges[edge.id].owner = seat;
    const vertexId = [edge.a, edge.b].find((id) => canSettlementWithRoad(clone, seat, id));
    if (vertexId !== undefined) return { edgeId: edge.id, vertexId };
  }
  return null;
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
  for (const player of players) player.roomId = roomId;
  await command(players[1], "joinRoom", { roomId, playerName: "Guest A" });
  await command(players[2], "joinRoom", { roomId, playerName: "Guest B" });
  const started = await command(players[0], "startGame");
  players.forEach((player) => {
    player.state = started.state;
  });

  const sequence = [0, 1, 2, 2, 1, 0];
  for (const seat of sequence) {
    const state = players[seat].state;
    const wanted = seat === 0 ? ["forest", "hill", "pasture", "field", "mountain"] : [];
    const vertexId = chooseSettlement(state, wanted);
    if (vertexId === undefined) throw new Error("no legal initial settlement");
    await command(players[seat], "placeInitialSettlement", { vertexId });
    await delay(20);
    const edgeId = chooseInitialRoad(players[seat].state, vertexId);
    if (edgeId === undefined) throw new Error("no legal initial road");
    await command(players[seat], "placeInitialRoad", { edgeId });
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

async function makeRichPlayableRoom() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const players = await createStartedRoom();
    const production = hostProductionMap(players[0].state);
    const needed = ["forest", "hill", "pasture", "field", "mountain"];
    if (needed.every((type) => production.has(type))) {
      for (const type of needed) {
        for (let i = 0; i < 4; i += 1) await cycleHostRoll(players, production.get(type));
      }
      await command(players[0], "rollDice", { testTotal: production.get("forest") });
      for (const resource of needed) {
        await command(players[0], "testSetPlayerResource", { seatIndex: 0, resource, amount: 6 });
      }
      return players;
    }
    players.forEach((player) => player.ws.close());
  }
  throw new Error("could not create a host with all producible resource types");
}

async function main() {
  const server = startServer();
  try {
    await delay(500);

    {
      const players = await createStartedRoom();
      const roadId = match(players[0].state).edges.find((edge) => canRoad(players[0].state, 0, edge.id))?.id;
      await expectReject("build before roll", command(players[0], "buildRoad", { edgeId: roadId }), "ROLL_REQUIRED");
      await command(players[0], "rollDice", { testTotal: 2 });
      await expectReject("wrong turn buildRoad", command(players[1], "buildRoad", { edgeId: roadId }), "NOT_YOUR_TURN");
      await expectReject("invalid edge", command(players[0], "buildRoad", { edgeId: -1 }), "INVALID_PLACEMENT");
      await expectReject("not enough resources city", command(players[0], "buildCity", { vertexId: match(players[0].state).vertices.find((v) => v.owner === 0)?.id }), "NOT_ENOUGH_RESOURCES");
      players.forEach((player) => player.ws.close());
    }

    {
      const players = await makeRichPlayableRoom();
      const plan = chooseRoadThenSettlement(players[0].state, 0);
      if (!plan) throw new Error("no road plus settlement plan");
      await command(players[0], "buildRoad", { edgeId: plan.edgeId });
      await delay(100);
      console.log("ok - current player buildRoad success");
      if (match(players[1].state).edges[plan.edgeId].owner !== 0) throw new Error("client edge state did not sync");
      console.log("ok - road synced to opponent view");
      await command(players[0], "buildSettlement", { vertexId: plan.vertexId });
      await delay(100);
      console.log("ok - current player buildSettlement success");
      if (match(players[1].state).vertices[plan.vertexId].owner !== 0) throw new Error("client vertex state did not sync");
      console.log("ok - settlement synced to opponent view");
      const cityVertex = match(players[0].state).vertices.find((vertex) => vertex.owner === 0 && !vertex.city)?.id;
      await command(players[0], "buildCity", { vertexId: cityVertex });
      await delay(100);
      console.log("ok - current player buildCity success");
      const opponentHost = match(players[1].state).game.players[0];
      if (opponentHost.resources) throw new Error("opponent view leaked host resource details");
      if (typeof opponentHost.resourceCount !== "number") throw new Error("opponent view missing host resourceCount");
      console.log("ok - opponent resource details hidden");
      if (match(players[0].state).game.players[0].publicPoints < 3) throw new Error("public points did not update");
      console.log("ok - victory points updated");
      players[2].ws.close();
      await delay(200);
      const nextRoad = match(players[0].state).edges.find((edge) => canRoad(players[0].state, 0, edge.id))?.id;
      await expectReject("connected=false blocks build", command(players[0], "buildRoad", { edgeId: nextRoad }), "ROOM_NOT_READY");
      players.forEach((player) => player.ws.close());
    }

    {
      const players = await makeRichPlayableRoom();
      const roadId = match(players[0].state).edges.find((edge) => canRoad(players[0].state, 0, edge.id))?.id;
      await command(players[0], "leaveRoom");
      await delay(100);
      await expectReject("ended room blocks build", command(players[1], "buildRoad", { edgeId: roadId }), "ROOM_ENDED");
      players.forEach((player) => player.ws.close());
    }

    console.log("online-08 basic building websocket tests passed");
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
