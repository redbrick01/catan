const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";
const localHost = "127.0.0.1";
const maxPlayers = 4;
const minStartPlayers = 3;
const debugOnline = process.env.DEBUG_ONLINE === "1";
const boardSize = 72;
const boardCenter = { x: 380, y: 320 };
const numberTokens = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];
const harborEdgeSlots = [
  { q: 2, r: 0, side: 1 },
  { q: 0, r: 2, side: 0 },
  { q: -1, r: 2, side: 1 },
  { q: -2, r: 2, side: 3 },
  { q: -2, r: 0, side: 2 },
  { q: -1, r: -1, side: 3 },
  { q: 0, r: -2, side: 5 },
  { q: 2, r: -2, side: 4 },
  { q: 2, r: -1, side: 5 }
];
const resourceTypes = ["forest", "field", "pasture", "hill", "mountain"];
const startingBankResources = Object.fromEntries(resourceTypes.map((type) => [type, 19]));
const buildCosts = {
  road: { forest: 1, hill: 1 },
  settlement: { forest: 1, hill: 1, pasture: 1, field: 1 },
  city: { field: 2, mountain: 3 },
  dev: { pasture: 1, field: 1, mountain: 1 }
};

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const rooms = new Map();

function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function axialToPixel(q, r) {
  return {
    x: boardCenter.x + boardSize * Math.sqrt(3) * (q + r / 2),
    y: boardCenter.y + boardSize * 1.5 * r
  };
}

function hexCorners(cx, cy) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return {
      x: cx + boardSize * Math.cos(angle),
      y: cy + boardSize * Math.sin(angle)
    };
  });
}

function pointKey(point) {
  return `${Math.round(point.x)},${Math.round(point.y)}`;
}

function axialDistance(coord) {
  return Math.max(Math.abs(coord.q), Math.abs(coord.r), Math.abs(coord.q + coord.r));
}

function spiralAngle(tile) {
  const angle = Math.atan2(boardCenter.y - tile.y, tile.x - boardCenter.x);
  return angle < 0 ? angle + Math.PI * 2 : angle;
}

function officialNumberTokenOrder(tiles) {
  const startAngle = spiralAngle(tiles.find((tile) => tile.q === 0 && tile.r === -2) || tiles[0]);
  return [...tiles].sort((a, b) => {
    const ringDelta = axialDistance(b) - axialDistance(a);
    if (ringDelta !== 0) return ringDelta;
    const aAngle = (spiralAngle(a) - startAngle + Math.PI * 2) % (Math.PI * 2);
    const bAngle = (spiralAngle(b) - startAngle + Math.PI * 2) % (Math.PI * 2);
    return aAngle - bAngle;
  });
}

function assignOfficialNumberTokens(tiles) {
  const numbers = [...numberTokens];
  officialNumberTokenOrder(tiles).forEach((tile) => {
    tile.number = tile.type === "desert" ? null : numbers.shift();
  });
}

function tilesForEdge(edge, tiles) {
  return tiles.filter((tile) => tile.vertexIds.includes(edge.a) && tile.vertexIds.includes(edge.b));
}

function isCoastalEdge(edge, tiles) {
  return tilesForEdge(edge, tiles).length === 1;
}

function edgeForTileSide(q, r, side, tiles, edges) {
  const tile = tiles.find((candidate) => candidate.q === q && candidate.r === r);
  if (!tile) return null;
  const a = tile.vertexIds[side];
  const b = tile.vertexIds[(side + 1) % tile.vertexIds.length];
  const edge = edges.find((candidate) =>
    (candidate.a === a && candidate.b === b) || (candidate.a === b && candidate.b === a)
  );
  return edge && isCoastalEdge(edge, tiles) ? edge : null;
}

function createBoardState() {
  const coords = [];
  for (let q = -2; q <= 2; q += 1) {
    for (let r = -2; r <= 2; r += 1) {
      if (Math.abs(q + r) <= 2) coords.push({ q, r });
    }
  }

  const terrain = shuffle([
    "forest", "forest", "forest", "forest",
    "field", "field", "field", "field",
    "pasture", "pasture", "pasture", "pasture",
    "hill", "hill", "hill",
    "mountain", "mountain", "mountain",
    "desert"
  ]);
  const vertexMap = new Map();
  const edgeMap = new Map();
  const tiles = coords.map((coord, index) => {
    const center = axialToPixel(coord.q, coord.r);
    const type = terrain[index];
    const corners = hexCorners(center.x, center.y);
    const vertexIds = corners.map((corner) => {
      const key = pointKey(corner);
      if (!vertexMap.has(key)) {
        vertexMap.set(key, {
          id: vertexMap.size,
          x: Math.round(corner.x),
          y: Math.round(corner.y),
          owner: null,
          city: false,
          tiles: []
        });
      }
      return vertexMap.get(key).id;
    });
    return { id: index, q: coord.q, r: coord.r, ...center, type, number: null, corners, vertexIds };
  });

  assignOfficialNumberTokens(tiles);
  const vertices = [...vertexMap.values()];
  tiles.forEach((tile) => {
    tile.vertexIds.forEach((id) => vertices[id].tiles.push(tile.id));
    for (let index = 0; index < 6; index += 1) {
      const a = tile.vertexIds[index];
      const b = tile.vertexIds[(index + 1) % 6];
      const key = [a, b].sort((left, right) => left - right).join("-");
      if (!edgeMap.has(key)) edgeMap.set(key, { id: edgeMap.size, a, b, owner: null });
    }
  });

  const edges = [...edgeMap.values()];
  const harborTypes = shuffle(["generic", "generic", "generic", "generic", "forest", "field", "pasture", "hill", "mountain"]);
  const selectedHarborEdges = harborEdgeSlots.map(({ q, r, side }) => edgeForTileSide(q, r, side, tiles, edges)).filter(Boolean);
  const harbors = selectedHarborEdges.map((edge, index) => ({
    id: index,
    vertexIds: [edge.a, edge.b],
    type: harborTypes[index]
  }));
  const robberTile = tiles.find((tile) => tile.type === "desert")?.id ?? 0;

  return { tiles, vertices, edges, harbors, robberTile };
}

function makeDevDeck() {
  return shuffle([
    ...Array(14).fill("knight"),
    ...Array(5).fill("victory"),
    ...Array(2).fill("roadBuilding"),
    ...Array(2).fill("yearPlenty"),
    ...Array(2).fill("monopoly")
  ]);
}

function createGamePlayer(player) {
  return {
    id: player.seatIndex,
    onlinePlayerId: player.id,
    name: player.name,
    color: player.color,
    resources: Object.fromEntries(resourceTypes.map((type) => [type, 0])),
    dev: [],
    knights: 0,
    roads: 15,
    settlements: 5,
    cities: 4
  };
}

function createInitialMatchState(players) {
  const board = createBoardState();
  return {
    game: {
      players: players.map(createGamePlayer),
      active: 0,
      round: 1,
      phase: "setup1",
      setupIndex: 0,
      pendingSettlement: null,
      rolled: false,
      largestArmy: null,
      longestRoad: null,
      pendingDiscards: [],
      pendingRobberVictims: [],
      pendingAction: null,
      pendingFreeRoads: 0,
      freeRoadOwnerSeat: null,
      lastRobberResult: null,
      robberResultSeq: 0,
      devCardSeq: 0,
      usedDevThisTurn: false,
      lastDice: null,
      lastProduction: [],
      bank: { ...startingBankResources },
      winner: null
    },
    tiles: board.tiles,
    vertices: board.vertices,
    edges: board.edges,
    harbors: board.harbors,
    robberTile: board.robberTile,
    devDeck: makeDevDeck()
  };
}

function getNetworkHosts() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }

  return addresses;
}

function makeId(length = 6) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";

  for (let index = 0; index < length; index += 1) {
    id += alphabet[crypto.randomInt(alphabet.length)];
  }

  return id;
}

function makeRoomId() {
  let id = makeId();

  while (rooms.has(id)) {
    id = makeId();
  }

  return id;
}

function makePlayerId() {
  return `p_${makeId(8)}`;
}

function makePlayerToken() {
  return crypto.randomBytes(24).toString("base64url");
}

function normalizeName(name) {
  return String(name || "").trim().slice(0, 24);
}

function getShareUrls(roomId) {
  const networkHosts = getNetworkHosts();
  const hosts = networkHosts.length > 0 ? networkHosts : [localHost];

  return hosts.map((address) => `http://${address}:${port}/?room=${roomId}`);
}

function publicPlayer(player) {
  return {
    id: player.id,
    seatIndex: player.seatIndex,
    name: player.name,
    color: player.color,
    connected: player.connected,
    disconnectedAt: player.disconnectedAt || null,
    left: Boolean(player.left),
    leftAt: player.leftAt || null,
    joinedAt: player.joinedAt,
    lastSeenAt: player.lastSeenAt
  };
}

function countResources(resources = {}) {
  return resourceTypes.reduce((sum, type) => sum + (Number(resources[type]) || 0), 0);
}

function countHiddenVictoryPoints(devCards = []) {
  return devCards.filter((card) => card.type === "victory").length;
}

function getPlayerHarbors(matchState, seatIndex) {
  return matchState.harbors.filter((harbor) => (
    harbor.vertexIds.some((vertexId) => matchState.vertices[vertexId]?.owner === seatIndex)
  ));
}

function getTradeRatioForResource(matchState, seatIndex, resourceType) {
  const ownedHarbors = getPlayerHarbors(matchState, seatIndex);
  if (ownedHarbors.some((harbor) => harbor.type === resourceType)) return 2;
  if (ownedHarbors.some((harbor) => harbor.type === "generic")) return 3;
  return 4;
}

function makeTradeView(matchState, seatIndex) {
  return {
    ownedHarbors: getPlayerHarbors(matchState, seatIndex).map((harbor) => harbor.type),
    ratios: Object.fromEntries(resourceTypes.map((type) => [type, getTradeRatioForResource(matchState, seatIndex, type)]))
  };
}

function makeWinnerSummary(matchState) {
  const winnerSeatIndex = matchState?.game?.winner;
  if (winnerSeatIndex === null || winnerSeatIndex === undefined) return null;
  const winner = matchState.game.players[winnerSeatIndex];
  if (!winner) return null;

  return {
    seatIndex: winnerSeatIndex,
    victoryDevCount: countHiddenVictoryPoints(winner.dev)
  };
}

function makePlayerView(player, viewerSeatIndex, matchState) {
  const isViewer = player.id === viewerSeatIndex;
  const view = {
    id: player.id,
    onlinePlayerId: player.onlinePlayerId,
    name: player.name,
    color: player.color,
    knights: player.knights,
    roads: player.roads,
    settlements: player.settlements,
    cities: player.cities,
    resourceCount: countResources(player.resources),
    devCount: player.dev.length
  };

  if (isViewer) {
    view.resources = { ...player.resources };
    view.dev = player.dev.map((card) => ({ ...card }));
    view.hiddenVictoryPoints = countHiddenVictoryPoints(player.dev);
    if (matchState) view.trade = makeTradeView(matchState, player.id);
  }

  if (matchState?.game?.winner === player.id) {
    view.victoryDevCount = countHiddenVictoryPoints(player.dev);
  }

  return view;
}

function makeProductionView(production = [], viewerSeatIndex = null) {
  return production.map((entry) => ({
    seatIndex: entry.seatIndex,
    amount: entry.amount,
    resource: entry.seatIndex === viewerSeatIndex ? entry.resource : null
  }));
}

