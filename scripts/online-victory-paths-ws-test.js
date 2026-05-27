const { spawn } = require("node:child_process");
const WebSocket = require("ws");

const port = Number(process.env.TEST_PORT || 4884);
const url = `ws://127.0.0.1:${port}/`;
let requestSeq = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const match = (state) => state.matchState;

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

function adjacentVertices(state, vertexId) {
  return match(state).edges
    .filter((edge) => edge.a === vertexId || edge.b === vertexId)
    .map((edge) => (edge.a === vertexId ? edge.b : edge.a));
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

function chooseRobberTile(state) {
  return match(state).tiles.find((tile) => tile.id !== match(state).robberTile)?.id;
}

function findEdgePath(state, length) {
  const byVertex = new Map();
  match(state).edges.forEach((edge) => {
    [edge.a, edge.b].forEach((vertexId) => {
      if (!byVertex.has(vertexId)) byVertex.set(vertexId, []);
      byVertex.get(vertexId).push(edge);
    });
  });

  function dfs(vertexId, used, path) {
    if (path.length === length) return path;
    for (const edge of byVertex.get(vertexId) || []) {
      if (used.has(edge.id)) continue;
      used.add(edge.id);
      const next = edge.a === vertexId ? edge.b : edge.a;
      const result = dfs(next, used, [...path, edge]);
      if (result) return result;
      used.delete(edge.id);
    }
    return null;
  }

  for (const edge of match(state).edges) {
    const fromA = dfs(edge.a, new Set(), []);
    if (fromA) return fromA;
    const fromB = dfs(edge.b, new Set(), []);
    if (fromB) return fromB;
  }
  return null;
}

function findSettlementBuildFixture(state) {
  for (const edge of match(state).edges) {
    for (const vertexId of [edge.a, edge.b]) {
      if (match(state).vertices[vertexId]?.owner !== null) continue;
      if (adjacentVertices(state, vertexId).some((id) => match(state).vertices[id]?.owner !== null)) continue;
      return { edgeId: edge.id, vertexId };
    }
  }
  return null;
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
    if (vertexId === undefined) throw new Error("no legal initial settlement");
    await command(players[seat], "placeInitialSettlement", { vertexId });
    await delay(20);
    await command(players[seat], "placeInitialRoad", { edgeId: chooseInitialRoad(players[seat].state, vertexId) });
    await delay(20);
  }

  await command(players[0], "rollDice", { testTotal: 2 });
  for (const resource of ["pasture", "field", "mountain", "forest", "hill"]) {
    await command(players[0], "testSetPlayerResource", { seatIndex: 0, resource, amount: 8 });
  }
  await delay(50);
  return players;
}

async function closePlayers(players) {
  players.forEach((player) => player.ws.close());
  await delay(20);
}

async function setPublicPoints(players, points) {
  const cityCount = Math.floor(points / 2);
  const hasSettlement = points % 2 === 1;
  const vertexOwners = [];
  for (let index = 0; index < cityCount; index += 1) {
    vertexOwners.push({ vertexId: index, owner: 0, city: true });
  }
  if (hasSettlement) vertexOwners.push({ vertexId: cityCount, owner: 0, city: false });
  await command(players[0], "testSetBoardOwnership", { reset: true, vertexOwners });
  await delay(50);
}

async function setResources(players) {
  for (const resource of ["pasture", "field", "mountain", "forest", "hill"]) {
    await command(players[0], "testSetPlayerResource", { seatIndex: 0, resource, amount: 8 });
  }
}

async function rollIfNeededAndEnd(session) {
  try {
    await command(session, "rollDice", { testTotal: 2 });
  } catch (error) {
    if (error.code !== "ALREADY_ROLLED") throw error;
  }
  await command(session, "endTurn");
}

async function cycleBackToHost(players) {
  await rollIfNeededAndEnd(players[0]);
  await rollIfNeededAndEnd(players[1]);
  await rollIfNeededAndEnd(players[2]);
  await command(players[0], "rollDice", { testTotal: 2 });
}

