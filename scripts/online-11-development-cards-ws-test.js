const { spawn } = require("node:child_process");
const WebSocket = require("ws");

const port = Number(process.env.TEST_PORT || 4876);
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

function canConnectThroughVertex(state, seatIndex, vertexId) {
  const owner = match(state).vertices[vertexId]?.owner;
  return owner === null || owner === undefined || owner === seatIndex;
}

function canFreeRoad(state, seatIndex, edge) {
  if (!edge || edge.owner !== null) return false;
  const touchesOwnBuilding = match(state).vertices[edge.a]?.owner === seatIndex || match(state).vertices[edge.b]?.owner === seatIndex;
  const touchesOwnRoad = [edge.a, edge.b].some((vertexId) => {
    if (!canConnectThroughVertex(state, seatIndex, vertexId)) return false;
    return match(state).edges.some((other) => other.id !== edge.id && other.owner === seatIndex && (other.a === vertexId || other.b === vertexId));
  });
  return touchesOwnBuilding || touchesOwnRoad;
}

function chooseFreeRoad(state, seatIndex) {
  return match(state).edges.find((edge) => canFreeRoad(state, seatIndex, edge))?.id;
}

function chooseRobberTile(state) {
  return match(state).tiles.find((tile) => tile.id !== match(state).robberTile)?.id;
}