function makePendingActionView(matchState, viewerSeatIndex) {
  const pending = matchState?.game?.pendingAction;
  if (!pending) return null;

  if (pending.type === "discardForSeven") {
    const own = pending.discards?.find((entry) => entry.seatIndex === viewerSeatIndex);
    return {
      type: pending.type,
      source: pending.source,
      actorSeatIndex: pending.actorSeatIndex,
      role: own && !own.discarded ? "discarder" : "waiting",
      needed: own && !own.discarded ? own.needed : 0,
      remainingCount: pending.discards?.filter((entry) => !entry.discarded).length || 0
    };
  }

  if (pending.type === "moveRobber") {
    return {
      type: pending.type,
      source: pending.source,
      actorSeatIndex: pending.actorSeatIndex,
      role: pending.actorSeatIndex === viewerSeatIndex ? "actor" : "waiting",
      fromTileId: pending.fromTileId
    };
  }

  if (pending.type === "chooseRobberVictim") {
    const isActor = pending.actorSeatIndex === viewerSeatIndex;
    return {
      type: pending.type,
      source: pending.source,
      actorSeatIndex: pending.actorSeatIndex,
      role: isActor ? "actor" : "waiting",
      tileId: pending.tileId,
      victims: isActor ? pending.victimSeatIndexes.map((seatIndex) => {
        const player = matchState.game.players[seatIndex];
        return {
          seatIndex,
          name: player?.name || `Player ${seatIndex + 1}`,
          resourceCount: player ? countResources(player.resources) : 0
        };
      }) : []
    };
  }

  return { type: pending.type, source: pending.source, role: "waiting" };
}

function makeRobberResultView(result, viewerSeatIndex) {
  if (!result) return null;
  const canSeeResource = viewerSeatIndex === result.actorSeatIndex || viewerSeatIndex === result.victimSeatIndex;
  return {
    ...result,
    resource: canSeeResource ? result.resource : null
  };
}

function compactResources(resources = {}) {
  return Object.fromEntries(resourceTypes.map((type) => [type, Number(resources[type]) || 0]));
}

function resourceTotal(resources = {}) {
  return resourceTypes.reduce((sum, type) => sum + (Number(resources[type]) || 0), 0);
}

function makePendingPlayerTradeView(trade, viewerPlayer = null) {
  if (!trade) return null;
  const viewerId = viewerPlayer?.id || null;
  const viewerSeatIndex = viewerPlayer?.seatIndex ?? null;
  const isRequester = viewerId === trade.requesterPlayerId;
  const isResponder = viewerId && viewerId !== trade.requesterPlayerId;
  const publicView = {
    id: trade.id,
    round: trade.round,
    status: trade.status,
    requesterPlayerId: trade.requesterPlayerId,
    requesterSeatIndex: trade.requesterSeatIndex,
    createdAt: trade.createdAt,
    updatedAt: trade.updatedAt,
    role: isRequester ? "requester" : isResponder ? "responder" : "observer"
  };

  if (isRequester || isResponder) {
    publicView.offer = compactResources(trade.offer);
    publicView.request = compactResources(trade.request);
  }

  if (isRequester) {
    publicView.responses = Object.fromEntries(Object.entries(trade.responses).map(([playerId, response]) => [playerId, {
      playerId,
      seatIndex: response.seatIndex,
      type: response.type,
      counterOffer: response.counterOffer ? compactResources(response.counterOffer) : null,
      counterRequest: response.counterRequest ? compactResources(response.counterRequest) : null,
      createdAt: response.createdAt
    }]));
    return publicView;
  }

  if (isResponder) {
    const own = trade.responses[viewerId] || null;
    publicView.myResponse = own ? {
      type: own.type,
      counterOffer: own.counterOffer ? compactResources(own.counterOffer) : null,
      counterRequest: own.counterRequest ? compactResources(own.counterRequest) : null,
      createdAt: own.createdAt
    } : null;
    publicView.responseStatuses = Object.fromEntries(Object.entries(trade.responses).map(([playerId, response]) => [playerId, {
      playerId,
      seatIndex: response.seatIndex,
      type: playerId === viewerId ? response.type : "responded"
    }]));
    return publicView;
  }

  return publicView;
}

function makeMatchStateView(matchState, viewerSeatIndex) {
  return {
    game: {
      ...matchState.game,
      pendingAction: null,
      lastProduction: makeProductionView(matchState.game.lastProduction, viewerSeatIndex),
      lastRobberResult: makeRobberResultView(matchState.game.lastRobberResult, viewerSeatIndex),
      pendingActionView: makePendingActionView(matchState, viewerSeatIndex),
      winnerSummary: makeWinnerSummary(matchState),
      viewerSeatIndex,
      players: matchState.game.players.map((player) => makePlayerView(player, viewerSeatIndex, matchState))
    },
    tiles: matchState.tiles,
    vertices: matchState.vertices,
    edges: matchState.edges,
    harbors: matchState.harbors,
    robberTile: matchState.robberTile,
    devDeckCount: matchState.devDeck.length
  };
}

function makeRoomState(room, viewerPlayer = null) {
  const state = {
    status: room.status,
    roomId: room.id,
    hostPlayerId: room.hostPlayerId,
    revision: room.revision,
    players: room.players.map(publicPlayer),
    maxPlayers,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    endReason: room.endReason || null,
    endedAt: room.endedAt || null,
    endedByPlayerId: room.endedByPlayerId || null
  };

  if ((room.status === "playing" || room.status === "ended") && room.matchState) {
    state.matchState = makeMatchStateView(room.matchState, viewerPlayer?.seatIndex ?? null);
    state.pendingPlayerTrade = makePendingPlayerTradeView(room.pendingPlayerTrade, viewerPlayer);
    state.lastPlayerTradeResult = room.lastPlayerTradeResult || null;
  }

  return state;
}

function send(socket, message) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function sendError(socket, requestId, message, code = "bad_request") {
  const normalizedCode = String(code || "BAD_REQUEST").toUpperCase();
  send(socket, {
    type: "error",
    requestId,
    code: normalizedCode,
    message,
    error: { code: normalizedCode, message }
  });
}

function broadcastState(room) {
  for (const [playerId, socket] of room.sockets.entries()) {
    const player = room.players.find((entry) => entry.id === playerId);
    send(socket, {
      type: "state",
      roomId: room.id,
      revision: room.revision,
      state: makeRoomState(room, player)
    });
  }
}

function attachSocket(room, player, socket) {
  const previousSocket = room.sockets.get(player.id);

  if (previousSocket && previousSocket !== socket) {
    previousSocket.close(1000, "Replaced by a newer connection");
  }

  socket.roomId = room.id;
  socket.playerId = player.id;
  room.sockets.set(player.id, socket);
  player.connected = true;
  player.disconnectedAt = null;
  player.lastSeenAt = Date.now();
}

function createPlayer(name, seatIndex) {
  const colors = ["#3fa7d6", "#f25f5c", "#70c1b3", "#f4d35e"];

  return {
    id: makePlayerId(),
    seatIndex,
    name,
    color: colors[seatIndex % colors.length],
    token: makePlayerToken(),
    connected: true,
    disconnectedAt: null,
    left: false,
    leftAt: null,
    joinedAt: Date.now(),
    lastSeenAt: Date.now()
  };
}

function handleCreateRoom(socket, message) {
  const name = normalizeName(message.name || message.payload?.playerName || message.payload?.name);

  if (!name) {
    sendError(socket, message.requestId, "name is required", "BAD_MESSAGE");
    return;
  }

  const now = Date.now();
  const roomId = makeRoomId();
  const player = createPlayer(name, 0);
  const room = {
    id: roomId,
    status: "lobby",
    hostPlayerId: player.id,
    players: [player],
    sockets: new Map(),
    game: null,
    matchState: null,
    pendingPlayerTrade: null,
    lastPlayerTradeResult: null,
    endReason: null,
    endedAt: null,
    endedByPlayerId: null,
    revision: 1,
    createdAt: now,
    updatedAt: now
  };

  rooms.set(roomId, room);
  attachSocket(room, player, socket);

  send(socket, {
    type: "roomCreated",
    requestId: message.requestId,
    roomId,
    playerId: player.id,
    playerToken: player.token,
    shareUrl: getShareUrls(roomId)[0],
    shareUrls: getShareUrls(roomId),
    revision: room.revision,
    state: makeRoomState(room, player)
  });
}

function handleJoinRoom(socket, message) {
  const roomId = String(message.roomId || message.payload?.roomId || "").trim();
  const name = normalizeName(message.name || message.payload?.playerName || message.payload?.name);
  const room = rooms.get(roomId);

  if (!room) {
    sendError(socket, message.requestId, "room not found", "ROOM_NOT_FOUND");
    return;
  }

  if (room.status !== "lobby") {
    if (room.status === "ended") {
      sendError(socket, message.requestId, "room has ended", "ROOM_ENDED");
      return;
    }
    sendError(socket, message.requestId, "room is not in lobby", "ROOM_NOT_JOINABLE");
    return;
  }

  if (!name) {
    sendError(socket, message.requestId, "name is required", "BAD_MESSAGE");
    return;
  }

  if (room.players.length >= maxPlayers) {
    sendError(socket, message.requestId, "room is full", "ROOM_FULL");
    return;
  }

  const player = createPlayer(name, room.players.length);
  room.players.push(player);
  room.revision += 1;
  room.updatedAt = Date.now();
  attachSocket(room, player, socket);

  send(socket, {
    type: "roomJoined",
    requestId: message.requestId,
    roomId,
    playerId: player.id,
    playerToken: player.token,
    revision: room.revision,
    state: makeRoomState(room, player)
  });
  broadcastState(room);
}

function findAuthenticatedPlayer(room, message, socket) {
  const playerId = message.playerId || message.payload?.playerId || socket.playerId;
  const playerToken = message.playerToken || message.payload?.playerToken;
  const player = room.players.find((entry) => entry.id === playerId);

  if (!player || player.token !== playerToken) {
    return null;
  }

  return player;
}

function removePlayerFromRoom(room, player, socket) {
  room.players = room.players.filter((entry) => entry.id !== player.id);
  room.sockets.delete(player.id);
  socket.roomId = null;
  socket.playerId = null;

  if (room.players.length === 0) {
    rooms.delete(room.id);
    return null;
  }

  if (room.hostPlayerId === player.id) {
    room.hostPlayerId = room.players[0].id;
  }

  room.players.forEach((entry, index) => {
    entry.seatIndex = index;
  });
  room.revision += 1;
  room.updatedAt = Date.now();
  return room;
}

function clearSocketForPlayer(room, player, socket) {
  if (room.sockets.get(player.id) === socket) {
    room.sockets.delete(player.id);
  }
  socket.roomId = null;
  socket.playerId = null;
}

function endRoom(room, reason, endedByPlayerId = null) {
  if (room.status === "ended") return;
  room.status = "ended";
  room.endReason = reason;
  room.endedAt = Date.now();
  room.endedByPlayerId = endedByPlayerId;
  if (room.matchState?.game) {
    room.matchState.game.pendingAction = null;
    room.matchState.game.pendingDiscards = [];
    room.matchState.game.pendingRobberVictims = [];
  }
}

function activeOnlinePlayerId(room) {
  if (!room.matchState?.game?.players) return null;
  const activeSeat = room.matchState.game.active;
  return room.matchState.game.players.find((player) => player.id === activeSeat)?.onlinePlayerId || null;
}

function applyPlayingLeavePolicy(room, player) {
  if (room.hostPlayerId === player.id) {
    endRoom(room, "host_left", player.id);
    return;
  }

  if (activeOnlinePlayerId(room) === player.id) {
    endRoom(room, "player_left", player.id);
    return;
  }

  const remainingPlayers = room.players.filter((entry) => !entry.left);
  if (remainingPlayers.length < minStartPlayers) {
    endRoom(room, "not_enough_players", player.id);
  }
}

