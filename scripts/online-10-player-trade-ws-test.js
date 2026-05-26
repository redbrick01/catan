const { spawn } = require("node:child_process");
const WebSocket = require("ws");

const port = Number(process.env.TEST_PORT || 4875);
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
const bundle = (type, amount) => ({ forest: 0, hill: 0, pasture: 0, field: 0, mountain: 0, [type]: amount });

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
  await command(players[0], "testSetPlayerResource", { seatIndex: 0, resource: "forest", amount: 3 });
  await command(players[0], "testSetPlayerResource", { seatIndex: 1, resource: "field", amount: 2 });
  await command(players[0], "testSetPlayerResource", { seatIndex: 2, resource: "hill", amount: 2 });
  await delay(100);
  return players;
}

async function main() {
  const server = startServer();
  try {
    await delay(500);

    {
      const players = await createPlayRoom();
      const offer = bundle("forest", 1);
      const request = bundle("field", 1);
      const opened = await command(players[0], "openPlayerTrade", { offer, request });
      const trade = opened.state.pendingPlayerTrade;
      if (!trade || trade.role !== "requester") throw new Error("requester did not receive pending trade view");
      await delay(100);
      if (players[1].state.pendingPlayerTrade.role !== "responder") throw new Error("responder did not receive responder view");
      if (players[1].state.pendingPlayerTrade.responses) throw new Error("responder saw requester response details");
      console.log("ok - openPlayerTrade broadcasts role-specific views");
      await expectReject("pending blocks bankTrade", command(players[0], "bankTrade", { give: "forest", get: "field" }), "INVALID_ACTION");
      await expectReject("pending blocks endTurn", command(players[0], "endTurn"), "INVALID_ACTION");
      await expectReject("second open blocked", command(players[0], "openPlayerTrade", { offer, request }), "TRADE_ALREADY_PENDING");
      await command(players[1], "respondPlayerTrade", { tradeId: trade.id, round: trade.round, response: "accept" });
      await command(players[2], "respondPlayerTrade", {
        tradeId: trade.id,
        round: trade.round,
        response: "counter",
        counterOffer: bundle("hill", 1),
        counterRequest: bundle("forest", 1)
      });
      await delay(100);
      await expectReject("counter cannot be chosen", command(players[0], "choosePlayerTradeResponse", { tradeId: trade.id, round: trade.round, targetPlayerId: players[2].playerId }), "TRADE_RESPONSE_NOT_ACCEPT");
      const beforeHostForest = match(players[0].state).game.players[0].resources.forest;
      await command(players[0], "choosePlayerTradeResponse", { tradeId: trade.id, round: trade.round, targetPlayerId: players[1].playerId });
      await delay(100);
      if (players[0].state.pendingPlayerTrade) throw new Error("trade was not cleared after choose");
      if (match(players[0].state).game.players[0].resources.forest !== beforeHostForest - 1) throw new Error("requester resource did not move");
      if (match(players[1].state).game.players[0].resources) throw new Error("opponent saw requester resource details after trade");
      console.log("ok - choose accepted response moves resources and preserves privacy");
      players.forEach((player) => player.ws.close());
    }

    {
      const players = await createPlayRoom();
      const opened = await command(players[0], "openPlayerTrade", { offer: bundle("forest", 1), request: bundle("field", 1) });
      const trade = opened.state.pendingPlayerTrade;
      await expectReject("requester cannot respond", command(players[0], "respondPlayerTrade", { tradeId: trade.id, round: trade.round, response: "accept" }), "TRADE_NOT_RESPONDER");
      await expectReject("responder cannot update", command(players[1], "updatePlayerTradeOffer", { tradeId: trade.id, round: trade.round, offer: bundle("forest", 1), request: bundle("field", 1) }), "TRADE_NOT_REQUESTER");
      await command(players[0], "updatePlayerTradeOffer", { tradeId: trade.id, round: trade.round, offer: bundle("forest", 2), request: bundle("hill", 1) });
      await delay(100);
      const updated = players[0].state.pendingPlayerTrade;
      if (updated.round !== trade.round + 1) throw new Error("trade round did not advance");
      await expectReject("old round rejected", command(players[1], "respondPlayerTrade", { tradeId: updated.id, round: trade.round, response: "reject" }), "TRADE_ROUND_CHANGED");
      await command(players[0], "cancelPlayerTrade", { tradeId: updated.id, round: updated.round });
      await delay(100);
      if (players[1].state.pendingPlayerTrade) throw new Error("trade was not cleared after cancel");
      console.log("ok - update resets round and cancel clears trade");
      players.forEach((player) => player.ws.close());
    }

    {
      const players = await createPlayRoom();
      const opened = await command(players[0], "openPlayerTrade", { offer: bundle("forest", 1), request: bundle("field", 2) });
      const trade = opened.state.pendingPlayerTrade;
      await command(players[1], "respondPlayerTrade", { tradeId: trade.id, round: trade.round, response: "accept" });
      await command(players[2], "respondPlayerTrade", { tradeId: trade.id, round: trade.round, response: "reject" });
      await command(players[0], "testSetPlayerResource", { seatIndex: 1, resource: "field", amount: 0 });
      await command(players[0], "choosePlayerTradeResponse", { tradeId: trade.id, round: trade.round, targetPlayerId: players[1].playerId });
      await delay(100);
      if (players[0].state.pendingPlayerTrade) throw new Error("invalidated trade was not cleared");
      if (players[0].state.lastPlayerTradeResult?.type !== "invalidated") throw new Error("missing invalidated result");
      console.log("ok - choose invalidates when resources changed");
      players.forEach((player) => player.ws.close());
    }

    console.log("online-10 player trade websocket tests passed");
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