function findEdgePath(state, length) {
  const edges = match(state).edges;
  const byVertex = new Map();
  edges.forEach((edge) => {
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

  for (const edge of edges) {
    let result = dfs(edge.a, new Set(), []);
    if (result) return result;
    result = dfs(edge.b, new Set(), []);
    if (result) return result;
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
    await command(players[seat], "placeInitialSettlement", { vertexId });
    await delay(20);
    await command(players[seat], "placeInitialRoad", { edgeId: chooseInitialRoad(players[seat].state, vertexId) });
    await delay(20);
  }
  await delay(100);
  await command(players[0], "rollDice", { testTotal: 2 });
  for (const resource of ["pasture", "field", "mountain", "forest", "hill"]) {
    await command(players[0], "testSetPlayerResource", { seatIndex: 0, resource, amount: 5 });
    await command(players[0], "testSetPlayerResource", { seatIndex: 1, resource, amount: 2 });
    await command(players[0], "testSetPlayerResource", { seatIndex: 2, resource, amount: 1 });
  }
  await delay(100);
  return players;
}

async function closePlayers(players) {
  players.forEach((player) => player.ws.close());
  await delay(20);
}

async function rollIfNeededAndEnd(session) {
  try {
    await command(session, "rollDice", { testTotal: 2 });
  } catch (error) {
    if (error.code !== "ALREADY_ROLLED") throw error;
  }
  try {
    await command(session, "endTurn");
  } catch (error) {
    if (error.code !== "ROLL_REQUIRED") throw error;
    await command(session, "rollDice", { testTotal: 2 });
    await command(session, "endTurn");
  }
}

async function main() {
  const server = startServer();
  try {
    await delay(500);

    {
      const players = await createPlayRoom();
      await command(players[0], "testSetDevDeck", { cardTypes: ["victory"] });
      await command(players[0], "buyDevCard");
      await delay(100);
      const ownPlayer = match(players[0].state).game.players[0];
      const opponentView = match(players[1].state).game.players[0];
      if (match(players[0].state).devDeck) throw new Error("viewer state exposed devDeck");
      if (match(players[0].state).devDeckCount !== 0) throw new Error("devDeckCount did not update");
      if (!ownPlayer.dev?.some((card) => card.type === "victory")) throw new Error("buyer did not see own dev card detail");
      if (opponentView.dev || opponentView.hiddenVictoryPoints !== undefined) throw new Error("opponent saw private dev details");
      if (opponentView.devCount !== 1) throw new Error("opponent did not see devCount");
      await expectReject("victory card cannot be played", command(players[0], "playDevCard", { cardId: ownPlayer.dev[0].id }), "DEV_CARD_NOT_PLAYABLE");
      console.log("ok - buyDevCard privacy and victory card policy");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await command(players[0], "testSetDevDeck", { cardTypes: ["yearPlenty"] });
      await command(players[0], "buyDevCard");
      const card = match(players[0].state).game.players[0].dev[0];
      await expectReject("bought turn play rejected", command(players[0], "playDevCard", { cardId: card.id, resources: ["forest", "field"] }), "DEV_CARD_BOUGHT_THIS_TURN");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await command(players[0], "testSetPlayerDevCards", { seatIndex: 0, cardTypes: ["yearPlenty"] });
      const card = match(players[0].state).game.players[0].dev[0];
      const before = { ...match(players[0].state).game.players[0].resources };
      await command(players[0], "playDevCard", { cardId: card.id, resources: ["forest", "forest"] });
      await delay(100);
      const after = match(players[0].state).game.players[0].resources;
      if (after.forest !== before.forest + 2) throw new Error("yearPlenty did not grant two resources");
      await expectReject("one dev card per turn", command(players[0], "playDevCard", { cardId: "missing" }), "DEV_CARD_ALREADY_USED");
      console.log("ok - yearPlenty grants resources and one-card limit applies");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await command(players[0], "testSetPlayerDevCards", { seatIndex: 0, cardTypes: ["monopoly"] });
      await command(players[0], "testSetPlayerResource", { seatIndex: 1, resource: "hill", amount: 3 });
      await command(players[0], "testSetPlayerResource", { seatIndex: 2, resource: "hill", amount: 4 });
      const card = match(players[0].state).game.players[0].dev[0];
      const beforeHill = match(players[0].state).game.players[0].resources.hill;
      await command(players[0], "playDevCard", { cardId: card.id, resource: "hill" });
      await delay(100);
      const host = match(players[0].state).game.players[0];
      if (host.resources.hill !== beforeHill + 7) throw new Error("monopoly did not collect resources");
      if (match(players[1].state).game.players[1].resources.hill !== 0) throw new Error("monopoly did not clear opponent resources");
      if (match(players[0].state).game.players[1].resources) throw new Error("monopoly exposed opponent resources to requester");
      console.log("ok - monopoly collects selected resource");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await command(players[0], "testSetPlayerDevCards", { seatIndex: 0, cardTypes: ["roadBuilding"] });
      const card = match(players[0].state).game.players[0].dev[0];
      const roadsBefore = match(players[0].state).game.players[0].roads;
      await command(players[0], "playDevCard", { cardId: card.id });
      await delay(100);
      if (match(players[0].state).game.pendingFreeRoads !== 2) throw new Error("roadBuilding did not create pending free roads");
      await expectReject("pending free road blocks endTurn", command(players[0], "endTurn"), "INVALID_ACTION");
      const edgeId = chooseFreeRoad(players[0].state, 0);
      await command(players[0], "placeFreeRoad", { edgeId });
      await delay(100);
      if (match(players[0].state).edges[edgeId].owner !== 0) throw new Error("free road was not placed");
      if (match(players[0].state).game.players[0].roads !== roadsBefore - 1) throw new Error("free road did not consume road piece");
      if (match(players[0].state).game.players[0].resources.forest !== 5 || match(players[0].state).game.players[0].resources.hill !== 5) throw new Error("free road charged resources");
      await expectReject("non-owner cannot place free road", command(players[1], "placeFreeRoad", { edgeId: chooseFreeRoad(players[1].state, 1) }), "NOT_YOUR_TURN");
      console.log("ok - roadBuilding pending and free road placement");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await command(players[0], "testSetBoardOwnership", {
        reset: true,
        edgeOwners: match(players[0].state).edges.map((edge) => ({ edgeId: edge.id, owner: 1 }))
      });
      await command(players[0], "testSetPlayerDevCards", { seatIndex: 0, cardTypes: ["roadBuilding"] });
      const card = match(players[0].state).game.players[0].dev[0];
      await command(players[0], "playDevCard", { cardId: card.id });
      await delay(100);
      if (match(players[0].state).game.pendingFreeRoads !== 0) throw new Error("roadBuilding created pending with no legal free road");
      if (match(players[0].state).game.freeRoadOwnerSeat !== null) throw new Error("roadBuilding kept owner with no legal free road");
      if (match(players[0].state).game.players[0].dev.length !== 0) throw new Error("roadBuilding card was not consumed");
      await command(players[0], "endTurn");
      console.log("ok - roadBuilding ends without pending when no legal road exists");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      const path = findEdgePath(players[0].state, 5);
      if (!path) throw new Error("could not find road path fixture");
      await command(players[0], "testSetBoardOwnership", {
        reset: true,
        edgeOwners: [
          ...match(players[0].state).edges.map((edge) => ({ edgeId: edge.id, owner: 1 })),
          ...path.slice(0, 4).map((edge) => ({ edgeId: edge.id, owner: 0 })),
          { edgeId: path[4].id, owner: null }
        ],
        vertexOwners: [
          { vertexId: 0, owner: 0, city: true },
          { vertexId: 1, owner: 0, city: true },
          { vertexId: 2, owner: 0, city: true },
          { vertexId: 3, owner: 0, city: true }
        ]
      });
      await command(players[0], "testSetPlayerDevCards", { seatIndex: 0, cardTypes: ["roadBuilding"] });
      const card = match(players[0].state).game.players[0].dev[0];
      await command(players[0], "playDevCard", { cardId: card.id });
      await command(players[0], "placeFreeRoad", { edgeId: path[4].id });
      await delay(100);
      if (match(players[0].state).game.longestRoad !== 0) throw new Error("free road did not update longestRoad");
      if (match(players[0].state).game.winner !== 0) throw new Error("free road longestRoad points did not set winner");
      if (match(players[0].state).game.pendingFreeRoads !== 0) throw new Error("free road pending did not auto-clear when no legal placement remained");
      console.log("ok - free road updates longestRoad, winner, and clears dead pending");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await command(players[0], "testSetBoardOwnership", {
        reset: true,
        vertexOwners: [
          { vertexId: 0, owner: 0, city: true },
          { vertexId: 1, owner: 0, city: true },
          { vertexId: 2, owner: 0, city: true },
          { vertexId: 3, owner: 0, city: true },
          { vertexId: 4, owner: 0, city: false }
        ]
      });
      await command(players[0], "testSetPlayerDevCards", { seatIndex: 0, cardTypes: ["victory"] });
      await delay(100);
      const hostView = match(players[0].state).game.players[0];
      const opponentWinnerView = match(players[1].state).game.players[0];
      if (match(players[0].state).game.winner !== 0) throw new Error("victory card hidden point did not set winner");
      if (match(players[0].state).game.winnerSummary?.victoryDevCount !== 1) throw new Error("winnerSummary did not reveal victoryDevCount");
      if (hostView.victoryDevCount !== 1 || opponentWinnerView.victoryDevCount !== 1) throw new Error("winner player view did not reveal victoryDevCount");
      if (opponentWinnerView.dev || opponentWinnerView.hiddenVictoryPoints !== undefined) throw new Error("opponent saw winner private dev details");
      console.log("ok - victory dev count is revealed only as winner summary");
      await closePlayers(players);
    }

    {
      const players = await createPlayRoom();
      await command(players[0], "testSetBoardOwnership", { reset: true });
      await command(players[0], "testSetPlayerDevCards", { seatIndex: 0, cardTypes: ["knight", "knight", "knight"] });
      for (let index = 0; index < 3; index += 1) {
        const card = match(players[0].state).game.players[0].dev[0];
        await command(players[0], "playDevCard", { cardId: card.id });
        await command(players[0], "moveRobber", { tileId: chooseRobberTile(players[0].state) });
        await delay(50);
        if (index < 2) {
          await rollIfNeededAndEnd(players[0]);
          await rollIfNeededAndEnd(players[1]);
          await rollIfNeededAndEnd(players[2]);
          await delay(50);
        }
      }
      if (match(players[0].state).game.players[0].knights !== 3) throw new Error("knights did not increment");
      if (match(players[0].state).game.largestArmy !== 0) throw new Error("largestArmy did not update");
      if (match(players[0].state).game.pendingActionView) throw new Error("knight robber pending did not resolve");
      console.log("ok - knight increments, creates robber flow, and largestArmy updates");
      await closePlayers(players);
    }

    console.log("online-11 development card websocket tests passed");
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