function handleLeaveRoom(socket, message) {
  const roomId = String(message.roomId || message.payload?.roomId || socket.roomId || "").trim();
  const room = rooms.get(roomId);

  if (!room) {
    sendError(socket, message.requestId, "room not found", "ROOM_NOT_FOUND");
    return;
  }

  const player = findAuthenticatedPlayer(room, message, socket);

  if (!player) {
    sendError(socket, message.requestId, "player authentication failed", "INVALID_TOKEN");
    return;
  }

  const now = Date.now();
  const wasEnded = room.status === "ended";
  player.left = true;
  player.leftAt = player.leftAt || now;
  player.connected = false;
  player.disconnectedAt = now;
  player.lastSeenAt = now;
  clearSocketForPlayer(room, player, socket);

  if (!wasEnded) {
    endRoom(room, room.hostPlayerId === player.id ? "host_left" : "player_left", player.id);
  }

  room.revision += 1;
  room.updatedAt = now;
  send(socket, {
    type: "roomLeft",
    requestId: message.requestId,
    roomId,
    playerId: player.id
  });
  broadcastState(room);
}

function handleReconnect(socket, message) {
  const roomId = String(message.roomId || message.payload?.roomId || "").trim();
  const room = rooms.get(roomId);

  if (!room) {
    sendError(socket, message.requestId, "room not found", "ROOM_NOT_FOUND");
    return;
  }

  if (room.status === "ended") {
    sendError(socket, message.requestId, "room has ended", "ROOM_ENDED");
    return;
  }

  const player = findAuthenticatedPlayer(room, message, socket);

  if (!player) {
    sendError(socket, message.requestId, "player authentication failed", "INVALID_TOKEN");
    return;
  }

  if (player.left) {
    sendError(socket, message.requestId, "player already left the room", "PLAYER_LEFT");
    return;
  }

  attachSocket(room, player, socket);
  room.revision += 1;
  room.updatedAt = Date.now();

  send(socket, {
    type: "reconnected",
    requestId: message.requestId,
    roomId,
    playerId: player.id,
    playerToken: player.token,
    revision: room.revision,
    state: makeRoomState(room, player)
  });
  broadcastState(room);
}

function handleStartGame(socket, message) {
  const roomId = String(message.roomId || message.payload?.roomId || socket.roomId || "").trim();
  const room = rooms.get(roomId);

  if (!room) {
    sendError(socket, message.requestId, "room not found", "ROOM_NOT_FOUND");
    return;
  }

  const player = findAuthenticatedPlayer(room, message, socket);

  if (!player) {
    sendError(socket, message.requestId, "player authentication failed", "INVALID_TOKEN");
    return;
  }

  if (room.status !== "lobby") {
    if (room.status === "ended") {
      sendError(socket, message.requestId, "room has ended", "ROOM_ENDED");
      return;
    }
    sendError(socket, message.requestId, "room is not in lobby", "INVALID_ACTION");
    return;
  }

  if (room.hostPlayerId !== player.id) {
    sendError(socket, message.requestId, "only the host can start the game", "NOT_HOST");
    return;
  }

  if (room.players.length < minStartPlayers) {
    sendError(socket, message.requestId, `at least ${minStartPlayers} players are required`, "ROOM_NOT_READY");
    return;
  }

  if (room.players.some((entry) => entry.left || !entry.connected)) {
    sendError(socket, message.requestId, "all players must be connected", "ROOM_NOT_READY");
    return;
  }

  room.status = "playing";
  room.matchState = createInitialMatchState(room.players);
  room.game = room.matchState.game;
  room.revision += 1;
  room.updatedAt = Date.now();

  const state = makeRoomState(room, player);
  send(socket, {
    type: "gameStarted",
    requestId: message.requestId,
    roomId,
    revision: room.revision,
    state
  });
  broadcastState(room);
}

function adjacentVertexIds(matchState, vertexId) {
  return matchState.edges
    .filter((edge) => edge.a === vertexId || edge.b === vertexId)
    .map((edge) => (edge.a === vertexId ? edge.b : edge.a));
}

function validateInitialPlacementCommand(socket, message) {
  const roomId = String(message.roomId || message.payload?.roomId || socket.roomId || "").trim();
  const room = rooms.get(roomId);

  if (!room) return { error: ["room not found", "ROOM_NOT_FOUND"] };
  if (room.status === "ended") return { room, error: ["room has ended", "ROOM_ENDED"] };
  if (room.status !== "playing") return { room, error: ["room is not playing", "INVALID_ACTION"] };

  const player = findAuthenticatedPlayer(room, message, socket);
  if (!player) return { room, error: ["player authentication failed", "INVALID_TOKEN"] };
  if (player.left) return { room, player, error: ["player already left the room", "PLAYER_LEFT"] };
  if (!player.connected) return { room, player, error: ["player is disconnected", "PLAYER_DISCONNECTED"] };
  if (room.players.some((entry) => !entry.connected && !entry.left)) {
    return { room, player, error: ["waiting for disconnected players to reconnect", "ROOM_NOT_READY"] };
  }
  if (!room.matchState?.game) return { room, player, error: ["match state is missing", "INVALID_ACTION"] };

  const game = room.matchState.game;
  if (game.phase !== "setup1" && game.phase !== "setup2") {
    return { room, player, game, error: ["initial placement is not active", "INVALID_ACTION"] };
  }

  const seatPlayer = game.players[game.setupIndex];
  if (!seatPlayer || seatPlayer.onlinePlayerId !== player.id) {
    return { room, player, game, error: ["not your initial placement turn", "NOT_YOUR_TURN"] };
  }

  return { room, player, game, matchState: room.matchState };
}

function sendPlacementAccepted(socket, message, room, player, type) {
  send(socket, {
    type,
    requestId: message.requestId,
    roomId: room.id,
    revision: room.revision,
    state: makeRoomState(room, player)
  });
  broadcastState(room);
}

function handlePlaceInitialSettlement(socket, message) {
  const context = validateInitialPlacementCommand(socket, message);
  if (context.error) {
    sendError(socket, message.requestId, context.error[0], context.error[1]);
    return;
  }

  const { room, player, game, matchState } = context;
  const vertexId = Number(message.payload?.vertexId);
  const vertex = matchState.vertices[vertexId];

  if (!Number.isInteger(vertexId) || !vertex) {
    sendError(socket, message.requestId, "invalid vertex", "INVALID_PLACEMENT");
    return;
  }
  if (game.pendingSettlement !== null) {
    sendError(socket, message.requestId, "place an initial road before another settlement", "INVALID_ACTION");
    return;
  }
  if (vertex.owner !== null && vertex.owner !== undefined) {
    sendError(socket, message.requestId, "vertex is already occupied", "VERTEX_OCCUPIED");
    return;
  }
  if (adjacentVertexIds(matchState, vertexId).some((id) => matchState.vertices[id]?.owner !== null && matchState.vertices[id]?.owner !== undefined)) {
    sendError(socket, message.requestId, "settlement distance rule violation", "DISTANCE_RULE");
    return;
  }

  const seatIndex = game.setupIndex;
  const gamePlayer = game.players[seatIndex];
  if (!gamePlayer || gamePlayer.settlements <= 0) {
    sendError(socket, message.requestId, "no settlements remaining", "NO_PIECES");
    return;
  }

  vertex.owner = seatIndex;
  vertex.city = false;
  gamePlayer.settlements -= 1;
  game.pendingSettlement = vertexId;
  room.revision += 1;
  room.updatedAt = Date.now();

  sendPlacementAccepted(socket, message, room, player, "initialSettlementPlaced");
}

function grantInitialResourcesForSettlement(matchState, seatIndex, vertexId) {
  const player = matchState.game.players[seatIndex];
  const vertex = matchState.vertices[vertexId];
  if (!player || !vertex) return;

  for (const tileId of vertex.tiles || []) {
    const tile = matchState.tiles[tileId];
    if (!tile || tile.type === "desert" || !resourceTypes.includes(tile.type)) continue;
    if ((matchState.game.bank[tile.type] || 0) <= 0) continue;
    matchState.game.bank[tile.type] -= 1;
    player.resources[tile.type] += 1;
  }
}

function advanceSetupTurn(matchState) {
  const game = matchState.game;
  const playerCount = game.players.length;

  if (game.phase === "setup1") {
    game.setupIndex += 1;
    if (game.setupIndex >= playerCount) {
      game.phase = "setup2";
      game.setupIndex = playerCount - 1;
    }
  } else {
    game.setupIndex -= 1;
    if (game.setupIndex < 0) {
      game.phase = "play";
      game.setupIndex = 0;
      game.active = 0;
      game.rolled = false;
      return;
    }
  }

  game.active = game.setupIndex;
}

function handlePlaceInitialRoad(socket, message) {
  const context = validateInitialPlacementCommand(socket, message);
  if (context.error) {
    sendError(socket, message.requestId, context.error[0], context.error[1]);
    return;
  }

  const { room, player, game, matchState } = context;
  const edgeId = Number(message.payload?.edgeId);
  const edge = matchState.edges[edgeId];

  if (!Number.isInteger(edgeId) || !edge) {
    sendError(socket, message.requestId, "invalid edge", "INVALID_PLACEMENT");
    return;
  }
  if (game.pendingSettlement === null || game.pendingSettlement === undefined) {
    sendError(socket, message.requestId, "place an initial settlement before a road", "INVALID_ACTION");
    return;
  }
  if (edge.owner !== null && edge.owner !== undefined) {
    sendError(socket, message.requestId, "edge is already occupied", "EDGE_OCCUPIED");
    return;
  }
  if (edge.a !== game.pendingSettlement && edge.b !== game.pendingSettlement) {
    sendError(socket, message.requestId, "road must connect to the pending settlement", "ROAD_NOT_CONNECTED");
    return;
  }

  const seatIndex = game.setupIndex;
  const gamePlayer = game.players[seatIndex];
  if (!gamePlayer || gamePlayer.roads <= 0) {
    sendError(socket, message.requestId, "no roads remaining", "NO_PIECES");
    return;
  }

  const settlementForResources = game.pendingSettlement;
  edge.owner = seatIndex;
  gamePlayer.roads -= 1;
  if (game.phase === "setup2") {
    grantInitialResourcesForSettlement(matchState, seatIndex, settlementForResources);
  }
  game.pendingSettlement = null;
  advanceSetupTurn(matchState);
  room.revision += 1;
  room.updatedAt = Date.now();

  sendPlacementAccepted(socket, message, room, player, "initialRoadPlaced");
}

function validatePlayCommand(socket, message) {
  const roomId = String(message.roomId || message.payload?.roomId || socket.roomId || "").trim();
  const room = rooms.get(roomId);

  if (!room) return { error: ["room not found", "ROOM_NOT_FOUND"] };
  if (room.status === "ended") return { room, error: ["room has ended", "ROOM_ENDED"] };
  if (room.status !== "playing") return { room, error: ["room is not playing", "INVALID_ACTION"] };

  const player = findAuthenticatedPlayer(room, message, socket);
  if (!player) return { room, error: ["player authentication failed", "INVALID_TOKEN"] };
  if (player.left) return { room, player, error: ["player already left the room", "PLAYER_LEFT"] };
  if (!player.connected) return { room, player, error: ["player is disconnected", "PLAYER_DISCONNECTED"] };
  if (room.players.some((entry) => !entry.connected && !entry.left)) {
    return { room, player, error: ["waiting for disconnected players to reconnect", "ROOM_NOT_READY"] };
  }
  if (!room.matchState?.game) return { room, player, error: ["match state is missing", "INVALID_ACTION"] };

  const game = room.matchState.game;
  if (game.phase !== "play") {
    return { room, player, game, error: ["game is not in play phase", "INVALID_ACTION"] };
  }
  if (game.winner !== null && game.winner !== undefined) {
    return { room, player, game, error: ["game is already finished", "INVALID_ACTION"] };
  }

  const activePlayer = game.players[game.active];
  if (!activePlayer || activePlayer.onlinePlayerId !== player.id) {
    return { room, player, game, error: ["not your turn", "NOT_YOUR_TURN"] };
  }

  return { room, player, game, matchState: room.matchState };
}