async function main() {
  const server = startServer();
  try {
    await delay(500);

    {
      const players = await createPlayRoom();
      await setPublicPoints(players, 9);
      await setResources(players);
      await command(players[0], "buildCity", { vertexId: 4 });
      if (!match(players[0].state).vertices[4].city) throw new Error("city upgrade did not apply before victory");
      if (match(players[0].state).game.winner !== 0) throw new Error("city upgrade to 10 did not set winner");
      await expectReject("winner blocks further commands", command(players[0], "endTurn"), "INVALID_ACTION");
      console.log("ok - city upgrade reaches victory and locks commands");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await setPublicPoints(players, 9);
      const fixture = findSettlementBuildFixture(players[0].state);
      if (!fixture) throw new Error("no settlement fixture");
      await command(players[0], "testSetBoardOwnership", { edgeOwners: [{ edgeId: fixture.edgeId, owner: 0 }] });
      await setResources(players);
      await command(players[0], "buildSettlement", { vertexId: fixture.vertexId });
      if (match(players[0].state).game.winner !== 0) throw new Error("settlement build to 10 did not set winner");
      console.log("ok - settlement build reaches victory");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await setPublicPoints(players, 8);
      const path = findEdgePath(players[0].state, 5);
      if (!path) throw new Error("no road path fixture");
      await command(players[0], "testSetBoardOwnership", {
        edgeOwners: path.slice(0, 4).map((edge) => ({ edgeId: edge.id, owner: 0 }))
      });
      await setResources(players);
      await command(players[0], "buildRoad", { edgeId: path[4].id });
      if (match(players[0].state).game.longestRoad !== 0) throw new Error("road build did not award longest road");
      if (match(players[0].state).game.winner !== 0) throw new Error("longest road to 10 did not set winner");
      console.log("ok - longest road reaches victory");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await setPublicPoints(players, 9);
      await setResources(players);
      await command(players[0], "testSetDevDeck", { cardTypes: ["victory"] });
      await command(players[0], "buyDevCard");
      await delay(100);
      if (match(players[0].state).game.winner !== 0) throw new Error("bought victory card to 10 did not set winner");
      if (match(players[1].state).game.winnerSummary?.victoryDevCount !== 1) throw new Error("winner summary did not reveal victory dev count");
      console.log("ok - bought hidden victory card reaches victory");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await setPublicPoints(players, 8);
      await command(players[0], "testSetPlayerDevCards", { seatIndex: 0, cardTypes: ["victory"] });
      const fixture = findSettlementBuildFixture(players[0].state);
      if (!fixture) throw new Error("no hidden plus settlement fixture");
      await command(players[0], "testSetBoardOwnership", { edgeOwners: [{ edgeId: fixture.edgeId, owner: 0 }] });
      await setResources(players);
      await command(players[0], "buildSettlement", { vertexId: fixture.vertexId });
      await delay(100);
      if (match(players[0].state).game.winner !== 0) throw new Error("hidden victory plus settlement did not set winner");
      if (match(players[1].state).game.winnerSummary?.victoryDevCount !== 1) throw new Error("hidden victory summary missing after mixed win");
      console.log("ok - hidden victory plus public point reaches victory");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await setPublicPoints(players, 8);
      await command(players[0], "testSetPlayerDevCards", { seatIndex: 0, cardTypes: ["knight", "knight", "knight"] });
      for (let index = 0; index < 3; index += 1) {
        const card = match(players[0].state).game.players[0].dev[0];
        await command(players[0], "playDevCard", { cardId: card.id });
        await delay(50);
        if (index < 2) {
          await command(players[0], "moveRobber", { tileId: chooseRobberTile(players[0].state) });
          await cycleBackToHost(players);
        }
      }
      if (match(players[0].state).game.largestArmy !== 0) throw new Error("third knight did not award largest army");
      if (match(players[0].state).game.winner !== 0) throw new Error("largest army to 10 did not set winner");
      console.log("ok - largest army reaches victory");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await setPublicPoints(players, 9);
      await setResources(players);
      await command(players[0], "buildCity", { vertexId: 4 });
      const reconnecting = await connect();
      reconnecting.roomId = players[0].roomId;
      reconnecting.playerId = players[0].playerId;
      reconnecting.playerToken = players[0].playerToken;
      players[0].ws.close();
      await delay(50);
      await command(reconnecting, "reconnect");
      if (match(reconnecting.state).game.winner !== 0) throw new Error("reconnect did not preserve winner");
      console.log("ok - reconnect preserves winner state");
      reconnecting.ws.close();
      await closePlayers(players.slice(1));
    }

    console.log("online-victory-paths-ws-test passed");
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
