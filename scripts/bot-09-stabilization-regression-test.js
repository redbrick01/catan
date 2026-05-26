const { spawn } = require("node:child_process");
const WebSocket = require("ws");

const port = Number(process.env.TEST_PORT || 4899);
const url = `ws://127.0.0.1:${port}/`;
let requestSeq = 0;

const resources = ["forest", "field", "pasture", "hill", "mountain"];
const forbiddenPublicKeys = [
  "token",
  "botRunner",
  "timerId",
  "runId",
  "turnActionState",
  "setupPlacement",
  "candidate",
  "evaluation"
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function startServer(extraEnv = {}) {
  return spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "test",
      DEBUG_ONLINE: "0",
      BOT_TEST_ROLL_TOTAL: "2",
      ...extraEnv
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const session = {
      ws,
      roomId: null,
      playerId: null,
      playerToken: null,
      state: null,
      messages: []
    };
    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      session.messages.push(message);
      if (message.state) session.state = message.state;
    });
    ws.once("open", () => resolve(session));
    ws.once("error", reject);
  });
}

function command(session, name, payload = {}) {
  const requestId = `bot09-${++requestSeq}`;
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
    }, 5000);
    function cleanup() {
      clearTimeout(timer);
      session.ws.off("message", onMessage);
    }
    function onMessage(data) {
      const message = JSON.parse(data.toString());
      if (message.requestId !== requestId) return;
      cleanup();
      if (message.type === "error") {
        const error = new Error(`${name}: ${message.message || message.code || "error"}`);
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

function hasForbiddenPublicKey(value, path = "$") {
  if (!value || typeof value !== "object") return null;
  for (const key of Object.keys(value)) {
    if (forbiddenPublicKeys.includes(key)) return `${path}.${key}`;
    const nested = hasForbiddenPublicKey(value[key], `${path}.${key}`);
    if (nested) return nested;
  }
  return null;
}

function assertNoPublicLeak(state, label) {
  const leaked = hasForbiddenPublicKey(state);
  if (leaked) throw new Error(`${label} leaked ${leaked}`);
  const players = match(state)?.game?.players || [];
  for (const player of players) {
    if (!player.dev) continue;
    for (const card of player.dev) {
      if (player.id !== match(state).game.viewerSeatIndex && card.type) {
        throw new Error(`${label} leaked hidden dev card type`);
      }
    }
  }
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

async function waitFor(session, predicate, label, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (session.state && predicate(session.state)) return session.state;
    await delay(25);
  }
  throw new Error(`timeout waiting for ${label}`);
}

async function createBotRoom(botCount = 2) {
  const host = await connect();
  const created = await command(host, "createRoom", { playerName: "Human Host" });
  host.roomId = created.roomId;
  for (let index = 0; index < botCount; index += 1) {
    await command(host, "addBot");
  }
  return host;
}

async function finishHumanSetupTurns(host) {
  await waitFor(host, (state) => match(state)?.game?.phase === "setup1" && match(state).game.setupIndex === 0, "human setup1 turn");
  let vertexId = chooseSettlement(host.state);
  await command(host, "placeInitialSettlement", { vertexId });
  await command(host, "placeInitialRoad", { edgeId: chooseInitialRoad(host.state, vertexId) });

  await waitFor(host, (state) => match(state)?.game?.phase === "setup2" && match(state).game.setupIndex === 0, "human setup2 turn");
  vertexId = chooseSettlement(host.state);
  await command(host, "placeInitialSettlement", { vertexId });
  await command(host, "placeInitialRoad", { edgeId: chooseInitialRoad(host.state, vertexId) });

  await waitFor(host, (state) => match(state)?.game?.phase === "play", "play phase after bot setup", 8000);
}

async function createBotPlayRoom(botCount = 2) {
  const host = await createBotRoom(botCount);
  await command(host, "startGame");
  await finishHumanSetupTurns(host);
  return host;
}

async function setAllResources(host, seatIndex, amount) {
  for (const resource of resources) {
    await command(host, "testSetPlayerResource", { seatIndex, resource, amount });
  }
}

async function testLobbyAndSetup() {
  const host = await createBotRoom(2);
  const bots = host.state.players.filter((player) => player.isBot);
  if (bots.length !== 2) throw new Error("addBot did not add two bots");
  if (!bots.every((bot) => bot.botDifficulty === "basic")) throw new Error("botDifficulty was not public basic");
  if (!bots[0].name || bots[0].name === bots[1].name) throw new Error("bot names are not stable/unique");
  assertNoPublicLeak(host.state, "lobby state");

  await expectReject("one human plus one bot cannot start", command(host, "removeBot", { playerId: bots[1].id }).then(() => command(host, "startGame")), "ROOM_NOT_READY");
  await command(host, "addBot");
  await command(host, "addBot");
  await expectReject("max player addBot rejected", command(host, "addBot"), "ROOM_FULL");

  await command(host, "startGame");
  await finishHumanSetupTurns(host);
  const game = match(host.state).game;
  if (game.phase !== "play") throw new Error("bot setup did not advance to play");
  if (game.pendingActionView) throw new Error("setup left pendingActionView");
  if (game.players.filter((player) => player.isBot).length !== 3) throw new Error("game players lost bot identity");
  assertNoPublicLeak(host.state, "play state after setup");
  host.ws.close();
  console.log("ok - bot-01/bot-03 lobby, public model, setup, and leak gates");
}

async function testRunnerTurnsAndTrade() {
  const host = await createBotPlayRoom(2);
  await setAllResources(host, 0, 4);
  await setAllResources(host, 1, 2);
  await setAllResources(host, 2, 2);

  await command(host, "rollDice", { testTotal: 2 });
  await command(host, "endTurn");
  await waitFor(host, (state) => match(state).game.phase === "play" && match(state).game.active === 0 && !match(state).game.pendingActionView, "two bots finish consecutive turns", 8000);
  if (match(host.state).game.round < 2) throw new Error("consecutive bot turns did not return control to human");
  assertNoPublicLeak(host.state, "state after bot runner turns");

  await command(host, "rollDice", { testTotal: 2 });
  const beforeBotForest = match(host.state).game.players[1].resourceCount;
  await command(host, "openPlayerTrade", {
    offer: { forest: 1, field: 0, pasture: 0, hill: 0, mountain: 0 },
    request: { forest: 0, field: 1, pasture: 0, hill: 0, mountain: 0 }
  });
  await waitFor(host, (state) => {
    const responses = Object.values(state.pendingPlayerTrade?.responses || {});
    return responses.some((response) => state.players.find((player) => player.id === response.playerId)?.isBot);
  }, "bot trade response", 5000);
  const trade = host.state.pendingPlayerTrade;
  const botResponses = Object.values(trade.responses).filter((response) => host.state.players.find((player) => player.id === response.playerId)?.isBot);
  if (!botResponses.length) throw new Error("bot did not respond to player trade");
  if (botResponses.some((response) => response.type === "counter")) throw new Error("bot sent counter response");
  if (match(host.state).game.players[1].resourceCount !== beforeBotForest) throw new Error("bot accept/reject moved resources before requester choice");
  assertNoPublicLeak(host.state, "state after bot trade response");
  host.ws.close();
  console.log("ok - bot-02/bot-04/bot-07 runner, action, trade, duplicate/leak gates");
}

async function testPendingAndDevCards() {
  const host = await createBotPlayRoom(2);
  await command(host, "testSetGameTurn", { phase: "play", active: 0, rolled: false });
  await setAllResources(host, 0, 0);
  await setAllResources(host, 1, 0);
  await setAllResources(host, 2, 0);
  await command(host, "testSetPlayerResource", { seatIndex: 1, resource: "forest", amount: 8 });
  await command(host, "rollDice", { testTotal: 7 });
  await waitFor(host, (state) => match(state).game.pendingActionView?.type !== "discardForSeven", "bot discard for seven", 5000);
  if (match(host.state).game.pendingActionView?.type === "discardForSeven") throw new Error("bot discardForSeven was left unresolved");
  assertNoPublicLeak(host.state, "state after bot pending action");

  await command(host, "testSetGameTurn", { phase: "play", active: 0, rolled: true });
  await setAllResources(host, 1, 0);
  await command(host, "testSetPlayerResource", { seatIndex: 1, resource: "field", amount: 1 });
  await command(host, "testSetPlayerResource", { seatIndex: 1, resource: "mountain", amount: 2 });
  await command(host, "testSetPlayerDevCards", { seatIndex: 1, cardTypes: ["yearPlenty", "victory", "knight"] });
  await command(host, "testSetDevDeck", { cardTypes: ["victory", "knight", "yearPlenty"] });
  await command(host, "testSetGameTurn", { phase: "play", active: 1, rolled: true });
  await waitFor(host, (state) => match(state).game.players[1].devCount < 3 || match(state).game.usedDevThisTurn, "bot dev card decision", 5000);
  const botView = match(host.state).game.players[1];
  if (botView.dev) throw new Error("human viewer saw bot hidden dev cards");
  assertNoPublicLeak(host.state, "state after bot dev cards");
  host.ws.close();
  console.log("ok - bot-05/bot-06 pending/dev privacy gates");
}

async function testHumanOnlyRegression() {
  const players = [await connect(), await connect(), await connect()];
  const created = await command(players[0], "createRoom", { playerName: "Host" });
  players.forEach((player) => { player.roomId = created.roomId; });
  await command(players[1], "joinRoom", { roomId: created.roomId, playerName: "Guest A" });
  await command(players[2], "joinRoom", { roomId: created.roomId, playerName: "Guest B" });
  await command(players[0], "startGame");
  for (const seat of [0, 1, 2, 2, 1, 0]) {
    await delay(20);
    const vertexId = chooseSettlement(players[seat].state);
    await command(players[seat], "placeInitialSettlement", { vertexId });
    await delay(20);
    await command(players[seat], "placeInitialRoad", { edgeId: chooseInitialRoad(players[seat].state, vertexId) });
  }
  await waitFor(players[0], (state) => match(state).game.phase === "play", "human-only play phase");
  await command(players[0], "rollDice", { testTotal: 2 });
  await command(players[0], "endTurn");
  if (match(players[0].state).game.active !== 1) throw new Error("human-only online turn did not advance");
  players.forEach((player) => player.ws.close());
  console.log("ok - human-only online regression smoke");
}

async function main() {
  const server = startServer();
  let stderr = "";
  server.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
  try {
    await delay(600);
    await testLobbyAndSetup();
    await testRunnerTurnsAndTrade();
    await testPendingAndDevCards();
    await testHumanOnlyRegression();
    if (/TypeError|ReferenceError|SyntaxError|Unhandled|EADDRINUSE/i.test(stderr)) {
      throw new Error(`server stderr contained fatal-looking output: ${stderr}`);
    }
    console.log("bot-09 stabilization regression tests passed");
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