function rollServerDice(forcedTotal = null) {
  if (Number.isInteger(forcedTotal) && forcedTotal >= 2 && forcedTotal <= 12) {
    if (forcedTotal === 2) return { die1: 1, die2: 1, total: 2 };
    if (forcedTotal === 12) return { die1: 6, die2: 6, total: 12 };
    const die1 = Math.max(1, Math.min(6, forcedTotal - 1));
    return { die1, die2: forcedTotal - die1, total: forcedTotal };
  }
  const die1 = crypto.randomInt(1, 7);
  const die2 = crypto.randomInt(1, 7);
  return { die1, die2, total: die1 + die2 };
}

function distributeResourcesForRoll(matchState, total) {
  const production = [];
  if (total === 7) return production;
  const demands = [];

  for (const tile of matchState.tiles) {
    if (tile.id === matchState.robberTile || tile.type === "desert" || tile.number !== total) continue;
    if (!resourceTypes.includes(tile.type)) continue;

    for (const vertexId of tile.vertexIds) {
      const vertex = matchState.vertices[vertexId];
      if (!vertex || vertex.owner === null || vertex.owner === undefined) continue;
      const player = matchState.game.players[vertex.owner];
      if (!player) continue;
      const amount = vertex.city ? 2 : 1;
      demands.push({ seatIndex: player.id, resource: tile.type, amount });
    }
  }

  for (const type of resourceTypes) {
    const entries = demands.filter((entry) => entry.resource === type);
    if (!entries.length) continue;
    const totalDemand = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const available = Math.max(0, Number(matchState.game.bank[type]) || 0);
    const affectedSeats = new Set(entries.map((entry) => entry.seatIndex));
    if (available < totalDemand && affectedSeats.size > 1) continue;

    for (const entry of entries) {
      const player = matchState.game.players[entry.seatIndex];
      const paid = Math.min(entry.amount, Math.max(0, Number(matchState.game.bank[type]) || 0));
      if (!player || paid <= 0) continue;
      matchState.game.bank[type] -= paid;
      player.resources[type] += paid;
      production.push({ seatIndex: player.id, resource: type, amount: paid });
    }
  }

  return production;
}

function hasResourcesForCost(player, cost) {
  return Object.entries(cost).every(([type, amount]) => (Number(player.resources[type]) || 0) >= amount);
}

function spendResourcesToBank(matchState, player, cost) {
  for (const [type, amount] of Object.entries(cost)) {
    player.resources[type] -= amount;
    matchState.game.bank[type] += amount;
  }
}

function normalizeTradeResources(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = Object.fromEntries(resourceTypes.map((type) => [type, 0]));
  for (const [type, rawAmount] of Object.entries(value)) {
    if (!resourceTypes.includes(type)) return null;
    if (!Number.isInteger(rawAmount) || rawAmount < 0) return null;
    result[type] = rawAmount;
  }
  return result;
}

function hasResourceBundle(player, resources) {
  return resourceTypes.every((type) => (Number(player.resources[type]) || 0) >= (Number(resources[type]) || 0));
}

function moveResourceBundle(fromPlayer, toPlayer, resources) {
  for (const type of resourceTypes) {
    const amount = Number(resources[type]) || 0;
    if (amount <= 0) continue;
    fromPlayer.resources[type] -= amount;
    toPlayer.resources[type] += amount;
  }
}

function validateTradeBundlePair(offer, request) {
  if (!offer || !request) return "INVALID_TRADE_RESOURCES";
  if (resourceTotal(offer) <= 0 || resourceTotal(request) <= 0) return "INVALID_TRADE_RESOURCES";
  return null;
}

function canConnectThroughVertex(matchState, seatIndex, vertexId) {
  const owner = matchState.vertices[vertexId]?.owner;
  return owner === null || owner === undefined || owner === seatIndex;
}

function playerHasAdjacentRoad(matchState, seatIndex, vertexId) {
  return matchState.edges.some((edge) => edge.owner === seatIndex && (edge.a === vertexId || edge.b === vertexId));
}

function canBuildRoadAt(matchState, seatIndex, edge) {
  if (!edge || edge.owner !== null && edge.owner !== undefined) return false;
  const touchesOwnBuilding = matchState.vertices[edge.a]?.owner === seatIndex || matchState.vertices[edge.b]?.owner === seatIndex;
  const touchesOwnRoad = [edge.a, edge.b].some((vertexId) => {
    if (!canConnectThroughVertex(matchState, seatIndex, vertexId)) return false;
    return matchState.edges.some((other) => other.id !== edge.id && other.owner === seatIndex && (other.a === vertexId || other.b === vertexId));
  });
  return touchesOwnBuilding || touchesOwnRoad;
}

function hasLegalRoadPlacement(matchState, seatIndex) {
  const player = matchState.game.players[seatIndex];
  if (!player || player.roads <= 0) return false;
  return matchState.edges.some((edge) => canBuildRoadAt(matchState, seatIndex, edge));
}

function longestRoadLength(matchState, seatIndex) {
  const owned = matchState.edges.filter((edge) => edge.owner === seatIndex);
  const byVertex = new Map();
  owned.forEach((edge) => {
    [edge.a, edge.b].forEach((vertexId) => {
      if (!byVertex.has(vertexId)) byVertex.set(vertexId, []);
      byVertex.get(vertexId).push(edge);
    });
  });

  function dfs(vertexId, used) {
    if (used.size > 0 && !canConnectThroughVertex(matchState, seatIndex, vertexId)) return 0;
    let best = 0;
    for (const edge of byVertex.get(vertexId) || []) {
      if (used.has(edge.id)) continue;
      const nextVertexId = edge.a === vertexId ? edge.b : edge.a;
      used.add(edge.id);
      best = Math.max(best, 1 + dfs(nextVertexId, used));
      used.delete(edge.id);
    }
    return best;
  }

  if (!owned.length) return 0;
  return Math.max(0, ...owned.flatMap((edge) => [dfs(edge.a, new Set()), dfs(edge.b, new Set())]));
}

function updateLongestRoadForSeat(matchState, seatIndex) {
  const game = matchState.game;
  const candidateLength = longestRoadLength(matchState, seatIndex);
  const currentSeat = game.longestRoad === null || game.longestRoad === undefined ? null : game.longestRoad;
  const currentLength = currentSeat === null ? 0 : longestRoadLength(matchState, currentSeat);

  if (currentSeat === seatIndex) {
    if (candidateLength < 5) game.longestRoad = null;
    updateWinnerForSeat(matchState, seatIndex);
    return;
  }

  if (candidateLength >= 5 && (currentSeat === null || candidateLength > currentLength)) {
    game.longestRoad = seatIndex;
  }
  if (game.longestRoad !== null && game.longestRoad !== undefined) {
    updateWinnerForSeat(matchState, game.longestRoad);
  }
  updateWinnerForSeat(matchState, seatIndex);
}

function canBuildSettlementAt(matchState, seatIndex, vertex) {
  if (!vertex || vertex.owner !== null && vertex.owner !== undefined) return false;
  if (adjacentVertexIds(matchState, vertex.id).some((id) => matchState.vertices[id]?.owner !== null && matchState.vertices[id]?.owner !== undefined)) {
    return false;
  }
  return playerHasAdjacentRoad(matchState, seatIndex, vertex.id);
}

function publicBuildingPoints(matchState, seatIndex) {
  return matchState.vertices.reduce((sum, vertex) => {
    if (vertex.owner !== seatIndex) return sum;
    return sum + (vertex.city ? 2 : 1);
  }, 0);
}

function victoryPointsForSeat(matchState, seatIndex) {
  const game = matchState.game;
  const player = game.players[seatIndex];
  if (!player) return 0;
  let points = publicBuildingPoints(matchState, seatIndex) + countHiddenVictoryPoints(player.dev);
  if (game.largestArmy === seatIndex) points += 2;
  if (game.longestRoad === seatIndex) points += 2;
  return points;
}

function updateWinnerForSeat(matchState, seatIndex) {
  if (matchState.game.winner !== null && matchState.game.winner !== undefined) return;
  if (victoryPointsForSeat(matchState, seatIndex) >= 10) {
    matchState.game.winner = seatIndex;
  }
}

function updateLargestArmy(matchState, seatIndex) {
  const game = matchState.game;
  const player = game.players[seatIndex];
  if (!player || player.knights < 3) return;
  const current = game.largestArmy === null || game.largestArmy === undefined ? null : game.players[game.largestArmy];
  if (!current || player.knights > current.knights) {
    game.largestArmy = seatIndex;
  }
}

function hasPendingAction(game) {
  return Boolean(game.pendingAction);
}

function makeMoveRobberPending(matchState, actorSeatIndex, source) {
  matchState.game.pendingAction = {
    type: "moveRobber",
    source,
    actorSeatIndex,
    fromTileId: matchState.robberTile,
    createdAt: Date.now()
  };
  matchState.game.pendingRobberVictims = [];
}

function beginRobberFlow(matchState, actorSeatIndex, source) {
  makeMoveRobberPending(matchState, actorSeatIndex, source);
}

function beginSevenPending(matchState, actorSeatIndex) {
  const discards = matchState.game.players
    .filter((player) => countResources(player.resources) > 7)
    .map((player) => ({
      seatIndex: player.id,
      onlinePlayerId: player.onlinePlayerId,
      needed: Math.floor(countResources(player.resources) / 2),
      discarded: false
    }));

  matchState.game.pendingDiscards = discards;
  if (!discards.length) {
    beginRobberFlow(matchState, actorSeatIndex, "rollSeven");
    return;
  }

  matchState.game.pendingAction = {
    type: "discardForSeven",
    source: "rollSeven",
    actorSeatIndex,
    discards,
    createdAt: Date.now()
  };
}

function finishDiscardIfReady(matchState) {
  const pending = matchState.game.pendingAction;
  if (!pending || pending.type !== "discardForSeven") return;
  if (pending.discards.some((entry) => !entry.discarded)) return;
  matchState.game.pendingDiscards = [];
  beginRobberFlow(matchState, pending.actorSeatIndex, pending.source);
}

function robberVictimCandidates(matchState, actorSeatIndex, tileId) {
  const tile = matchState.tiles[tileId];
  if (!tile) return [];
  const seats = new Set();
  tile.vertexIds.forEach((vertexId) => {
    const owner = matchState.vertices[vertexId]?.owner;
    if (owner === null || owner === undefined || owner === actorSeatIndex) return;
    const victim = matchState.game.players[owner];
    if (victim && countResources(victim.resources) > 0) seats.add(owner);
  });
  return [...seats];
}

function randomResourceFromPlayer(player) {
  const pool = [];
  for (const type of resourceTypes) {
    const amount = Number(player.resources[type]) || 0;
    for (let index = 0; index < amount; index += 1) pool.push(type);
  }
  if (!pool.length) return null;
  return pool[crypto.randomInt(pool.length)];
}

function setRobberResult(matchState, actorSeatIndex, victimSeatIndex, resource, reason = null) {
  const game = matchState.game;
  game.robberResultSeq = (Number(game.robberResultSeq) || 0) + 1;
  game.lastRobberResult = {
    id: `rob-${game.robberResultSeq}`,
    actorSeatIndex,
    victimSeatIndex,
    resource,
    reason,
    createdAt: Date.now()
  };
}

function stealRandomResource(matchState, actorSeatIndex, victimSeatIndex) {
  const actor = matchState.game.players[actorSeatIndex];
  const victim = matchState.game.players[victimSeatIndex];
  if (!actor || !victim) return null;
  const resource = randomResourceFromPlayer(victim);
  if (!resource) return null;
  victim.resources[resource] -= 1;
  actor.resources[resource] += 1;
  setRobberResult(matchState, actorSeatIndex, victimSeatIndex, resource);
  return resource;
}

function resolveRobberVictims(matchState, actorSeatIndex, tileId, source) {
  const candidates = robberVictimCandidates(matchState, actorSeatIndex, tileId);
  matchState.game.pendingRobberVictims = candidates;
  if (candidates.length === 0) {
    setRobberResult(matchState, actorSeatIndex, null, null, "NO_VICTIM");
    matchState.game.pendingAction = null;
    matchState.game.pendingRobberVictims = [];
    return;
  }
  if (candidates.length === 1) {
    stealRandomResource(matchState, actorSeatIndex, candidates[0]);
    matchState.game.pendingAction = null;
    matchState.game.pendingRobberVictims = [];
    return;
  }
  matchState.game.pendingAction = {
    type: "chooseRobberVictim",
    source,
    actorSeatIndex,
    tileId,
    victimSeatIndexes: candidates,
    createdAt: Date.now()
  };
}

function validateBuildCommand(socket, message) {
  const context = validatePlayCommand(socket, message);
  if (context.error) return context;
  if (!context.game.rolled) return { ...context, error: ["roll dice before building", "ROLL_REQUIRED"] };
  if (context.room.pendingPlayerTrade) return { ...context, error: ["pending player trade must be resolved first", "INVALID_ACTION"] };
  if (hasPendingAction(context.game) || context.game.pendingDiscards?.length || context.game.pendingRobberVictims?.length || context.game.pendingFreeRoads > 0) {
    return { ...context, error: ["pending action must be resolved first", "INVALID_ACTION"] };
  }
  return context;
}

function validateBankTradeCommand(socket, message) {
  const context = validatePlayCommand(socket, message);
  if (context.error) return context;
  if (!context.game.rolled) return { ...context, error: ["roll dice before trading", "ROLL_REQUIRED"] };
  if (context.room.pendingPlayerTrade) return { ...context, error: ["pending player trade must be resolved first", "INVALID_ACTION"] };
  if (hasPendingAction(context.game) || context.game.pendingDiscards?.length || context.game.pendingRobberVictims?.length || context.game.pendingFreeRoads > 0) {
    return { ...context, error: ["pending action must be resolved first", "INVALID_ACTION"] };
  }
  return context;
}

function hasBlockingPendingAction(context) {
  return Boolean(
    context.room.pendingPlayerTrade
    || hasPendingAction(context.game)
    || context.game.pendingDiscards?.length
    || context.game.pendingRobberVictims?.length
    || context.game.pendingFreeRoads > 0
  );
}

function finishBuildCommand(socket, message, room, player, type) {
  room.revision += 1;
  room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, room, player, type);
}

function handleBuildRoad(socket, message) {
  const context = validateBuildCommand(socket, message);
  if (context.error) {
    sendError(socket, message.requestId, context.error[0], context.error[1]);
    return;
  }

  const { room, player, game, matchState } = context;
  const seatIndex = game.active;
  const gamePlayer = game.players[seatIndex];
  const edgeId = Number(message.payload?.edgeId);
  const edge = matchState.edges[edgeId];

  if (!Number.isInteger(edgeId) || !edge) return sendError(socket, message.requestId, "invalid edge", "INVALID_PLACEMENT");
  if (edge.owner !== null && edge.owner !== undefined) return sendError(socket, message.requestId, "edge is already occupied", "EDGE_OCCUPIED");
  if (gamePlayer.roads <= 0) return sendError(socket, message.requestId, "no roads remaining", "NO_PIECES");
  if (!canBuildRoadAt(matchState, seatIndex, edge)) return sendError(socket, message.requestId, "road is not connected", "ROAD_NOT_CONNECTED");
  if (!hasResourcesForCost(gamePlayer, buildCosts.road)) return sendError(socket, message.requestId, "not enough resources", "NOT_ENOUGH_RESOURCES");

  spendResourcesToBank(matchState, gamePlayer, buildCosts.road);
  edge.owner = seatIndex;
  gamePlayer.roads -= 1;
  updateLongestRoadForSeat(matchState, seatIndex);
  updateWinnerForSeat(matchState, seatIndex);
  finishBuildCommand(socket, message, room, player, "roadBuilt");
}

function handleBuildSettlement(socket, message) {
  const context = validateBuildCommand(socket, message);
  if (context.error) {
    sendError(socket, message.requestId, context.error[0], context.error[1]);
    return;
  }

  const { room, player, game, matchState } = context;
  const seatIndex = game.active;
  const gamePlayer = game.players[seatIndex];
  const vertexId = Number(message.payload?.vertexId);
  const vertex = matchState.vertices[vertexId];

  if (!Number.isInteger(vertexId) || !vertex) return sendError(socket, message.requestId, "invalid vertex", "INVALID_PLACEMENT");
  if (vertex.owner !== null && vertex.owner !== undefined) return sendError(socket, message.requestId, "vertex is already occupied", "VERTEX_OCCUPIED");
  if (!canBuildSettlementAt(matchState, seatIndex, vertex)) return sendError(socket, message.requestId, "settlement cannot be built there", "INVALID_PLACEMENT");
  if (gamePlayer.settlements <= 0) return sendError(socket, message.requestId, "no settlements remaining", "NO_PIECES");
  if (!hasResourcesForCost(gamePlayer, buildCosts.settlement)) return sendError(socket, message.requestId, "not enough resources", "NOT_ENOUGH_RESOURCES");

  spendResourcesToBank(matchState, gamePlayer, buildCosts.settlement);
  vertex.owner = seatIndex;
  vertex.city = false;
  gamePlayer.settlements -= 1;
  updateWinnerForSeat(matchState, seatIndex);
  finishBuildCommand(socket, message, room, player, "settlementBuilt");
}

function handleBuildCity(socket, message) {
  const context = validateBuildCommand(socket, message);
  if (context.error) {
    sendError(socket, message.requestId, context.error[0], context.error[1]);
    return;
  }

  const { room, player, game, matchState } = context;
  const seatIndex = game.active;
  const gamePlayer = game.players[seatIndex];
  const vertexId = Number(message.payload?.vertexId);
  const vertex = matchState.vertices[vertexId];

  if (!Number.isInteger(vertexId) || !vertex) return sendError(socket, message.requestId, "invalid vertex", "INVALID_PLACEMENT");
  if (vertex.owner !== seatIndex) return sendError(socket, message.requestId, "city must upgrade your settlement", "INVALID_PLACEMENT");
  if (vertex.city) return sendError(socket, message.requestId, "vertex is already a city", "INVALID_PLACEMENT");
  if (gamePlayer.cities <= 0) return sendError(socket, message.requestId, "no cities remaining", "NO_PIECES");
  if (!hasResourcesForCost(gamePlayer, buildCosts.city)) return sendError(socket, message.requestId, "not enough resources", "NOT_ENOUGH_RESOURCES");

  spendResourcesToBank(matchState, gamePlayer, buildCosts.city);
  vertex.city = true;
  gamePlayer.cities -= 1;
  gamePlayer.settlements += 1;
  updateWinnerForSeat(matchState, seatIndex);
  finishBuildCommand(socket, message, room, player, "cityBuilt");
}

function handleBankTrade(socket, message) {
  const context = validateBankTradeCommand(socket, message);
  if (context.error) {
    sendError(socket, message.requestId, context.error[0], context.error[1]);
    return;
  }

  const { room, player, matchState } = context;
  const seatIndex = player.seatIndex;
  const gamePlayer = matchState.game.players[seatIndex];
  const give = String(message.payload?.give || "");
  const get = String(message.payload?.get || "");

  if (!resourceTypes.includes(give) || !resourceTypes.includes(get)) {
    sendError(socket, message.requestId, "invalid trade resource", "INVALID_RESOURCE");
    return;
  }
  if (give === get) {
    sendError(socket, message.requestId, "trade resources must be different", "SAME_RESOURCE");
    return;
  }

  const ratio = getTradeRatioForResource(matchState, seatIndex, give);
  if ((Number(gamePlayer.resources[give]) || 0) < ratio) {
    sendError(socket, message.requestId, "not enough resources for trade", "NOT_ENOUGH_RESOURCES");
    return;
  }
  if ((Number(matchState.game.bank[get]) || 0) < 1) {
    sendError(socket, message.requestId, "bank resource is empty", "BANK_RESOURCE_EMPTY");
    return;
  }

  gamePlayer.resources[give] -= ratio;
  matchState.game.bank[give] += ratio;
  matchState.game.bank[get] -= 1;
  gamePlayer.resources[get] += 1;
  matchState.game.lastTrade = {
    seatIndex,
    ratio,
    give: null,
    get: null,
    createdAt: Date.now()
  };
  room.revision += 1;
  room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, room, player, "bankTraded");
}

function makeDevCard(game, type) {
  game.devCardSeq += 1;
  return {
    id: `dev-${game.devCardSeq}`,
    type,
    boughtRound: game.round,
    boughtTurnSeat: game.active
  };
}

function wasBoughtThisTurn(card, game) {
  return card.boughtRound === game.round && card.boughtTurnSeat === game.active;
}

function validateBuyDevCardCommand(socket, message) {
  const context = validatePlayCommand(socket, message);
  if (context.error) return context;
  if (!context.game.rolled) return { ...context, error: ["roll dice before buying development card", "ROLL_REQUIRED"] };
  if (hasBlockingPendingAction(context)) return { ...context, error: ["pending action must be resolved first", "INVALID_ACTION"] };
  return context;
}

function validatePlayDevCardCommand(socket, message) {
  const context = validatePlayCommand(socket, message);
  if (context.error) return context;
  if (hasBlockingPendingAction(context)) return { ...context, error: ["pending action must be resolved first", "INVALID_ACTION"] };
  if (context.game.usedDevThisTurn) return { ...context, error: ["development card already used this turn", "DEV_CARD_ALREADY_USED"] };
  return context;
}

function handleBuyDevCard(socket, message) {
  const context = validateBuyDevCardCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);

  const { room, player, game, matchState } = context;
  const gamePlayer = game.players[player.seatIndex];
  if (!matchState.devDeck.length) return sendError(socket, message.requestId, "development card deck is empty", "DEV_DECK_EMPTY");
  if (!hasResourcesForCost(gamePlayer, buildCosts.dev)) return sendError(socket, message.requestId, "not enough resources", "NOT_ENOUGH_RESOURCES");

  spendResourcesToBank(matchState, gamePlayer, buildCosts.dev);
  const card = makeDevCard(game, matchState.devDeck.pop());
  gamePlayer.dev.push(card);
  updateWinnerForSeat(matchState, player.seatIndex);
  room.revision += 1;
  room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, room, player, "devCardBought");
}

function findPlayableDevCard(gamePlayer, game, cardId) {
  const index = gamePlayer.dev.findIndex((card) => card.id === cardId);
  if (index < 0) return { error: ["development card not found", "DEV_CARD_NOT_FOUND"] };
  const card = gamePlayer.dev[index];
  if (card.type === "victory") return { error: ["victory point cards cannot be played", "DEV_CARD_NOT_PLAYABLE"] };
  if (wasBoughtThisTurn(card, game)) return { error: ["development card was bought this turn", "DEV_CARD_BOUGHT_THIS_TURN"] };
  return { card, index };
}

function removeDevCardAt(gamePlayer, index) {
  return gamePlayer.dev.splice(index, 1)[0];
}

function resourceListCounts(list) {
  const counts = Object.fromEntries(resourceTypes.map((type) => [type, 0]));
  for (const resource of list) counts[resource] += 1;
  return counts;
}

function handlePlayDevCard(socket, message) {
  const context = validatePlayDevCardCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);

  const { room, player, game, matchState } = context;
  const gamePlayer = game.players[player.seatIndex];
  const cardId = String(message.payload?.cardId || "");
  const lookup = findPlayableDevCard(gamePlayer, game, cardId);
  if (lookup.error) return sendError(socket, message.requestId, lookup.error[0], lookup.error[1]);
  const { card, index } = lookup;

  if (card.type === "yearPlenty") {
    const resources = Array.isArray(message.payload?.resources) ? message.payload.resources : [];
    if (resources.length !== 2 || resources.some((resource) => !resourceTypes.includes(resource))) {
      return sendError(socket, message.requestId, "invalid year of plenty resources", "INVALID_DEV_PAYLOAD");
    }
    const counts = resourceListCounts(resources);
    for (const [type, amount] of Object.entries(counts)) {
      if ((Number(game.bank[type]) || 0) < amount) return sendError(socket, message.requestId, "bank resource is empty", "BANK_RESOURCE_EMPTY");
    }
    removeDevCardAt(gamePlayer, index);
    for (const resource of resources) {
      game.bank[resource] -= 1;
      gamePlayer.resources[resource] += 1;
    }
  } else if (card.type === "monopoly") {
    const resource = String(message.payload?.resource || "");
    if (!resourceTypes.includes(resource)) return sendError(socket, message.requestId, "invalid monopoly resource", "INVALID_DEV_PAYLOAD");
    removeDevCardAt(gamePlayer, index);
    let gained = 0;
    for (const other of game.players) {
      if (other.id === player.seatIndex) continue;
      const amount = Number(other.resources[resource]) || 0;
      if (amount <= 0) continue;
      other.resources[resource] = 0;
      gamePlayer.resources[resource] += amount;
      gained += amount;
    }
    game.lastDevCardResult = { type: "monopoly", seatIndex: player.seatIndex, resource: null, gained, createdAt: Date.now() };
  } else if (card.type === "roadBuilding") {
    if (gamePlayer.roads <= 0) return sendError(socket, message.requestId, "no roads remaining", "NO_PIECES");
    removeDevCardAt(gamePlayer, index);
    if (hasLegalRoadPlacement(matchState, player.seatIndex)) {
      game.pendingFreeRoads = Math.min(2, gamePlayer.roads);
      game.freeRoadOwnerSeat = player.seatIndex;
    } else {
      game.pendingFreeRoads = 0;
      game.freeRoadOwnerSeat = null;
    }
  } else if (card.type === "knight") {
    removeDevCardAt(gamePlayer, index);
    gamePlayer.knights += 1;
    updateLargestArmy(matchState, player.seatIndex);
    beginRobberFlow(matchState, player.seatIndex, "knight");
  } else {
    return sendError(socket, message.requestId, "unsupported development card", "DEV_CARD_NOT_PLAYABLE");
  }

  game.usedDevThisTurn = true;
  updateWinnerForSeat(matchState, player.seatIndex);
  room.revision += 1;
  room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, room, player, "devCardPlayed");
}

function validatePlaceFreeRoadCommand(socket, message) {
  const context = validatePlayCommand(socket, message);
  if (context.error) return context;
  if (context.room.pendingPlayerTrade) return { ...context, error: ["pending player trade must be resolved first", "INVALID_ACTION"] };
  if (hasPendingAction(context.game) || context.game.pendingDiscards?.length || context.game.pendingRobberVictims?.length) {
    return { ...context, error: ["pending action must be resolved first", "INVALID_ACTION"] };
  }
  if (context.game.pendingFreeRoads <= 0 || context.game.freeRoadOwnerSeat === null || context.game.freeRoadOwnerSeat === undefined) {
    return { ...context, error: ["no free roads pending", "INVALID_ACTION"] };
  }
  if (context.player.seatIndex !== context.game.freeRoadOwnerSeat) {
    return { ...context, error: ["not your free road placement", "NOT_YOUR_TURN"] };
  }
  return context;
}

function handlePlaceFreeRoad(socket, message) {
  const context = validatePlaceFreeRoadCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);

  const { room, player, game, matchState } = context;
  const seatIndex = game.freeRoadOwnerSeat;
  const gamePlayer = game.players[seatIndex];
  const edgeId = Number(message.payload?.edgeId);
  const edge = matchState.edges[edgeId];
  if (!Number.isInteger(edgeId) || !edge) return sendError(socket, message.requestId, "invalid edge", "INVALID_PLACEMENT");
  if (edge.owner !== null && edge.owner !== undefined) return sendError(socket, message.requestId, "edge is already occupied", "EDGE_OCCUPIED");
  if (gamePlayer.roads <= 0) return sendError(socket, message.requestId, "no roads remaining", "NO_PIECES");
  if (!canBuildRoadAt(matchState, seatIndex, edge)) return sendError(socket, message.requestId, "road is not connected", "ROAD_NOT_CONNECTED");

  edge.owner = seatIndex;
  gamePlayer.roads -= 1;
  game.pendingFreeRoads = Math.max(0, game.pendingFreeRoads - 1);
  updateLongestRoadForSeat(matchState, seatIndex);
  if (game.pendingFreeRoads <= 0 || gamePlayer.roads <= 0 || !hasLegalRoadPlacement(matchState, seatIndex)) {
    game.pendingFreeRoads = 0;
    game.freeRoadOwnerSeat = null;
  }
  updateWinnerForSeat(matchState, seatIndex);
  room.revision += 1;
  room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, room, player, "freeRoadPlaced");
}

function validatePendingActionCommand(socket, message) {
  const roomId = String(message.roomId || message.payload?.roomId || socket.roomId || "").trim();
  const room = rooms.get(roomId);
  if (!room) return { error: ["room not found", "ROOM_NOT_FOUND"] };
  if (room.status === "ended") return { room, error: ["room has ended", "ROOM_ENDED"] };
  if (room.status !== "playing") return { room, error: ["room is not playing", "INVALID_ACTION"] };
  const player = findAuthenticatedPlayer(room, message, socket);
  if (!player) return { room, error: ["player authentication failed", "INVALID_TOKEN"] };
  if (player.left) return { room, player, error: ["player already left the room", "PLAYER_LEFT"] };
  if (!player.connected) return { room, player, error: ["player is disconnected", "PLAYER_DISCONNECTED"] };
  if (room.players.some((entry) => !entry.connected && !entry.left)) {
    return { room, player, error: ["waiting for disconnected players to reconnect", "ROOM_NOT_READY"] };
  }
  if (!room.matchState?.game) return { room, player, error: ["match state is missing", "INVALID_ACTION"] };
  const game = room.matchState.game;
  if (game.phase !== "play") return { room, player, game, error: ["game is not in play phase", "INVALID_ACTION"] };
  if (game.winner !== null && game.winner !== undefined) return { room, player, game, error: ["game is already finished", "INVALID_ACTION"] };
  if (!game.pendingAction) return { room, player, game, error: ["no pending action", "NO_PENDING_ACTION"] };
  return { room, player, game, matchState: room.matchState, pendingAction: game.pendingAction };
}

function handleDiscardForSeven(socket, message) {
  const context = validatePendingActionCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);
  const { room, player, game, matchState, pendingAction } = context;
  if (pendingAction.type !== "discardForSeven") return sendError(socket, message.requestId, "invalid pending action", "INVALID_PENDING_ACTION");
  const entry = pendingAction.discards.find((item) => item.seatIndex === player.seatIndex);
  if (!entry) return sendError(socket, message.requestId, "discard is not required", "DISCARD_NOT_REQUIRED");
  if (entry.discarded) return sendError(socket, message.requestId, "discard already done", "DISCARD_ALREADY_DONE");
  const resources = normalizeTradeResources(message.payload?.resources);
  if (!resources || resourceTotal(resources) !== entry.needed) return sendError(socket, message.requestId, "invalid discard resources", "INVALID_DISCARD");
  const gamePlayer = game.players[player.seatIndex];
  if (!hasResourceBundle(gamePlayer, resources)) return sendError(socket, message.requestId, "discard exceeds resources", "NOT_ENOUGH_RESOURCES");

  spendResourcesToBank(matchState, gamePlayer, resources);
  entry.discarded = true;
  const legacy = game.pendingDiscards.find((item) => item.seatIndex === entry.seatIndex);
  if (legacy) legacy.discarded = true;
  finishDiscardIfReady(matchState);
  room.revision += 1;
  room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, room, player, "sevenDiscarded");
}

function handleMoveRobber(socket, message) {
  const context = validatePendingActionCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);
  const { room, player, matchState, pendingAction } = context;
  if (pendingAction.type !== "moveRobber") return sendError(socket, message.requestId, "invalid pending action", "INVALID_PENDING_ACTION");
  if (pendingAction.actorSeatIndex !== player.seatIndex) return sendError(socket, message.requestId, "not your robber move", "NOT_YOUR_TURN");
  const tileId = Number(message.payload?.tileId);
  if (!Number.isInteger(tileId) || !matchState.tiles[tileId]) return sendError(socket, message.requestId, "invalid robber tile", "INVALID_ROBBER_TILE");
  if (tileId === matchState.robberTile) return sendError(socket, message.requestId, "robber must move to another tile", "ROBBER_SAME_TILE");

  matchState.robberTile = tileId;
  resolveRobberVictims(matchState, pendingAction.actorSeatIndex, tileId, pendingAction.source);
  room.revision += 1;
  room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, room, player, "robberMoved");
}

function handleChooseRobberVictim(socket, message) {
  const context = validatePendingActionCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);
  const { room, player, matchState, pendingAction } = context;
  if (pendingAction.type !== "chooseRobberVictim") return sendError(socket, message.requestId, "invalid pending action", "INVALID_PENDING_ACTION");
  if (pendingAction.actorSeatIndex !== player.seatIndex) return sendError(socket, message.requestId, "not your robber victim choice", "NOT_YOUR_TURN");
  const victimSeatIndex = Number(message.payload?.victimSeatIndex);
  if (!Number.isInteger(victimSeatIndex) || !pendingAction.victimSeatIndexes.includes(victimSeatIndex)) {
    return sendError(socket, message.requestId, "invalid robber victim", "INVALID_ROBBER_VICTIM");
  }
  const victim = matchState.game.players[victimSeatIndex];
  if (!victim || countResources(victim.resources) <= 0) return sendError(socket, message.requestId, "victim has no resources", "VICTIM_HAS_NO_RESOURCES");

  stealRandomResource(matchState, pendingAction.actorSeatIndex, victimSeatIndex);
  matchState.game.pendingAction = null;
  matchState.game.pendingRobberVictims = [];
  room.revision += 1;
  room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, room, player, "robberVictimChosen");
}

function validateOpenPlayerTradeCommand(socket, message) {
  const context = validatePlayCommand(socket, message);
  if (context.error) return context;
  if (!context.game.rolled) return { ...context, error: ["roll dice before trading", "ROLL_REQUIRED"] };
  if (context.room.pendingPlayerTrade) return { ...context, error: ["player trade already pending", "TRADE_ALREADY_PENDING"] };
  if (hasPendingAction(context.game) || context.game.pendingDiscards?.length || context.game.pendingRobberVictims?.length || context.game.pendingFreeRoads > 0) {
    return { ...context, error: ["pending action must be resolved first", "INVALID_ACTION"] };
  }
  const responders = context.room.players.filter((entry) => entry.id !== context.player.id && !entry.left && entry.connected);
  if (!responders.length) return { ...context, error: ["no responders available", "INVALID_ACTION"] };
  return { ...context, responders };
}

function validatePlayerTradeCommand(socket, message) {
  const roomId = String(message.roomId || message.payload?.roomId || socket.roomId || "").trim();
  const room = rooms.get(roomId);
  if (!room) return { error: ["room not found", "ROOM_NOT_FOUND"] };
  if (room.status === "ended") return { room, error: ["room has ended", "ROOM_ENDED"] };
  if (room.status !== "playing") return { room, error: ["room is not playing", "INVALID_ACTION"] };
  const player = findAuthenticatedPlayer(room, message, socket);
  if (!player) return { room, error: ["player authentication failed", "INVALID_TOKEN"] };
  if (player.left) return { room, player, error: ["player already left the room", "PLAYER_LEFT"] };
  if (!player.connected) return { room, player, error: ["player is disconnected", "PLAYER_DISCONNECTED"] };
  if (room.players.some((entry) => !entry.connected && !entry.left)) {
    return { room, player, error: ["waiting for disconnected players to reconnect", "ROOM_NOT_READY"] };
  }
  if (!room.matchState?.game) return { room, player, error: ["match state is missing", "INVALID_ACTION"] };
  const game = room.matchState.game;
  if (game.phase !== "play") return { room, player, game, error: ["game is not in play phase", "INVALID_ACTION"] };
  if (game.winner !== null && game.winner !== undefined) return { room, player, game, error: ["game is already finished", "INVALID_ACTION"] };
  const trade = room.pendingPlayerTrade;
  if (!trade) return { room, player, game, error: ["player trade not found", "TRADE_NOT_FOUND"] };
  if (message.payload?.tradeId && message.payload.tradeId !== trade.id) {
    return { room, player, game, trade, error: ["player trade not found", "TRADE_NOT_FOUND"] };
  }
  if (message.payload?.round !== undefined && Number(message.payload.round) !== trade.round) {
    return { room, player, game, trade, error: ["player trade round changed", "TRADE_ROUND_CHANGED"] };
  }
  return { room, player, game, matchState: room.matchState, trade };
}

function allTradeResponders(room, trade) {
  return room.players.filter((entry) => entry.id !== trade.requesterPlayerId && !entry.left);
}

function allTradeResponsesReceived(room, trade) {
  return allTradeResponders(room, trade).every((entry) => trade.responses[entry.id]);
}

function updateTradeStatus(room, trade) {
  trade.status = allTradeResponsesReceived(room, trade) ? "readyToChoose" : "collecting";
}

function clearPlayerTrade(room, result) {
  room.lastPlayerTradeResult = result;
  room.pendingPlayerTrade = null;
}

function sendTradeAccepted(socket, message, room, player, type) {
  room.revision += 1;
  room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, room, player, type);
}

function handleOpenPlayerTrade(socket, message) {
  const context = validateOpenPlayerTradeCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);
  const { room, player, matchState, responders } = context;
  const offer = normalizeTradeResources(message.payload?.offer);
  const request = normalizeTradeResources(message.payload?.request);
  const bundleError = validateTradeBundlePair(offer, request);
  if (bundleError) return sendError(socket, message.requestId, "invalid trade resources", bundleError);
  const requester = matchState.game.players[player.seatIndex];
  if (!hasResourceBundle(requester, offer)) return sendError(socket, message.requestId, "not enough resources for trade offer", "NOT_ENOUGH_RESOURCES");
  const now = Date.now();
  room.pendingPlayerTrade = {
    id: `trade_${crypto.randomBytes(4).toString("hex")}`,
    round: 1,
    status: "collecting",
    requesterPlayerId: player.id,
    requesterSeatIndex: player.seatIndex,
    responderPlayerIds: responders.map((entry) => entry.id),
    offer,
    request,
    responses: {},
    createdAt: now,
    updatedAt: now,
    createdRevision: room.revision
  };
  room.lastPlayerTradeResult = null;
  sendTradeAccepted(socket, message, room, player, "playerTradeOpened");
}

function handleRespondPlayerTrade(socket, message) {
  const context = validatePlayerTradeCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);
  const { room, player, trade } = context;
  if (player.id === trade.requesterPlayerId) return sendError(socket, message.requestId, "requester cannot respond", "TRADE_NOT_RESPONDER");
  const responseType = String(message.payload?.response || "");
  if (!["accept", "reject", "counter"].includes(responseType)) return sendError(socket, message.requestId, "invalid trade response", "INVALID_ACTION");
  const response = { playerId: player.id, seatIndex: player.seatIndex, type: responseType, createdAt: Date.now() };
  if (responseType === "counter") {
    const counterOffer = normalizeTradeResources(message.payload?.counterOffer);
    const counterRequest = normalizeTradeResources(message.payload?.counterRequest);
    const bundleError = validateTradeBundlePair(counterOffer, counterRequest);
    if (bundleError) return sendError(socket, message.requestId, "invalid counter resources", bundleError);
    response.counterOffer = counterOffer;
    response.counterRequest = counterRequest;
  }
  trade.responses[player.id] = response;
  trade.updatedAt = Date.now();
  updateTradeStatus(room, trade);
  sendTradeAccepted(socket, message, room, player, "playerTradeResponded");
}

function handleChoosePlayerTradeResponse(socket, message) {
  const context = validatePlayerTradeCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);
  const { room, player, matchState, trade } = context;
  if (player.id !== trade.requesterPlayerId) return sendError(socket, message.requestId, "only requester can choose", "TRADE_NOT_REQUESTER");
  if (!allTradeResponsesReceived(room, trade)) return sendError(socket, message.requestId, "waiting for all responses", "TRADE_RESPONSE_REQUIRED");
  const targetPlayerId = String(message.payload?.targetPlayerId || "");
  const response = trade.responses[targetPlayerId];
  if (!response || response.type !== "accept") return sendError(socket, message.requestId, "target did not accept", "TRADE_RESPONSE_NOT_ACCEPT");
  const targetPlayer = room.players.find((entry) => entry.id === targetPlayerId && !entry.left);
  if (!targetPlayer) return sendError(socket, message.requestId, "target player not found", "TRADE_NOT_FOUND");
  const requesterGamePlayer = matchState.game.players[player.seatIndex];
  const targetGamePlayer = matchState.game.players[targetPlayer.seatIndex];
  if (!hasResourceBundle(requesterGamePlayer, trade.offer) || !hasResourceBundle(targetGamePlayer, trade.request)) {
    clearPlayerTrade(room, {
      type: "invalidated",
      requesterPlayerId: trade.requesterPlayerId,
      targetPlayerId,
      offer: compactResources(trade.offer),
      request: compactResources(trade.request),
      createdAt: Date.now()
    });
    sendTradeAccepted(socket, message, room, player, "playerTradeInvalidated");
    return;
  }
  moveResourceBundle(requesterGamePlayer, targetGamePlayer, trade.offer);
  moveResourceBundle(targetGamePlayer, requesterGamePlayer, trade.request);
  clearPlayerTrade(room, {
    type: "completed",
    requesterPlayerId: trade.requesterPlayerId,
    targetPlayerId,
    offer: compactResources(trade.offer),
    request: compactResources(trade.request),
    createdAt: Date.now()
  });
  sendTradeAccepted(socket, message, room, player, "playerTradeChosen");
}

function handleUpdatePlayerTradeOffer(socket, message) {
  const context = validatePlayerTradeCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);
  const { room, player, matchState, trade } = context;
  if (player.id !== trade.requesterPlayerId) return sendError(socket, message.requestId, "only requester can update", "TRADE_NOT_REQUESTER");
  const offer = normalizeTradeResources(message.payload?.offer);
  const request = normalizeTradeResources(message.payload?.request);
  const bundleError = validateTradeBundlePair(offer, request);
  if (bundleError) return sendError(socket, message.requestId, "invalid trade resources", bundleError);
  const requester = matchState.game.players[player.seatIndex];
  if (!hasResourceBundle(requester, offer)) return sendError(socket, message.requestId, "not enough resources for trade offer", "NOT_ENOUGH_RESOURCES");
  trade.offer = offer;
  trade.request = request;
  trade.round += 1;
  trade.status = "collecting";
  trade.responses = {};
  trade.updatedAt = Date.now();
  sendTradeAccepted(socket, message, room, player, "playerTradeUpdated");
}

function handleCancelPlayerTrade(socket, message) {
  const context = validatePlayerTradeCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);
  const { room, player, trade } = context;
  if (player.id !== trade.requesterPlayerId) return sendError(socket, message.requestId, "only requester can cancel", "TRADE_NOT_REQUESTER");
  clearPlayerTrade(room, {
    type: "canceled",
    requesterPlayerId: trade.requesterPlayerId,
    createdAt: Date.now()
  });
  sendTradeAccepted(socket, message, room, player, "playerTradeCanceled");
}

function handleTestSetBankResource(socket, message) {
  if (process.env.NODE_ENV !== "test") {
    sendError(socket, message.requestId, "unsupported command", "INVALID_ACTION");
    return;
  }

  const context = validatePlayCommand(socket, message);
  if (context.error) {
    sendError(socket, message.requestId, context.error[0], context.error[1]);
    return;
  }

  const { room, player, matchState } = context;
  const resource = String(message.payload?.resource || "");
  const amount = Number(message.payload?.amount);
  if (!resourceTypes.includes(resource) || !Number.isInteger(amount) || amount < 0) {
    sendError(socket, message.requestId, "invalid bank resource fixture", "INVALID_RESOURCE");
    return;
  }

  matchState.game.bank[resource] = amount;
  room.revision += 1;
  room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, room, player, "testBankResourceSet");
}

function handleTestSetPlayerResource(socket, message) {
  if (process.env.NODE_ENV !== "test") {
    sendError(socket, message.requestId, "unsupported command", "INVALID_ACTION");
    return;
  }

  const context = validatePlayCommand(socket, message);
  if (context.error) {
    sendError(socket, message.requestId, context.error[0], context.error[1]);
    return;
  }

  const { room, player, matchState } = context;
  const resource = String(message.payload?.resource || "");
  const amount = Number(message.payload?.amount);
  if (!resourceTypes.includes(resource) || !Number.isInteger(amount) || amount < 0) {
    sendError(socket, message.requestId, "invalid player resource fixture", "INVALID_RESOURCE");
    return;
  }

  const targetSeatIndex = process.env.NODE_ENV === "test" && Number.isInteger(message.payload?.seatIndex)
    ? Number(message.payload.seatIndex)
    : player.seatIndex;
  const gamePlayer = matchState.game.players[targetSeatIndex];
  if (!gamePlayer) {
    sendError(socket, message.requestId, "invalid player resource fixture", "INVALID_ACTION");
    return;
  }
  gamePlayer.resources[resource] = amount;
  room.revision += 1;
  room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, room, player, "testPlayerResourceSet");
}

function handleTestSetDevDeck(socket, message) {
  if (process.env.NODE_ENV !== "test") {
    sendError(socket, message.requestId, "unsupported command", "INVALID_ACTION");
    return;
  }

  const context = validatePlayCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);
  const cardTypes = Array.isArray(message.payload?.cardTypes) ? message.payload.cardTypes : [];
  if (cardTypes.some((type) => !["knight", "victory", "roadBuilding", "yearPlenty", "monopoly"].includes(type))) {
    sendError(socket, message.requestId, "invalid development deck fixture", "INVALID_DEV_PAYLOAD");
    return;
  }
  context.matchState.devDeck = [...cardTypes].reverse();
  context.room.revision += 1;
  context.room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, context.room, context.player, "testDevDeckSet");
}

function handleTestSetPlayerDevCards(socket, message) {
  if (process.env.NODE_ENV !== "test") {
    sendError(socket, message.requestId, "unsupported command", "INVALID_ACTION");
    return;
  }

  const context = validatePlayCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);
  const cardTypes = Array.isArray(message.payload?.cardTypes) ? message.payload.cardTypes : [];
  if (cardTypes.some((type) => !["knight", "victory", "roadBuilding", "yearPlenty", "monopoly"].includes(type))) {
    sendError(socket, message.requestId, "invalid development card fixture", "INVALID_DEV_PAYLOAD");
    return;
  }
  const seatIndex = Number.isInteger(message.payload?.seatIndex) ? Number(message.payload.seatIndex) : context.player.seatIndex;
  const gamePlayer = context.matchState.game.players[seatIndex];
  if (!gamePlayer) return sendError(socket, message.requestId, "invalid player fixture", "INVALID_ACTION");
  const boughtRound = Number.isInteger(message.payload?.boughtRound) ? Number(message.payload.boughtRound) : context.game.round - 1;
  const boughtTurnSeat = Number.isInteger(message.payload?.boughtTurnSeat) ? Number(message.payload.boughtTurnSeat) : seatIndex;
  gamePlayer.dev = cardTypes.map((type) => {
    context.game.devCardSeq += 1;
    return { id: `dev-${context.game.devCardSeq}`, type, boughtRound, boughtTurnSeat };
  });
  updateWinnerForSeat(context.matchState, seatIndex);
  context.room.revision += 1;
  context.room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, context.room, context.player, "testPlayerDevCardsSet");
}

function handleTestSetBoardOwnership(socket, message) {
  if (process.env.NODE_ENV !== "test") {
    sendError(socket, message.requestId, "unsupported command", "INVALID_ACTION");
    return;
  }

  const context = validatePlayCommand(socket, message);
  if (context.error) return sendError(socket, message.requestId, context.error[0], context.error[1]);
  if (message.payload?.reset) {
    context.matchState.edges.forEach((edge) => { edge.owner = null; });
    context.matchState.vertices.forEach((vertex) => {
      vertex.owner = null;
      vertex.city = false;
    });
    context.game.longestRoad = null;
    context.game.winner = null;
  }
  const edgeOwners = Array.isArray(message.payload?.edgeOwners) ? message.payload.edgeOwners : [];
  const vertexOwners = Array.isArray(message.payload?.vertexOwners) ? message.payload.vertexOwners : [];
  for (const entry of edgeOwners) {
    const edgeId = Number(entry.edgeId);
    const owner = entry.owner === null ? null : Number(entry.owner);
    if (!Number.isInteger(edgeId) || !context.matchState.edges[edgeId]) return sendError(socket, message.requestId, "invalid edge fixture", "INVALID_ACTION");
    if (owner !== null && !context.game.players[owner]) return sendError(socket, message.requestId, "invalid edge owner fixture", "INVALID_ACTION");
    context.matchState.edges[edgeId].owner = owner;
  }
  for (const entry of vertexOwners) {
    const vertexId = Number(entry.vertexId);
    const owner = entry.owner === null ? null : Number(entry.owner);
    if (!Number.isInteger(vertexId) || !context.matchState.vertices[vertexId]) return sendError(socket, message.requestId, "invalid vertex fixture", "INVALID_ACTION");
    if (owner !== null && !context.game.players[owner]) return sendError(socket, message.requestId, "invalid vertex owner fixture", "INVALID_ACTION");
    context.matchState.vertices[vertexId].owner = owner;
    context.matchState.vertices[vertexId].city = Boolean(entry.city);
  }
  context.room.revision += 1;
  context.room.updatedAt = Date.now();
  sendPlacementAccepted(socket, message, context.room, context.player, "testBoardOwnershipSet");
}

function handleRollDice(socket, message) {
  const context = validatePlayCommand(socket, message);
  if (context.error) {
    sendError(socket, message.requestId, context.error[0], context.error[1]);
    return;
  }

  const { room, player, game, matchState } = context;
  if (room.pendingPlayerTrade || hasPendingAction(game) || game.pendingDiscards?.length || game.pendingRobberVictims?.length || game.pendingFreeRoads > 0) {
    sendError(socket, message.requestId, "pending action must be resolved first", "INVALID_ACTION");
    return;
  }
  if (game.rolled) {
    sendError(socket, message.requestId, "dice already rolled this turn", "ALREADY_ROLLED");
    return;
  }

  const forcedTotal = process.env.NODE_ENV === "test" ? Number(message.payload?.testTotal) : null;
  const dice = rollServerDice(forcedTotal);
  game.lastDice = dice;
  game.rolled = true;
  if (dice.total === 7) {
    game.lastProduction = [];
    beginSevenPending(matchState, player.seatIndex);
  } else {
    game.lastProduction = distributeResourcesForRoll(matchState, dice.total);
  }
  room.revision += 1;
  room.updatedAt = Date.now();

  sendPlacementAccepted(socket, message, room, player, "diceRolled");
}

function handleEndTurn(socket, message) {
  const context = validatePlayCommand(socket, message);
  if (context.error) {
    sendError(socket, message.requestId, context.error[0], context.error[1]);
    return;
  }

  const { room, player, game } = context;
  if (room.pendingPlayerTrade) {
    sendError(socket, message.requestId, "pending player trade must be resolved first", "INVALID_ACTION");
    return;
  }
  if (hasPendingAction(game) || game.pendingDiscards?.length || game.pendingRobberVictims?.length || game.pendingFreeRoads > 0) {
    sendError(socket, message.requestId, "pending action must be resolved first", "INVALID_ACTION");
    return;
  }
  if (!game.rolled) {
    sendError(socket, message.requestId, "roll dice before ending turn", "ROLL_REQUIRED");
    return;
  }

  game.active = (game.active + 1) % game.players.length;
  if (game.active === 0) game.round += 1;
  game.rolled = false;
  game.usedDevThisTurn = false;
  game.pendingSettlement = null;
  game.pendingFreeRoads = 0;
  game.freeRoadOwnerSeat = null;
  room.revision += 1;
  room.updatedAt = Date.now();

  sendPlacementAccepted(socket, message, room, player, "turnEnded");
}

function getCommandName(message) {
  return message.type === "command" ? message.payload?.name : null;
}

function handleMessage(socket, data) {
  let message;

  try {
    message = JSON.parse(data.toString());
  } catch (error) {
    sendError(socket, undefined, "message must be valid JSON", "invalid_json");
    return;
  }

  const commandName = getCommandName(message);

  if (!commandName) {
    sendError(socket, message.requestId, "message type must be command and payload.name is required", "BAD_MESSAGE");
    return;
  }

  if (commandName === "createRoom") {
    handleCreateRoom(socket, message);
    return;
  }

  if (commandName === "joinRoom") {
    handleJoinRoom(socket, message);
    return;
  }

  if (commandName === "leaveRoom") {
    handleLeaveRoom(socket, message);
    return;
  }

  if (commandName === "reconnect") {
    handleReconnect(socket, message);
    return;
  }

  if (commandName === "startGame") {
    handleStartGame(socket, message);
    return;
  }

  if (commandName === "placeInitialSettlement") {
    handlePlaceInitialSettlement(socket, message);
    return;
  }

  if (commandName === "placeInitialRoad") {
    handlePlaceInitialRoad(socket, message);
    return;
  }

  if (commandName === "rollDice") {
    handleRollDice(socket, message);
    return;
  }

  if (commandName === "endTurn") {
    handleEndTurn(socket, message);
    return;
  }

  if (commandName === "buildRoad") {
    handleBuildRoad(socket, message);
    return;
  }

  if (commandName === "buildSettlement") {
    handleBuildSettlement(socket, message);
    return;
  }

  if (commandName === "buildCity") {
    handleBuildCity(socket, message);
    return;
  }

  if (commandName === "bankTrade") {
    handleBankTrade(socket, message);
    return;
  }

  if (commandName === "buyDevCard") {
    handleBuyDevCard(socket, message);
    return;
  }

  if (commandName === "playDevCard") {
    handlePlayDevCard(socket, message);
    return;
  }

  if (commandName === "placeFreeRoad") {
    handlePlaceFreeRoad(socket, message);
    return;
  }

  if (commandName === "discardForSeven") {
    handleDiscardForSeven(socket, message);
    return;
  }

  if (commandName === "moveRobber") {
    handleMoveRobber(socket, message);
    return;
  }

  if (commandName === "chooseRobberVictim") {
    handleChooseRobberVictim(socket, message);
    return;
  }

  if (commandName === "openPlayerTrade") {
    handleOpenPlayerTrade(socket, message);
    return;
  }

  if (commandName === "respondPlayerTrade") {
    handleRespondPlayerTrade(socket, message);
    return;
  }

  if (commandName === "choosePlayerTradeResponse") {
    handleChoosePlayerTradeResponse(socket, message);
    return;
  }

  if (commandName === "updatePlayerTradeOffer") {
    handleUpdatePlayerTradeOffer(socket, message);
    return;
  }

  if (commandName === "cancelPlayerTrade") {
    handleCancelPlayerTrade(socket, message);
    return;
  }

  if (commandName === "testSetBankResource") {
    handleTestSetBankResource(socket, message);
    return;
  }

  if (commandName === "testSetPlayerResource") {
    handleTestSetPlayerResource(socket, message);
    return;
  }

  if (commandName === "testSetDevDeck") {
    handleTestSetDevDeck(socket, message);
    return;
  }

  if (commandName === "testSetPlayerDevCards") {
    handleTestSetPlayerDevCards(socket, message);
    return;
  }

  if (commandName === "testSetBoardOwnership") {
    handleTestSetBoardOwnership(socket, message);
    return;
  }

  const roomId = String(message.roomId || message.payload?.roomId || socket.roomId || "").trim();
  const room = rooms.get(roomId);
  if (room?.status === "ended") {
    sendError(socket, message.requestId, "room has ended", "ROOM_ENDED");
    return;
  }

  sendError(socket, message.requestId, `unsupported command: ${commandName}`, "INVALID_ACTION");
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${localHost}:${port}`).pathname);
  const requestPath = urlPath === "/" ? "/index.html" : urlPath;
  const safePath = path.normalize(requestPath).replace(/^([/\\])+/, "").replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

server.on("upgrade", (req) => {
  if (debugOnline) {
    console.log(`[upgrade] ${req.socket.remoteAddress} ${req.url}`);
  }
});

wss.on("connection", (socket) => {
  if (debugOnline) {
    console.log(`[ws:open] ${socket._socket?.remoteAddress || "unknown"}`);
  }
  socket.on("message", (data) => handleMessage(socket, data));
  socket.on("close", () => {
    if (debugOnline) {
      console.log(`[ws:close] ${socket._socket?.remoteAddress || "unknown"}`);
    }
    const room = rooms.get(socket.roomId);
    const player = room?.players.find((entry) => entry.id === socket.playerId);

    if (!room || !player) {
      return;
    }

    if (room.sockets.get(player.id) === socket) {
      room.sockets.delete(player.id);
      player.connected = false;
      player.disconnectedAt = Date.now();
      player.lastSeenAt = Date.now();
      room.revision += 1;
      room.updatedAt = Date.now();
      broadcastState(room);
    }
  });
});

server.listen(port, host, () => {
  const networkUrls = getNetworkHosts().map((address) => `http://${address}:${port}/`);

  console.log("Original Catan server running");
  console.log(`Local:   http://${localHost}:${port}/`);

  if (networkUrls.length === 0) {
    console.log("Network: no LAN IPv4 address detected");
  } else {
    for (const url of networkUrls) {
      console.log(`Network: ${url}`);
    }
  }
});
