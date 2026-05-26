const svg = document.querySelector("#board");
const setupScreen = document.querySelector("#setupScreen");
const playerCount = document.querySelector("#playerCount");
const nameFields = document.querySelector("#nameFields");
const startGameButton = document.querySelector("#startGameButton");
const rollButton = document.querySelector("#rollButton");
const endTurnButton = document.querySelector("#endTurnButton");
const newGameButton = document.querySelector("#newGameButton");
const dicePanel = document.querySelector("#dicePanel");
const dieOne = document.querySelector("#dieOne");
const dieTwo = document.querySelector("#dieTwo");
const diceTotal = document.querySelector("#diceTotal");
const currentPlayerLabel = document.querySelector("#currentPlayerLabel");
const guideTitle = document.querySelector("#guideTitle");
const guideText = document.querySelector("#guideText");
const playersList = document.querySelector("#playersList");
const turnStagePanel = document.querySelector("#turnStagePanel");
const devCardPanel = document.querySelector("#devCardPanel");
const bankStockPanel = document.querySelector("#bankStockPanel");
const costReferenceCard = document.querySelector("#costReferenceCard");
const costReferenceHandle = document.querySelector("#costReferenceHandle");
const costReferencePanel = document.querySelector("#costReferencePanel");
const boardWrap = document.querySelector(".board-wrap");
const boardZoomButton = document.querySelector("#boardZoomButton");
const harborPanel = document.querySelector("#harborPanel");
const logEl = document.querySelector("#log");
const buildButtons = [...document.querySelectorAll("[data-action]")];
const tradeBox = document.querySelector("#tradeBox");
const tradeGive = document.querySelector("#tradeGive");
const tradeGet = document.querySelector("#tradeGet");
const tradeButton = document.querySelector("#tradeButton");
const tradeRatioLabel = document.querySelector("#tradeRatioLabel");
const modalOverlay = document.querySelector("#modalOverlay");
const modalTitle = document.querySelector("#modalTitle");
const modalText = document.querySelector("#modalText");
const modalContent = document.querySelector("#modalContent");
const modalActions = document.querySelector("#modalActions");
const modeSelectView = document.querySelector("#modeSelectView");
const offlineSetupView = document.querySelector("#offlineSetupView");
const onlineCreateView = document.querySelector("#onlineCreateView");
const onlineJoinView = document.querySelector("#onlineJoinView");
const onlineLobbyView = document.querySelector("#onlineLobbyView");
const offlineModeButton = document.querySelector("#offlineModeButton");
const onlineCreateModeButton = document.querySelector("#onlineCreateModeButton");
const onlineJoinModeButton = document.querySelector("#onlineJoinModeButton");
const backToModeFromOffline = document.querySelector("#backToModeFromOffline");
const backToModeFromCreate = document.querySelector("#backToModeFromCreate");
const backToModeFromJoin = document.querySelector("#backToModeFromJoin");
const createNickname = document.querySelector("#createNickname");
const joinNickname = document.querySelector("#joinNickname");
const joinRoomCode = document.querySelector("#joinRoomCode");
const createRoomButton = document.querySelector("#createRoomButton");
const joinRoomButton = document.querySelector("#joinRoomButton");
const createStatus = document.querySelector("#createStatus");
const joinStatus = document.querySelector("#joinStatus");
const copyStatus = document.querySelector("#copyStatus");
const lobbyConnectionBadge = document.querySelector("#lobbyConnectionBadge");
const lobbyRoomCode = document.querySelector("#lobbyRoomCode");
const lobbyMeLabel = document.querySelector("#lobbyMeLabel");
const shareUrlSelect = document.querySelector("#shareUrlSelect");
const copyShareUrlButton = document.querySelector("#copyShareUrlButton");
const lobbyPlayersList = document.querySelector("#lobbyPlayersList");
const lobbyPlayerCount = document.querySelector("#lobbyPlayerCount");
const lobbyStartButton = document.querySelector("#lobbyStartButton");
const leaveLobbyButton = document.querySelector("#leaveLobbyButton");
const leaveGameRoomButton = ensureButton("leaveGameRoomButton", "방 나가기", newGameButton?.parentElement, "wide-button muted hidden");

const NS = "http://www.w3.org/2000/svg";
const SIZE = 72;
const CENTER = { x: 380, y: 320 };
const COLORS = ["#3fa7d6", "#e45757", "#f4f0e6", "#ee8c42"];
const RESOURCES = {
  forest: { name: "목재", icon: "🌲" },
  field: { name: "곡물", icon: "🌾" },
  pasture: { name: "양모", icon: "🐑" },
  hill: { name: "벽돌", icon: "🧱" },
  mountain: { name: "광석", icon: "⛏" }
};
const STARTING_BANK_RESOURCES = Object.fromEntries(Object.keys(RESOURCES).map((type) => [type, 19]));
const NUMBER_TOKENS = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];
const COSTS = {
  road: { forest: 1, hill: 1 },
  settlement: { forest: 1, hill: 1, pasture: 1, field: 1 },
  city: { field: 2, mountain: 3 },
  dev: { pasture: 1, field: 1, mountain: 1 }
};
const HARBOR_EDGE_SLOTS = [
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

let tiles = [];
let vertices = [];
let edges = [];
let harbors = [];
let robberTile = 0;
let robberDrag = null;
let selectedAction = "road";
let devDeck = [];
const game = {
  players: [],
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
  pendingActionView: null,
  pendingFreeRoads: 0,
  lastRobberResult: null,
  devCardSeq: 0,
  usedDevThisTurn: false,
  lastDice: null,
  bank: { ...STARTING_BANK_RESOURCES },
  winner: null,
  winnerSummary: null,
  viewerSeatIndex: null
};

const setupViews = [modeSelectView, offlineSetupView, onlineCreateView, onlineJoinView, onlineLobbyView].filter(Boolean);
const onlineSession = {
  socket: null,
  enabled: false,
  roomId: null,
  playerId: null,
  playerToken: null,
  isHost: false,
  connected: false,
  revision: 0,
  state: null,
  shareUrls: [],
  pendingRequests: new Map(),
  leavingRoom: false,
  modalKind: null,
  lastPlayerTradeResultAt: 0,
  lastRobberResultId: null
};
const ONLINE_IDENTITY_KEY = "catanOnlineIdentity";
const REQUEST_TIMEOUT_MS = 8000;
const MOBILE_VIEWPORT_QUERY = "(max-width: 780px)";

function ensureButton(id, text, parent, className = "") {
  let button = document.querySelector(`#${id}`);
  if (!button && parent) {
    button = document.createElement("button");
    button.id = id;
    button.type = "button";
    button.textContent = text;
    button.className = className;
    parent.append(button);
  }
  return button;
}

function createSvg(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function svgPointFromClient(clientX, clientY) {
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  return point.matrixTransform(matrix.inverse());
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const current = polygon[i];
    const previous = polygon[j];
    const crossesY = current.y > point.y !== previous.y > point.y;
    if (!crossesY) continue;
    const xAtY = ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x;
    if (point.x < xAtY) inside = !inside;
  }
  return inside;
}

function tileAtPoint(point) {
  if (!point) return null;
  return tiles.find((tile) => pointInPolygon(point, tile.corners)) || null;
}

function shuffle(items) {
  return items.map((value) => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map((item) => item.value);
}

function currentPlayer() {
  return game.players[game.active];
}

function freshPlayer(name, index) {
  const color = COLORS[index];
  return {
    id: index,
    name,
    color,
    resources: { forest: 0, field: 0, pasture: 0, hill: 0, mountain: 0 },
    dev: [],
    knights: 0,
    roads: 15,
    settlements: 5,
    cities: 4
  };
}

function resourceCount(player) {
  if (!player?.resources) return Number(player?.resourceCount || 0);
  return Object.values(player.resources).reduce((sum, amount) => sum + amount, 0);
}

function resourceDisplayName(type) {
  const resource = RESOURCES[type];
  return resource ? `${resource.icon} ${resource.name}` : type;
}

function resourceAmountText(type, amount) {
  return `${resourceDisplayName(type)} ${Number(amount) || 0}`;
}

function publicPoints(player) {
  let points = vertices.filter((v) => v.owner === player.id).reduce((sum, v) => sum + (v.city ? 2 : 1), 0);
  if (game.largestArmy === player.id) points += 2;
  if (game.longestRoad === player.id) points += 2;
  return points;
}

function hiddenVictoryPoints(player) {
  if (!Array.isArray(player.dev)) return Number(player.hiddenVictoryPoints || 0);
  return player.dev.filter((card) => card.type === "victory").length;
}

function totalPoints(player) {
  return publicPoints(player) + hiddenVictoryPoints(player);
}

function visiblePoints(player) {
  return publicPoints(player);
}

function winnerVictoryDevText() {
  if (game.winner === null || game.winner === undefined) return "";
  const count = Number(game.winnerSummary?.victoryDevCount ?? game.players[game.winner]?.victoryDevCount ?? 0);
  return count > 0 ? ` 숨은 승점 카드 ${count}장 포함.` : "";
}

function pointBadgeHtml(player, revealHidden = false) {
  const hidden = hiddenVictoryPoints(player);
  const points = revealHidden ? totalPoints(player) : publicPoints(player);
  return `${points}점${revealHidden && hidden > 0 ? `<small>숨은 ${hidden}</small>` : ""}`;
}

function isResolvingForcedAction() {
  return ["discard", "robber", "robberVictim"].includes(selectedAction);
}

function isBusyWithCardAction() {
  return selectedAction === "roadBuilding";
}

function canTakePostRollAction() {
  return game.phase === "play" && game.rolled && !isResolvingForcedAction() && !isBusyWithCardAction() && game.winner === null;
}

function isOnlinePlaying() {
  return onlineSession.enabled && onlineSession.state?.status === "playing";
}

function isOnlineEnded() {
  return onlineSession.enabled && onlineSession.state?.status === "ended";
}

function isOnlineControlledGame() {
  return onlineSession.enabled && ["playing", "ended"].includes(onlineSession.state?.status);
}

function blockOnlineGameAction() {
  if (!isOnlineControlledGame()) return false;
  addLog("온라인 게임 명령은 다음 단계에서 구현합니다.");
  return true;
}

function makeDevCard(type) {
  game.devCardSeq += 1;
  return {
    id: `dev-${game.devCardSeq}`,
    type,
    boughtTurn: game.round
  };
}

function devCardName(type) {
  return {
    knight: "기사",
    victory: "승점",
    roadBuilding: "도로 건설",
    yearPlenty: "풍년",
    monopoly: "독점"
  }[type] || type;
}

function showSetupView(view) {
  setupScreen.classList.remove("hidden");
  setupViews.forEach((item) => item.classList.toggle("hidden", item !== view));
}

function showModeSelect() {
  showSetupView(modeSelectView);
  setOnlineStatus(createStatus, "");
  setOnlineStatus(joinStatus, "");
  setOnlineStatus(copyStatus, "");
}

function showOfflineSetup() {
  onlineSession.enabled = false;
  showSetupView(offlineSetupView);
}

function getRoomParam() {
  return new URLSearchParams(window.location.search).get("room")?.trim() || "";
}

function setRoomParam(roomId) {
  if (!roomId || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  window.history.replaceState(null, "", url);
}

function clearRoomParam() {
  if (!window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.delete("room");
  window.history.replaceState(null, "", url);
}

function setOnlineStatus(element, message, tone = "") {
  if (!element) return;
  element.textContent = message;
  element.dataset.tone = tone;
}

function onlineErrorMessage(error) {
  const code = String(error?.code || "").toUpperCase();
  const fallback = error?.message || "요청을 처리할 수 없습니다.";
  return {
    BAD_MESSAGE: "요청 형식이 올바르지 않습니다.",
    ROOM_NOT_FOUND: "방을 찾을 수 없습니다. 공유받은 URL이나 방 코드를 확인하세요.",
    ROOM_FULL: "방이 가득 찼습니다.",
    ROOM_NOT_JOINABLE: "이미 시작되었거나 참가할 수 없는 방입니다.",
    ROOM_ENDED: "이미 종료된 방입니다.",
    PLAYER_LEFT: "이미 나간 방입니다. 새 방을 만들어 다시 시작하세요.",
    PLAYER_DISCONNECTED: "연결이 복구된 뒤 다시 시도하세요.",
    NOT_YOUR_TURN: "지금은 내 차례가 아닙니다.",
    ROOM_NOT_READY: "재접속 대기 중인 참가자가 있어 진행할 수 없습니다.",
    INVALID_PLACEMENT: "그 위치에는 배치할 수 없습니다.",
    VERTEX_OCCUPIED: "이미 마을이 있는 위치입니다.",
    EDGE_OCCUPIED: "이미 도로가 있는 위치입니다.",
    DISTANCE_RULE: "거리 규칙 때문에 그 위치에는 마을을 놓을 수 없습니다.",
    ROAD_NOT_CONNECTED: "방금 놓은 마을과 연결된 도로만 놓을 수 있습니다.",
    NO_PIECES: "남은 말이 없습니다.",
    NOT_ENOUGH_RESOURCES: "자원이 부족합니다.",
    INVALID_RESOURCE: "교환 자원이 올바르지 않습니다.",
    SAME_RESOURCE: "서로 다른 자원을 고르세요.",
    BANK_RESOURCE_EMPTY: "은행에 받을 자원이 부족합니다.",
    ALREADY_ROLLED: "이미 주사위를 굴렸습니다.",
    ROLL_REQUIRED: "주사위를 굴린 뒤 턴을 넘길 수 있습니다.",
    INVALID_TOKEN: "접속 정보가 만료되었습니다. 다시 참가하세요.",
    TRADE_ALREADY_PENDING: "이미 진행 중인 교환 제안이 있습니다.",
    TRADE_NOT_FOUND: "진행 중인 교환을 찾을 수 없습니다.",
    TRADE_NOT_REQUESTER: "이 교환을 수정하거나 확정할 권한이 없습니다.",
    TRADE_NOT_RESPONDER: "이 교환에 응답할 권한이 없습니다.",
    TRADE_RESPONSE_REQUIRED: "아직 모든 참가자의 응답을 기다리는 중입니다.",
    TRADE_RESPONSE_NOT_ACCEPT: "수락한 참가자만 선택할 수 있습니다.",
    TRADE_ROUND_CHANGED: "교환 조건이 갱신되었습니다. 다시 응답하세요.",
    INVALID_TRADE_RESOURCES: "교환 자원 구성이 올바르지 않습니다.",
    TRADE_RESOURCES_CHANGED: "자원 상태가 바뀌어 교환할 수 없습니다.",
    INVALID_ACTION: "아직 사용할 수 없는 명령입니다.",
    SERVER_ERROR: "서버 오류가 발생했습니다."
  }[code] || fallback;
}

function normalizeOnlineName(value) {
  return String(value || "").trim().slice(0, 24);
}

function normalizeRoomCode(value) {
  return String(value || "").trim().toLowerCase();
}

function onlineSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/`;
}

function makeRequestId() {
  return `ui-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readOnlineIdentity(roomId) {
  try {
    const identity = JSON.parse(localStorage.getItem(ONLINE_IDENTITY_KEY) || "null");
    if (!identity || identity.roomId !== roomId) return null;
    return identity;
  } catch (error) {
    return null;
  }
}

function readLastOnlineIdentity() {
  try {
    const identity = JSON.parse(localStorage.getItem(ONLINE_IDENTITY_KEY) || "null");
    if (!identity?.roomId || !identity.playerId || !identity.playerToken) return null;
    return identity;
  } catch (error) {
    return null;
  }
}

function saveOnlineIdentity(playerName = "") {
  if (!onlineSession.roomId || !onlineSession.playerId || !onlineSession.playerToken) return;
  try {
    localStorage.setItem(ONLINE_IDENTITY_KEY, JSON.stringify({
      roomId: onlineSession.roomId,
      playerId: onlineSession.playerId,
      playerToken: onlineSession.playerToken,
      playerName,
      savedAt: Date.now()
    }));
  } catch (error) {
    // Some embedded or privacy-restricted browser contexts can block storage.
  }
}

function clearOnlineIdentity() {
  try {
    localStorage.removeItem(ONLINE_IDENTITY_KEY);
  } catch (error) {
    // Storage cleanup is best-effort.
  }
}

function currentOnlinePlayerName() {
  return onlineSession.state?.players?.find((player) => player.id === onlineSession.playerId)?.name || "";
}

function rejectPendingRequests(error) {
  for (const [, pending] of onlineSession.pendingRequests) {
    clearTimeout(pending.timeoutId);
    pending.reject(error);
  }
  onlineSession.pendingRequests.clear();
}

function closeOnlineSocket() {
  if (onlineSession.socket) {
    onlineSession.socket.onclose = null;
    onlineSession.socket.close();
  }
  onlineSession.socket = null;
  onlineSession.connected = false;
}

function resetOnlineSession() {
  closeOnlineSocket();
  onlineSession.enabled = false;
  onlineSession.roomId = null;
  onlineSession.playerId = null;
  onlineSession.playerToken = null;
  onlineSession.isHost = false;
  onlineSession.revision = 0;
  onlineSession.state = null;
  onlineSession.shareUrls = [];
  onlineSession.leavingRoom = false;
  onlineSession.modalKind = null;
  onlineSession.lastPlayerTradeResultAt = 0;
  onlineSession.lastRobberResultId = null;
  rejectPendingRequests(new Error("온라인 세션이 정리되었습니다."));
}

function connectOnlineSocket() {
  if (onlineSession.socket?.readyState === WebSocket.OPEN) {
    return Promise.resolve(onlineSession.socket);
  }

  closeOnlineSocket();

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(onlineSocketUrl());
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.close();
      reject(new Error("서버에 연결할 수 없습니다. 서버가 켜져 있는지 확인하세요."));
    }, 3500);

    socket.addEventListener("open", () => {
      settled = true;
      clearTimeout(timeoutId);
      onlineSession.socket = socket;
      onlineSession.connected = true;
      renderLobby();
      resolve(socket);
    });

    socket.addEventListener("message", (event) => handleOnlineMessage(event.data));

    socket.addEventListener("close", () => {
      onlineSession.connected = false;
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(new Error("서버에 연결할 수 없습니다. 서버가 켜져 있는지 확인하세요."));
      }
      renderLobby();
      rejectPendingRequests(new Error("서버 연결이 끊겼습니다."));
    });

    socket.addEventListener("error", () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(new Error("서버에 연결할 수 없습니다. 서버가 켜져 있는지 확인하세요."));
      }
    });
  });
}

function sendOnlineCommand(name, payload = {}) {
  const socket = onlineSession.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error("서버에 연결되어 있지 않습니다."));
  }

  const requestId = makeRequestId();
  const message = {
    type: "command",
    requestId,
    roomId: onlineSession.roomId,
    playerId: onlineSession.playerId,
    playerToken: onlineSession.playerToken,
    payload: { name, ...payload }
  };

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (!onlineSession.pendingRequests.has(requestId)) return;
      onlineSession.pendingRequests.delete(requestId);
      reject(new Error("서버 응답이 지연되고 있습니다. 다시 시도하세요."));
    }, REQUEST_TIMEOUT_MS);
    onlineSession.pendingRequests.set(requestId, {
      resolve: (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
      timeoutId
    });
    socket.send(JSON.stringify(message));
  });
}

function handleOnlineMessage(rawMessage) {
  let message;

  try {
    message = JSON.parse(rawMessage);
  } catch (error) {
    return;
  }

  if (message.type === "roomCreated" || message.type === "roomJoined" || message.type === "reconnected") {
    const pending = onlineSession.pendingRequests.get(message.requestId);
    if (!pending) {
      return;
    }

    onlineSession.pendingRequests.delete(message.requestId);
    onlineSession.roomId = message.roomId;
    onlineSession.playerId = message.playerId;
    onlineSession.playerToken = message.playerToken;
    onlineSession.enabled = true;
    onlineSession.shareUrls = message.shareUrls || (message.shareUrl ? [message.shareUrl] : onlineSession.shareUrls);
    setRoomParam(message.roomId);
    applyOnlineState(message.state, message.revision);
    const playerName = message.state?.players?.find((player) => player.id === message.playerId)?.name || "";
    saveOnlineIdentity(playerName);
    pending.resolve(message);
    return;
  }

  if (message.type === "gameStarted") {
    const pending = onlineSession.pendingRequests.get(message.requestId);
    if (!pending) {
      return;
    }

    onlineSession.pendingRequests.delete(message.requestId);
    applyOnlineState(message.state, message.revision);
    pending.resolve(message);
    return;
  }

  if (["initialSettlementPlaced", "initialRoadPlaced", "diceRolled", "turnEnded", "roadBuilt", "settlementBuilt", "cityBuilt", "bankTraded", "devCardBought", "devCardPlayed", "freeRoadPlaced", "sevenDiscarded", "robberMoved", "robberVictimChosen", "playerTradeOpened", "playerTradeResponded", "playerTradeChosen", "playerTradeUpdated", "playerTradeCanceled", "playerTradeInvalidated"].includes(message.type)) {
    const pending = onlineSession.pendingRequests.get(message.requestId);
    if (pending) {
      onlineSession.pendingRequests.delete(message.requestId);
      applyOnlineState(message.state, message.revision);
      pending.resolve(message);
    }
    return;
  }

  if (message.type === "roomLeft") {
    const pending = onlineSession.pendingRequests.get(message.requestId);
    if (pending) {
      onlineSession.pendingRequests.delete(message.requestId);
      pending.resolve(message);
    }
    return;
  }

  if (message.type === "state") {
    applyOnlineState(message.state, message.revision);
    return;
  }

  if (message.type === "error") {
    const pending = onlineSession.pendingRequests.get(message.requestId);
    if (pending) {
      onlineSession.pendingRequests.delete(message.requestId);
      const error = new Error(message.message || message.error?.message || "요청을 처리할 수 없습니다.");
      error.code = message.code || message.error?.code;
      pending.reject(error);
    }
  }
}

function applyOnlineState(state, revision) {
  if (!state) return;
  const nextRevision = Number(revision ?? state.revision ?? 0);
  if (onlineSession.state && nextRevision <= onlineSession.revision) return;
  onlineSession.revision = nextRevision;
  onlineSession.state = state;
  onlineSession.isHost = state.hostPlayerId === onlineSession.playerId;
  if ((state.status === "playing" || state.status === "ended") && state.matchState) {
    hydrateMatchState(state.matchState);
    return;
  }
  renderLobby();
}

function resetGameStateFromMatch(matchState) {
  const nextGame = matchState?.game || {};
  game.players = nextGame.players || [];
  game.active = nextGame.active ?? 0;
  game.round = nextGame.round ?? 1;
  game.phase = nextGame.phase || "setup1";
  game.setupIndex = nextGame.setupIndex ?? 0;
  game.pendingSettlement = nextGame.pendingSettlement ?? null;
  game.rolled = Boolean(nextGame.rolled);
  game.largestArmy = nextGame.largestArmy ?? null;
  game.longestRoad = nextGame.longestRoad ?? null;
  game.pendingDiscards = nextGame.pendingDiscards || [];
  game.pendingRobberVictims = nextGame.pendingRobberVictims || [];
  game.pendingAction = nextGame.pendingAction || null;
  game.pendingActionView = nextGame.pendingActionView || null;
  game.pendingFreeRoads = nextGame.pendingFreeRoads ?? 0;
  game.freeRoadOwnerSeat = nextGame.freeRoadOwnerSeat ?? null;
  game.devCardSeq = nextGame.devCardSeq ?? 0;
  game.usedDevThisTurn = Boolean(nextGame.usedDevThisTurn);
  game.lastDice = nextGame.lastDice || null;
  game.lastProduction = nextGame.lastProduction || [];
  game.lastRobberResult = nextGame.lastRobberResult || null;
  game.bank = { ...STARTING_BANK_RESOURCES, ...(nextGame.bank || {}) };
  game.winner = nextGame.winner ?? null;
  game.winnerSummary = nextGame.winnerSummary || null;
  game.viewerSeatIndex = nextGame.viewerSeatIndex ?? null;
}

function hydrateMatchState(matchState) {
  if (!matchState?.game) return;
  resetGameStateFromMatch(matchState);
  tiles = matchState.tiles || [];
  vertices = matchState.vertices || [];
  edges = matchState.edges || [];
  harbors = matchState.harbors || [];
  robberTile = matchState.robberTile ?? 0;
  devDeck = matchState.devDeck || [];
  selectedAction = game.phase === "setup1" || game.phase === "setup2"
    ? (game.pendingSettlement === null ? "settlement" : "road")
    : (game.pendingActionView?.type === "moveRobber" && game.pendingActionView.role === "actor"
      ? "robber"
      : (game.pendingFreeRoads > 0 && game.freeRoadOwnerSeat === game.viewerSeatIndex ? "roadBuilding" : "road"));
  if (!onlineSession.state?.pendingPlayerTrade && onlineSession.modalKind !== "player-trade") hideModal();
  setupScreen.classList.add("hidden");
  logEl.replaceChildren();
  if (onlineSession.state?.status === "ended") {
    addLog(onlineEndReasonMessage(onlineSession.state?.endReason));
  } else {
    addLog("온라인 게임이 시작되었습니다. 초기 배치 명령은 다음 단계에서 구현합니다.");
  }
  render();
  syncOnlineRoomModals();
}

function onlineEndReasonMessage(reason) {
  if (reason === "host_left") return "방장이 방을 나가 게임방이 종료되었습니다.";
  if (reason === "player_left") return "참가자가 방을 나가 게임방이 종료되었습니다.";
  if (reason === "not_enough_players") return "참가자가 방을 나가 게임방이 종료되었습니다.";
  return "온라인 게임방이 종료되었습니다.";
}

function renderLobby() {
  if (!onlineLobbyView || !onlineSession.state) return;
  const state = onlineSession.state;
  const me = state.players.find((player) => player.id === onlineSession.playerId);

  lobbyRoomCode.textContent = state.roomId || onlineSession.roomId || "-";
  lobbyMeLabel.textContent = me ? `${me.name} (${onlineSession.isHost ? "방장" : "참가자"})` : "-";
  lobbyConnectionBadge.textContent = onlineSession.connected ? "연결됨" : "연결 끊김";
  lobbyConnectionBadge.dataset.connected = onlineSession.connected ? "true" : "false";
  lobbyPlayerCount.textContent = `${state.players.length}/${state.maxPlayers || 4}`;

  shareUrlSelect.replaceChildren();
  const urls = onlineSession.shareUrls.length ? onlineSession.shareUrls : [`${window.location.origin}/?room=${state.roomId}`];
  urls.forEach((url) => {
    const option = document.createElement("option");
    option.value = url;
    option.textContent = url;
    shareUrlSelect.append(option);
  });

  lobbyPlayersList.replaceChildren();
  state.players.forEach((player) => {
    const row = document.createElement("div");
    row.className = "lobby-player-row";
    row.style.setProperty("--player-color", player.color || "#f4c460");
    const badges = [
      player.id === state.hostPlayerId ? "방장" : "",
      player.id === onlineSession.playerId ? "나" : "",
      player.connected ? "연결됨" : "끊김"
    ].filter(Boolean);
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.setAttribute("aria-hidden", "true");
    const name = document.createElement("strong");
    name.textContent = player.name;
    const status = document.createElement("span");
    status.textContent = badges.join(" · ");
    row.append(dot, name, status);
    lobbyPlayersList.append(row);
  });

  const allConnected = state.players.every((player) => player.connected);
  const hasEnoughPlayers = state.players.length >= 3;
  const canStart = onlineSession.isHost && state.status === "lobby" && hasEnoughPlayers && allConnected;
  lobbyStartButton.disabled = !canStart;
  lobbyStartButton.textContent = canStart ? "게임 시작" : "게임 시작";
  if (!onlineSession.isHost) {
    lobbyStartButton.title = "방장만 게임을 시작할 수 있습니다.";
  } else if (!hasEnoughPlayers) {
    lobbyStartButton.title = "3명 이상 모이면 시작할 수 있습니다.";
  } else if (!allConnected) {
    lobbyStartButton.title = "모든 참가자가 연결되어 있어야 합니다.";
  } else {
    lobbyStartButton.title = "";
  }
  syncOnlineRoomModals();
}

async function startOnlineGame() {
  if (!onlineSession.isHost || !onlineSession.state) return;
  lobbyStartButton.disabled = true;
  setOnlineStatus(copyStatus, "게임을 시작하는 중입니다.", "pending");

  try {
    await sendOnlineCommand("startGame");
    setOnlineStatus(copyStatus, "");
  } catch (error) {
    setOnlineStatus(copyStatus, onlineErrorMessage(error), "error");
    renderLobby();
  }
}

async function createOnlineRoom() {
  const playerName = normalizeOnlineName(createNickname.value);
  if (!playerName) {
    setOnlineStatus(createStatus, "닉네임을 입력하세요.", "error");
    return;
  }

  createRoomButton.disabled = true;
  setOnlineStatus(createStatus, "서버에 연결하는 중입니다.", "pending");

  try {
    resetOnlineSession();
    await connectOnlineSocket();
    await sendOnlineCommand("createRoom", { playerName });
    showSetupView(onlineLobbyView);
    setOnlineStatus(createStatus, "");
  } catch (error) {
    setOnlineStatus(createStatus, onlineErrorMessage(error), "error");
  } finally {
    createRoomButton.disabled = false;
  }
}

async function joinOnlineRoom() {
  const playerName = normalizeOnlineName(joinNickname.value);
  const roomId = normalizeRoomCode(joinRoomCode.value);

  if (!roomId) {
    setOnlineStatus(joinStatus, "방 코드를 입력하세요.", "error");
    return;
  }

  if (!playerName) {
    setOnlineStatus(joinStatus, "닉네임을 입력하세요.", "error");
    return;
  }

  joinRoomButton.disabled = true;
  setOnlineStatus(joinStatus, "방에 참가하는 중입니다.", "pending");

  try {
    resetOnlineSession();
    onlineSession.roomId = roomId;
    await connectOnlineSocket();
    await sendOnlineCommand("joinRoom", { roomId, playerName });
    showSetupView(onlineLobbyView);
    setOnlineStatus(joinStatus, "");
  } catch (error) {
    const code = String(error.code || "").toUpperCase();
    if (code === "INVALID_TOKEN") {
      clearOnlineIdentity();
    }
    setOnlineStatus(joinStatus, onlineErrorMessage(error), "error");
  } finally {
    joinRoomButton.disabled = false;
  }
}

async function copyShareUrl() {
  const url = shareUrlSelect.value;
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
    setOnlineStatus(copyStatus, "복사했습니다.", "success");
  } catch (error) {
    setOnlineStatus(copyStatus, "복사에 실패했습니다. URL을 직접 선택해 복사하세요.", "error");
  }
}

function cleanupOnlineRoomAfterLeave() {
  resetOnlineSession();
  clearOnlineIdentity();
  clearRoomParam();
  hideModal();
  showModeSelect();
}

function confirmLeaveOnlineRoom() {
  if (!onlineSession.enabled) return;
  if (onlineSession.leavingRoom) return;
  onlineSession.modalKind = "leave-confirm";
  showModal(
    "방을 나가시겠습니까?",
    "나가면 현재 게임방이 종료되며 다시 참가할 수 없습니다. 친구들도 이 방에서 더 이상 게임을 진행할 수 없습니다."
  );
  addModalButton("취소", hideModal);
  addModalButton("나가기", leaveOnlineRoomAfterConfirm);
}

async function leaveOnlineRoomAfterConfirm() {
  const roomId = onlineSession.roomId || onlineSession.state?.roomId || "";
  const canSendLeave = onlineSession.socket?.readyState === WebSocket.OPEN && roomId && onlineSession.playerId && onlineSession.playerToken;
  onlineSession.leavingRoom = true;
  [...modalActions.querySelectorAll("button")].forEach((button) => {
    button.disabled = true;
  });

  if (canSendLeave) {
    try {
      await sendOnlineCommand("leaveRoom", { roomId });
    } catch (error) {
      // Leaving should still return the local UI even if the server is already gone.
    }
  }

  cleanupOnlineRoomAfterLeave();
}

function showOnlineRoomEndedModal() {
  if (!onlineSession.enabled || onlineSession.leavingRoom || onlineSession.modalKind === "room-ended") return;
  onlineSession.modalKind = "room-ended";
  showModal(
    "게임방이 종료되었습니다.",
    "참가자가 방을 나가 현재 게임방은 더 이상 진행할 수 없습니다. 이 방에는 다시 참가할 수 없습니다."
  );
  addModalButton("나가기", cleanupOnlineRoomAfterLeave);
}

function disconnectedOnlinePlayers() {
  const state = onlineSession.state;
  if (!onlineSession.enabled || !state || !["lobby", "playing"].includes(state.status)) return [];
  return state.players.filter((player) => player.id !== onlineSession.playerId && !player.connected && !player.left);
}

function showReconnectWaitingModal(players) {
  if (!players.length || onlineSession.leavingRoom || onlineSession.modalKind === "reconnect-waiting") return;
  if (onlineSession.modalKind) return;
  const names = players.map((player) => player.name).join(", ");
  onlineSession.modalKind = "reconnect-waiting";
  showModal(
    "연결이 끊긴 참가자가 있습니다.",
    `${names}의 재접속을 기다리는 중입니다. 방 나가기를 누르면 현재 게임방이 종료되며 다시 참가할 수 없습니다.`
  );
  addModalButton("방 나가기", confirmLeaveOnlineRoom);
}

function syncOnlineRoomModals() {
  if (!onlineSession.enabled || onlineSession.leavingRoom) return;
  if (onlineSession.state?.status === "ended") {
    showOnlineRoomEndedModal();
    return;
  }

  const disconnectedPlayers = disconnectedOnlinePlayers();
  if (disconnectedPlayers.length) {
    showReconnectWaitingModal(disconnectedPlayers);
    return;
  }

  if (onlineSession.modalKind === "reconnect-waiting") {
    hideModal();
  }

  if (game.lastRobberResult?.id && game.lastRobberResult.id !== onlineSession.lastRobberResultId && !game.pendingActionView) {
    showRobberResultModal(game.lastRobberResult);
    return;
  }

  if (game.pendingActionView) {
    showOnlinePendingActionModal(game.pendingActionView);
    return;
  }

  if (onlineSession.state?.pendingPlayerTrade) {
    showPendingPlayerTradeModal();
    return;
  }

  if (onlineSession.modalKind === "player-trade") {
    const result = onlineSession.state?.lastPlayerTradeResult;
    if (result && result.createdAt !== onlineSession.lastPlayerTradeResultAt) showPlayerTradeResultModal(result);
    else hideModal();
  }
}

function showOnlinePendingActionModal(view) {
  if (view.type === "discardForSeven") {
    if (view.role === "discarder") {
      if (onlineSession.modalKind !== "discard-seven") showOnlineDiscardForSevenModal(view);
      return;
    }
    if (onlineSession.modalKind !== "discard-waiting") {
      onlineSession.modalKind = "discard-waiting";
      showModal("카드 버리기 대기", `다른 플레이어가 자원을 버리는 중입니다. 남은 인원: ${view.remainingCount}`);
    }
    return;
  }

  if (view.type === "moveRobber") {
    if (view.role === "actor") {
      if (onlineSession.modalKind !== "move-robber") {
        onlineSession.modalKind = "move-robber";
        showModal("도둑 이동", "현재 도둑 위치가 아닌 타일을 선택하세요.");
        addModalButton("확인", hideModal);
      }
      return;
    }
    if (onlineSession.modalKind !== "move-robber-waiting") {
      onlineSession.modalKind = "move-robber-waiting";
      showModal("도둑 이동 대기", "현재 플레이어가 도둑을 이동하는 중입니다.");
    }
    return;
  }

  if (view.type === "chooseRobberVictim") {
    if (view.role === "actor") {
      if (onlineSession.modalKind !== "choose-robber-victim") showOnlineChooseRobberVictimModal(view);
      return;
    }
    if (onlineSession.modalKind !== "choose-robber-victim-waiting") {
      onlineSession.modalKind = "choose-robber-victim-waiting";
      showModal("약탈 대상 선택 대기", "현재 플레이어가 약탈 대상을 선택하는 중입니다.");
    }
  }
}

function showOnlineDiscardForSevenModal(view) {
  const player = game.players[game.viewerSeatIndex];
  const selected = Object.fromEntries(Object.keys(RESOURCES).map((type) => [type, 0]));
  onlineSession.modalKind = "discard-seven";
  showModal("카드 버리기", `자원 ${view.needed}장을 선택해 버리세요.`);
  const list = document.createElement("div");
  list.className = "resource-editor";
  const summary = document.createElement("p");
  summary.className = "trade-summary";
  const submit = addModalButton("버리기", async () => {
    submit.disabled = true;
    try {
      await sendOnlineCommand("discardForSeven", { resources: selected });
      hideModal();
    } catch (error) {
      addLog(onlineErrorMessage(error));
      submit.disabled = false;
    }
  });

  function refresh() {
    const total = resourceBundleTotal(selected);
    summary.textContent = `${total}/${view.needed}장 선택`;
    submit.disabled = total !== view.needed;
  }

  Object.keys(RESOURCES).forEach((type) => {
    const row = document.createElement("div");
    row.className = "resource-editor-row";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "-";
    const amount = document.createElement("strong");
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    const label = document.createElement("span");
    label.textContent = `${info.name} (보유 ${player?.resources?.[type] || 0})`;
    function paint() {
      amount.textContent = String(selected[type]);
      minus.disabled = selected[type] <= 0;
      plus.disabled = selected[type] >= (player?.resources?.[type] || 0) || resourceBundleTotal(selected) >= view.needed;
      refresh();
    }
    minus.addEventListener("click", () => {
      selected[type] = Math.max(0, selected[type] - 1);
      paint();
    });
    plus.addEventListener("click", () => {
      selected[type] += 1;
      paint();
    });
    row.append(label, minus, amount, plus);
    list.append(row);
    paint();
  });
  modalContent.append(list, summary);
  refresh();
}

function showOnlineChooseRobberVictimModal(view) {
  onlineSession.modalKind = "choose-robber-victim";
  showModal("약탈 대상 선택", "자원 1장을 무작위로 가져올 대상을 선택하세요.");
  const list = document.createElement("div");
  list.className = "trade-review";
  view.victims.forEach((victim) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${victim.name} (자원 ${victim.resourceCount}장)`;
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await sendOnlineCommand("chooseRobberVictim", { victimSeatIndex: victim.seatIndex });
        hideModal();
      } catch (error) {
        addLog(onlineErrorMessage(error));
        button.disabled = false;
      }
    });
    list.append(button);
  });
  modalContent.append(list);
}

function showRobberResultModal(result) {
  if (hasSeenRobberResult(result)) return;
  rememberRobberResult(result);
  onlineSession.modalKind = "robber-result";
  onlineSession.lastRobberResultId = result.id;
  const actor = game.players[result.actorSeatIndex]?.name || "플레이어";
  const victim = result.victimSeatIndex === null || result.victimSeatIndex === undefined ? null : game.players[result.victimSeatIndex]?.name;
  if (result.reason === "NO_VICTIM" || !victim) {
    showModal("도둑 결과", "도둑이 이동했지만 빼앗을 수 있는 자원이 없습니다.");
  } else {
    const resource = result.resource ? `${RESOURCES[result.resource]?.name || result.resource} 1장` : "자원 1장";
    showModal("도둑 결과", `${actor}가 ${victim}에게서 ${resource}을 가져왔습니다.`);
  }
  addModalButton("확인", hideModal);
}

function robberResultStorageKey(result) {
  const roomId = onlineSession.roomId || onlineSession.state?.roomId || "offline";
  const playerId = onlineSession.playerId || `seat-${game.viewerSeatIndex ?? game.active ?? 0}`;
  return `catanRobberResult:${roomId}:${playerId}:${result?.id || ""}`;
}

function hasSeenRobberResult(result) {
  if (!result?.id) return false;
  if (onlineSession.lastRobberResultId === result.id) return true;
  try {
    return sessionStorage.getItem(robberResultStorageKey(result)) === "1";
  } catch (error) {
    return false;
  }
}

function rememberRobberResult(result) {
  if (!result?.id) return;
  onlineSession.lastRobberResultId = result.id;
  try {
    sessionStorage.setItem(robberResultStorageKey(result), "1");
  } catch (error) {
    // Result-modal dedupe is best-effort when storage is blocked.
  }
}

function isInitialSetupPhase() {
  return game.phase === "setup1" || game.phase === "setup2";
}

function isOnlineInitialSetup() {
  return onlineSession.enabled && onlineSession.state?.status === "playing" && isInitialSetupPhase();
}

function isMyOnlineInitialSetupTurn() {
  return isOnlineInitialSetup() && game.viewerSeatIndex === game.setupIndex;
}

function canUseOnlinePlacementCommands() {
  return isMyOnlineInitialSetupTurn() && !isOnlineEnded() && disconnectedOnlinePlayers().length === 0;
}

function isOnlinePlayPhase() {
  return onlineSession.enabled && onlineSession.state?.status === "playing" && game.phase === "play";
}

function isMyOnlineTurn() {
  return isOnlinePlayPhase() && game.viewerSeatIndex === game.active;
}

function canUseOnlineTurnCommand() {
  return isMyOnlineTurn() && !isOnlineEnded() && disconnectedOnlinePlayers().length === 0 && game.winner === null;
}

function canRollOnlineDice() {
  return canUseOnlineTurnCommand()
    && !game.rolled
    && !onlineSession.state?.pendingPlayerTrade
    && !game.pendingActionView
    && !game.pendingDiscards?.length
    && !game.pendingRobberVictims?.length
    && game.pendingFreeRoads <= 0;
}

function canEndOnlineTurn() {
  return canUseOnlineTurnCommand()
    && game.rolled
    && !onlineSession.state?.pendingPlayerTrade
    && !game.pendingActionView
    && !game.pendingDiscards?.length
    && !game.pendingRobberVictims?.length
    && game.pendingFreeRoads <= 0;
}

function canUseOnlineBuildCommand() {
  return canUseOnlineTurnCommand()
    && game.rolled
    && !onlineSession.state?.pendingPlayerTrade
    && !game.pendingActionView
    && !game.pendingDiscards?.length
    && !game.pendingRobberVictims?.length
    && game.pendingFreeRoads <= 0
    && !isResolvingForcedAction()
    && !isBusyWithCardAction();
}

function canUseOnlineBankTradeCommand() {
  return canUseOnlineBuildCommand() && !onlineSession.state?.pendingPlayerTrade;
}

function canUseOnlinePlayerTradeCommand() {
  return canUseOnlineBuildCommand() && !onlineSession.state?.pendingPlayerTrade;
}

function hasPendingOnlineAction() {
  return Boolean(
    onlineSession.state?.pendingPlayerTrade
    || game.pendingActionView
    || game.pendingAction
    || game.pendingDiscards?.length
    || game.pendingRobberVictims?.length
    || game.pendingFreeRoads > 0
  );
}

function canBuyOnlineDevCard() {
  const player = currentPlayer();
  return canUseOnlineTurnCommand()
    && game.rolled
    && !hasPendingOnlineAction()
    && Number(onlineSession.state?.matchState?.devDeckCount || 0) > 0
    && hasResources(player, COSTS.dev);
}

function canUseOnlineDevCard() {
  const player = currentPlayer();
  return canUseOnlineTurnCommand()
    && !game.usedDevThisTurn
    && !hasPendingOnlineAction()
    && usableDevCards(player).length > 0;
}

function canPlaceOnlineFreeRoad(edgeId) {
  const edge = edges[edgeId];
  return isOnlinePlayPhase()
    && game.pendingFreeRoads > 0
    && game.freeRoadOwnerSeat === game.viewerSeatIndex
    && selectedAction === "roadBuilding"
    && edge
    && edge.owner === null
    && canBuildRoad(game.viewerSeatIndex, edgeId, false);
}

function canBuildOnlineRoad(edgeId) {
  return canUseOnlineBuildCommand() && selectedAction === "road" && canBuildRoad(game.active, edgeId, false);
}

function canBuildOnlineSettlement(vertexId) {
  return canUseOnlineBuildCommand() && selectedAction === "settlement" && canBuildSettlement(game.active, vertexId, false);
}

function canBuildOnlineCity(vertexId) {
  const vertex = vertices[vertexId];
  return canUseOnlineBuildCommand() && selectedAction === "city" && vertex?.owner === game.active && !vertex.city;
}

function onlineTurnBlockedMessage(action) {
  if (!isOnlinePlayPhase()) return "현재는 정식 턴 단계가 아닙니다.";
  if (onlineSession.state?.status === "ended") return "종료된 방에서는 진행할 수 없습니다.";
  if (disconnectedOnlinePlayers().length) return "재접속 대기 중에는 진행할 수 없습니다.";
  if (!isMyOnlineTurn()) return "지금은 내 차례가 아닙니다.";
  if (action === "roll" && game.rolled) return "이미 주사위를 굴렸습니다.";
  if (action === "endTurn" && !game.rolled) return "주사위를 굴린 뒤 턴을 넘길 수 있습니다.";
  if (game.pendingActionView) return "진행 중인 강도/버리기 처리를 먼저 완료해야 합니다.";
  return "지금은 진행할 수 없습니다.";
}

function onlineBuildBlockedMessage(kind) {
  if (!isOnlinePlayPhase()) return "현재는 건설 단계가 아닙니다.";
  if (onlineSession.state?.status === "ended") return "종료된 방에서는 건설할 수 없습니다.";
  if (disconnectedOnlinePlayers().length) return "재접속 대기 중에는 건설할 수 없습니다.";
  if (!isMyOnlineTurn()) return "지금은 내 차례가 아닙니다.";
  if (!game.rolled) return "주사위를 굴린 뒤 건설할 수 있습니다.";
  if (game.pendingActionView) return "진행 중인 강도/버리기 처리를 먼저 완료해야 합니다.";
  if (isResolvingForcedAction() || isBusyWithCardAction()) return "진행 중인 처리를 먼저 완료해야 합니다.";
  if (game.winner !== null) return "게임이 종료되었습니다.";
  if (kind === "road") return "도로를 지을 수 없는 위치입니다.";
  if (kind === "settlement") return "마을을 지을 수 없는 위치입니다.";
  if (kind === "city") return "내 마을만 도시로 올릴 수 있습니다.";
  return "지금은 건설할 수 없습니다.";
}

function onlineTradeBlockedMessage() {
  if (!isOnlinePlayPhase()) return "현재는 교환할 수 있는 단계가 아닙니다.";
  if (onlineSession.state?.status === "ended") return "종료된 방에서는 교환할 수 없습니다.";
  if (disconnectedOnlinePlayers().length) return "재접속 대기 중에는 교환할 수 없습니다.";
  if (!isMyOnlineTurn()) return "지금은 내 차례가 아닙니다.";
  if (!game.rolled) return "주사위를 굴린 뒤 교환할 수 있습니다.";
  if (game.pendingActionView) return "진행 중인 강도/버리기 처리를 먼저 완료해야 합니다.";
  if (isResolvingForcedAction() || isBusyWithCardAction()) return "진행 중인 처리를 먼저 완료해야 합니다.";
  if (game.winner !== null) return "게임이 종료되었습니다.";
  return "지금은 교환할 수 없습니다.";
}

async function rollOnlineDice() {
  if (!canRollOnlineDice()) {
    addLog(onlineTurnBlockedMessage("roll"));
    render();
    return;
  }

  try {
    await sendOnlineCommand("rollDice");
  } catch (error) {
    addLog(onlineErrorMessage(error));
    render();
  }
}

async function endOnlineTurn() {
  if (!canEndOnlineTurn()) {
    addLog(onlineTurnBlockedMessage("endTurn"));
    render();
    return;
  }

  try {
    await sendOnlineCommand("endTurn");
  } catch (error) {
    addLog(onlineErrorMessage(error));
    render();
  }
}

async function buildOnlineRoad(edgeId) {
  if (!canBuildOnlineRoad(edgeId)) {
    addLog(onlineBuildBlockedMessage("road"));
    render();
    return;
  }

  try {
    await sendOnlineCommand("buildRoad", { edgeId });
  } catch (error) {
    addLog(onlineErrorMessage(error));
    render();
  }
}

async function buildOnlineSettlement(vertexId) {
  if (!canBuildOnlineSettlement(vertexId)) {
    addLog(onlineBuildBlockedMessage("settlement"));
    render();
    return;
  }

  try {
    await sendOnlineCommand("buildSettlement", { vertexId });
  } catch (error) {
    addLog(onlineErrorMessage(error));
    render();
  }
}

async function buildOnlineCity(vertexId) {
  if (!canBuildOnlineCity(vertexId)) {
    addLog(onlineBuildBlockedMessage("city"));
    render();
    return;
  }

  try {
    await sendOnlineCommand("buildCity", { vertexId });
  } catch (error) {
    addLog(onlineErrorMessage(error));
    render();
  }
}

async function buyOnlineDevCard() {
  if (!canBuyOnlineDevCard()) {
    addLog(onlineTradeBlockedMessage());
    render();
    return;
  }

  try {
    await sendOnlineCommand("buyDevCard");
  } catch (error) {
    addLog(onlineErrorMessage(error));
    render();
  }
}

async function playOnlineDevCard(cardId, payload = {}) {
  try {
    await sendOnlineCommand("playDevCard", { cardId, ...payload });
  } catch (error) {
    addLog(onlineErrorMessage(error));
    render();
  }
}

async function placeOnlineFreeRoad(edgeId) {
  if (!canPlaceOnlineFreeRoad(edgeId)) {
    addLog(onlineBuildBlockedMessage("road"));
    render();
    return;
  }

  try {
    await sendOnlineCommand("placeFreeRoad", { edgeId });
  } catch (error) {
    addLog(onlineErrorMessage(error));
    render();
  }
}

function onlineSetupPlayerName() {
  return game.players[game.setupIndex]?.name || "플레이어";
}

function canPlaceOnlineInitialSettlement(vertexId) {
  return canUseOnlinePlacementCommands()
    && game.pendingSettlement === null
    && selectedAction === "settlement"
    && canBuildSettlement(game.setupIndex, vertexId, true);
}

function canPlaceOnlineInitialRoad(edgeId) {
  return canUseOnlinePlacementCommands()
    && game.pendingSettlement !== null
    && selectedAction === "road"
    && canBuildRoad(game.setupIndex, edgeId, true);
}

function onlinePlacementBlockedMessage(kind) {
  if (!isOnlineInitialSetup()) return "현재 초기 배치 단계가 아닙니다.";
  if (onlineSession.state?.status === "ended") return "종료된 방에서는 배치할 수 없습니다.";
  if (disconnectedOnlinePlayers().length) return "재접속 대기 중에는 배치할 수 없습니다.";
  if (!isMyOnlineInitialSetupTurn()) return "지금은 내 초기 배치 차례가 아닙니다.";
  if (kind === "road" && game.pendingSettlement === null) return "마을을 먼저 놓아야 도로를 놓을 수 있습니다.";
  if (kind === "settlement" && game.pendingSettlement !== null) return "방금 놓은 마을과 연결된 도로를 먼저 놓아야 합니다.";
  return "그 위치에는 배치할 수 없습니다.";
}

async function placeOnlineInitialSettlement(vertexId) {
  if (!canPlaceOnlineInitialSettlement(vertexId)) {
    addLog(onlinePlacementBlockedMessage("settlement"));
    render();
    return;
  }

  try {
    await sendOnlineCommand("placeInitialSettlement", { vertexId });
  } catch (error) {
    addLog(onlineErrorMessage(error));
    render();
  }
}

async function placeOnlineInitialRoad(edgeId) {
  if (!canPlaceOnlineInitialRoad(edgeId)) {
    addLog(onlinePlacementBlockedMessage("road"));
    render();
    return;
  }

  try {
    await sendOnlineCommand("placeInitialRoad", { edgeId });
  } catch (error) {
    addLog(onlineErrorMessage(error));
    render();
  }
}

async function reconnectOnlineRoom(identity) {
  if (!identity?.roomId || !identity.playerId || !identity.playerToken) return false;

  setOnlineStatus(joinStatus, "이전 접속 정보로 다시 연결하는 중입니다.", "pending");
  showSetupView(onlineJoinView);

  try {
    resetOnlineSession();
    onlineSession.roomId = identity.roomId;
    onlineSession.playerId = identity.playerId;
    onlineSession.playerToken = identity.playerToken;
    setRoomParam(identity.roomId);
    await connectOnlineSocket();
    await sendOnlineCommand("reconnect", { roomId: identity.roomId });
    if (onlineSession.state?.status !== "playing") {
      showSetupView(onlineLobbyView);
    }
    setOnlineStatus(joinStatus, "");
    return true;
  } catch (error) {
    const code = String(error.code || "").toUpperCase();
    if (code === "INVALID_TOKEN" || code === "ROOM_NOT_FOUND" || code === "ROOM_ENDED") {
      clearOnlineIdentity();
      if (code === "ROOM_ENDED") clearRoomParam();
    }
    setOnlineStatus(joinStatus, onlineErrorMessage(error), "error");
    return false;
  }
}

async function showJoinFromUrlIfNeeded() {
  const roomId = getRoomParam();
  if (!roomId) {
    showModeSelect();
    return;
  }
  joinRoomCode.value = roomId;
  const identity = readOnlineIdentity(roomId);
  if (identity) {
    joinNickname.value = identity.playerName || "";
    const reconnected = await reconnectOnlineRoom(identity);
    if (reconnected) return;
  }
  showSetupView(onlineJoinView);
}

function usableDevCards(player) {
  if (!Array.isArray(player.dev)) return [];
  return player.dev.filter((card) => {
    if (card.type === "victory") return false;
    if (card.boughtRound !== undefined || card.boughtTurnSeat !== undefined) {
      return !(card.boughtRound === game.round && card.boughtTurnSeat === game.active);
    }
    return card.boughtTurn !== game.round;
  });
}

function canUseDevCard() {
  return game.phase === "play" && game.winner === null && !isResolvingForcedAction() && !isBusyWithCardAction() && !game.usedDevThisTurn;
}

function removeDevCard(player, cardId) {
  const index = player.dev.findIndex((card) => card.id === cardId);
  if (index < 0) return null;
  return player.dev.splice(index, 1)[0];
}

function addLog(text) {
  const item = document.createElement("li");
  item.textContent = text;
  logEl.prepend(item);
  while (logEl.children.length > 14) logEl.lastElementChild.remove();
}

function hideModal() {
  modalOverlay.classList.add("hidden");
  modalTitle.textContent = "";
  modalText.textContent = "";
  modalContent.replaceChildren();
  modalActions.replaceChildren();
  onlineSession.modalKind = null;
  renderBoardZoomButton();
}

function isModalOpen() {
  return Boolean(modalOverlay && !modalOverlay.classList.contains("hidden"));
}

function showModal(title, text) {
  modalTitle.textContent = title;
  modalText.textContent = text;
  modalContent.replaceChildren();
  modalActions.replaceChildren();
  modalOverlay.classList.remove("hidden");
  renderBoardZoomButton();
}

function addModalButton(text, onClick, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  if (className) button.className = className;
  button.addEventListener("click", onClick);
  modalActions.append(button);
  return button;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isMobileViewport() {
  return window.matchMedia?.(MOBILE_VIEWPORT_QUERY).matches || window.innerWidth <= 780;
}

function clearFloatingPanelTransforms() {
  [costReferenceCard, dicePanel].forEach((panel) => {
    if (!panel) return;
    panel.classList.remove("dragging");
    panel.style.transform = "";
    delete panel.dataset.x;
    delete panel.dataset.y;
  });
}

function syncFloatingPanelsForViewport() {
  if (isMobileViewport()) clearFloatingPanelTransforms();
  else {
    restoreCostCardPosition();
    restoreDicePanelPosition();
  }
}

function applyCostCardPosition(x, y) {
  if (!costReferenceCard) return;
  costReferenceCard.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  costReferenceCard.dataset.x = String(Math.round(x));
  costReferenceCard.dataset.y = String(Math.round(y));
}

function restoreCostCardPosition() {
  if (!costReferenceCard) return;
  if (isMobileViewport()) {
    clearFloatingPanelTransforms();
    return;
  }
  const saved = localStorage.getItem("katanCostCardPosition");
  if (!saved) return;
  try {
    const { x, y } = JSON.parse(saved);
    applyCostCardPosition(Number(x) || 0, Number(y) || 0);
  } catch {
    localStorage.removeItem("katanCostCardPosition");
  }
}

function initCostCardDrag() {
  if (!costReferenceCard || !costReferenceHandle) return;
  if (!isMobileViewport()) restoreCostCardPosition();

  let drag = null;
  const startDrag = (event) => {
    if (isMobileViewport()) {
      clearFloatingPanelTransforms();
      return;
    }
    if (event.button !== undefined && event.button !== 0) return;
    const table = costReferenceCard.closest(".tabletop");
    if (!table) return;
    const tableRect = table.getBoundingClientRect();
    const cardRect = costReferenceCard.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: Number(costReferenceCard.dataset.x) || 0,
      originY: Number(costReferenceCard.dataset.y) || 0,
      minX: tableRect.left - cardRect.left + (Number(costReferenceCard.dataset.x) || 0),
      minY: tableRect.top - cardRect.top + (Number(costReferenceCard.dataset.y) || 0),
      maxX: tableRect.right - cardRect.right + (Number(costReferenceCard.dataset.x) || 0),
      maxY: tableRect.bottom - cardRect.bottom + (Number(costReferenceCard.dataset.y) || 0)
    };
    costReferenceCard.classList.add("dragging");
    costReferenceHandle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const moveDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const nextX = clamp(drag.originX + event.clientX - drag.startX, drag.minX, drag.maxX);
    const nextY = clamp(drag.originY + event.clientY - drag.startY, drag.minY, drag.maxY);
    applyCostCardPosition(nextX, nextY);
  };

  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    localStorage.setItem("katanCostCardPosition", JSON.stringify({
      x: Number(costReferenceCard.dataset.x) || 0,
      y: Number(costReferenceCard.dataset.y) || 0
    }));
    costReferenceCard.classList.remove("dragging");
    drag = null;
  };

  costReferenceHandle.addEventListener("pointerdown", startDrag);
  costReferenceHandle.addEventListener("pointermove", moveDrag);
  costReferenceHandle.addEventListener("pointerup", endDrag);
  costReferenceHandle.addEventListener("pointercancel", endDrag);
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
}

function applyDicePanelPosition(x, y) {
  if (!dicePanel) return;
  const nextX = Math.round(Number(x) || 0);
  const nextY = Math.round(Number(y) || 0);
  dicePanel.style.transform = `translate(${nextX}px, ${nextY}px)`;
  dicePanel.dataset.x = String(nextX);
  dicePanel.dataset.y = String(nextY);
}

function restoreDicePanelPosition() {
  if (!dicePanel) return;
  if (isMobileViewport()) {
    clearFloatingPanelTransforms();
    return;
  }
  const saved = localStorage.getItem("katanDicePanelPosition");
  if (!saved) return;
  try {
    const { x, y } = JSON.parse(saved);
    applyDicePanelPosition(x, y);
  } catch {
    localStorage.removeItem("katanDicePanelPosition");
  }
}

function initDicePanelDrag() {
  if (!dicePanel) return;
  const constrainToTable = () => {
    if (isMobileViewport()) {
      clearFloatingPanelTransforms();
      return;
    }
    const table = dicePanel.closest(".tabletop");
    if (!table) return;
    const tableRect = table.getBoundingClientRect();
    const panelRect = dicePanel.getBoundingClientRect();
    const originX = Number(dicePanel.dataset.x) || 0;
    const originY = Number(dicePanel.dataset.y) || 0;
    const minX = tableRect.left - panelRect.left + originX;
    const minY = tableRect.top - panelRect.top + originY;
    const maxX = tableRect.right - panelRect.right + originX;
    const maxY = tableRect.bottom - panelRect.bottom + originY;
    applyDicePanelPosition(
      clamp(originX, Math.min(minX, maxX), Math.max(minX, maxX)),
      clamp(originY, Math.min(minY, maxY), Math.max(minY, maxY))
    );
  };
  restoreDicePanelPosition();
  requestAnimationFrame(constrainToTable);
  window.addEventListener("resize", constrainToTable);

  let drag = null;
  const startDrag = (event) => {
    if (isMobileViewport()) {
      clearFloatingPanelTransforms();
      return;
    }
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest("button")) return;
    const table = dicePanel.closest(".tabletop");
    if (!table) return;
    const tableRect = table.getBoundingClientRect();
    const panelRect = dicePanel.getBoundingClientRect();
    const originX = Number(dicePanel.dataset.x) || 0;
    const originY = Number(dicePanel.dataset.y) || 0;
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX,
      originY,
      minX: tableRect.left - panelRect.left + originX,
      minY: tableRect.top - panelRect.top + originY,
      maxX: tableRect.right - panelRect.right + originX,
      maxY: tableRect.bottom - panelRect.bottom + originY
    };
    dicePanel.classList.add("dragging");
    dicePanel.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const moveDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const nextX = clamp(drag.originX + event.clientX - drag.startX, drag.minX, drag.maxX);
    const nextY = clamp(drag.originY + event.clientY - drag.startY, drag.minY, drag.maxY);
    applyDicePanelPosition(nextX, nextY);
  };

  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    localStorage.setItem("katanDicePanelPosition", JSON.stringify({
      x: Number(dicePanel.dataset.x) || 0,
      y: Number(dicePanel.dataset.y) || 0
    }));
    dicePanel.classList.remove("dragging");
    drag = null;
  };

  dicePanel.addEventListener("pointerdown", startDrag);
  dicePanel.addEventListener("pointermove", moveDrag);
  dicePanel.addEventListener("pointerup", endDrag);
  dicePanel.addEventListener("pointercancel", endDrag);
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
}

function updateNameFields() {
  const count = Number(playerCount.value);
  nameFields.replaceChildren();
  for (let i = 0; i < count; i++) {
    const label = document.createElement("label");
    label.innerHTML = `<span>플레이어 ${i + 1}</span><input id="name${i}" maxlength="10" value="플레이어 ${i + 1}">`;
    nameFields.append(label);
  }
}

function axialToPixel(q, r) {
  return { x: CENTER.x + SIZE * Math.sqrt(3) * (q + r / 2), y: CENTER.y + SIZE * 1.5 * r };
}

function hexCorners(cx, cy) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return { x: cx + SIZE * Math.cos(angle), y: cy + SIZE * Math.sin(angle) };
  });
}

function pointKey(point) {
  return `${Math.round(point.x)},${Math.round(point.y)}`;
}

function setupBoard() {
  const coords = [];
  for (let q = -2; q <= 2; q++) {
    for (let r = -2; r <= 2; r++) {
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
  tiles = coords.map((coord, index) => {
    const center = axialToPixel(coord.q, coord.r);
    const type = terrain[index];
    const corners = hexCorners(center.x, center.y);
    const vertexIds = corners.map((corner) => {
      const key = pointKey(corner);
      if (!vertexMap.has(key)) vertexMap.set(key, { id: vertexMap.size, x: Math.round(corner.x), y: Math.round(corner.y), owner: null, city: false, tiles: [] });
      return vertexMap.get(key).id;
    });
    return { id: index, q: coord.q, r: coord.r, ...center, type, number: null, corners, vertexIds };
  });
  assignOfficialNumberTokens();
  vertices = [...vertexMap.values()];
  tiles.forEach((tile) => {
    tile.vertexIds.forEach((id) => vertices[id].tiles.push(tile.id));
    for (let i = 0; i < 6; i++) {
      const a = tile.vertexIds[i];
      const b = tile.vertexIds[(i + 1) % 6];
      const key = [a, b].sort((x, y) => x - y).join("-");
      if (!edgeMap.has(key)) edgeMap.set(key, { id: edgeMap.size, a, b, owner: null });
    }
  });
  edges = [...edgeMap.values()];
  robberTile = tiles.find((tile) => tile.type === "desert")?.id ?? 0;
  setupHarbors();
}

function axialDistance(coord) {
  return Math.max(Math.abs(coord.q), Math.abs(coord.r), Math.abs(coord.q + coord.r));
}

function spiralAngle(tile) {
  const angle = Math.atan2(CENTER.y - tile.y, tile.x - CENTER.x);
  return angle < 0 ? angle + Math.PI * 2 : angle;
}

function officialNumberTokenOrder() {
  const startAngle = spiralAngle(tiles.find((tile) => tile.q === 0 && tile.r === -2) || tiles[0]);
  return [...tiles].sort((a, b) => {
    const ringDelta = axialDistance(b) - axialDistance(a);
    if (ringDelta !== 0) return ringDelta;
    const aAngle = (spiralAngle(a) - startAngle + Math.PI * 2) % (Math.PI * 2);
    const bAngle = (spiralAngle(b) - startAngle + Math.PI * 2) % (Math.PI * 2);
    return aAngle - bAngle;
  });
}

function assignOfficialNumberTokens() {
  const numbers = [...NUMBER_TOKENS];
  officialNumberTokenOrder().forEach((tile) => {
    tile.number = tile.type === "desert" ? null : numbers.shift();
  });
}

function setupHarbors() {
  const harborTypes = shuffle(["generic", "generic", "generic", "generic", "forest", "field", "pasture", "hill", "mountain"]);
  const selected = HARBOR_EDGE_SLOTS.map(({ q, r, side }) => edgeForTileSide(q, r, side)).filter(Boolean);
  harbors = selected.map((edge, index) => ({
    id: index,
    vertexIds: [edge.a, edge.b],
    type: harborTypes[index]
  }));
}

function edgeForTileSide(q, r, side) {
  const tile = tiles.find((candidate) => candidate.q === q && candidate.r === r);
  if (!tile) return null;
  const a = tile.vertexIds[side];
  const b = tile.vertexIds[(side + 1) % tile.vertexIds.length];
  const edge = edges.find((candidate) =>
    (candidate.a === a && candidate.b === b) || (candidate.a === b && candidate.b === a)
  );
  return edge && isCoastalEdge(edge) ? edge : null;
}

function tilesForEdge(edge) {
  return tiles.filter((tile) => tile.vertexIds.includes(edge.a) && tile.vertexIds.includes(edge.b));
}

function isCoastalEdge(edge) {
  return tilesForEdge(edge).length === 1;
}

function edgeMidpoint(edge) {
  const a = vertices[edge.a];
  const b = vertices[edge.b];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function edgeAngle(edge) {
  const midpoint = edgeMidpoint(edge);
  return Math.atan2(midpoint.y - CENTER.y, midpoint.x - CENTER.x);
}

function harborEdgesAreTooClose(edge, other) {
  return [edge.a, edge.b].some((id) => other.a === id || other.b === id);
}

function makeDevDeck() {
  devDeck = shuffle([
    ...Array(14).fill("knight"),
    ...Array(5).fill("victory"),
    ...Array(2).fill("roadBuilding"),
    ...Array(2).fill("yearPlenty"),
    ...Array(2).fill("monopoly")
  ]);
}

function adjacentVertices(vertexId) {
  return edges.filter((edge) => edge.a === vertexId || edge.b === vertexId).map((edge) => (edge.a === vertexId ? edge.b : edge.a));
}

function hasResources(player, cost) {
  if (!player?.resources) return false;
  return Object.entries(cost).every(([type, amount]) => (player.resources[type] || 0) >= amount);
}

function spend(player, cost) {
  Object.entries(cost).forEach(([type, amount]) => {
    player.resources[type] -= amount;
    game.bank[type] += amount;
  });
}

function resetBank() {
  game.bank = { ...STARTING_BANK_RESOURCES };
}

function grantResourceFromBank(player, type, amount = 1) {
  if ((game.bank[type] || 0) < amount) return false;
  game.bank[type] -= amount;
  player.resources[type] += amount;
  return true;
}

function returnResourcesToBank(resources) {
  Object.entries(resources).forEach(([type, amount]) => {
    game.bank[type] += amount;
  });
}

function playerHasAdjacentRoad(playerId, vertexId) {
  return edges.some((edge) => edge.owner === playerId && (edge.a === vertexId || edge.b === vertexId));
}

function canConnectThroughVertex(playerId, vertexId) {
  const owner = vertices[vertexId].owner;
  return owner === null || owner === playerId;
}

function canBuildSettlement(playerId, vertexId, setup = false) {
  const vertex = vertices[vertexId];
  if (vertex.owner !== null) return false;
  if (adjacentVertices(vertexId).some((id) => vertices[id].owner !== null)) return false;
  return setup || playerHasAdjacentRoad(playerId, vertexId);
}

function canBuildRoad(playerId, edgeId, setup = false) {
  const edge = edges[edgeId];
  if (edge.owner !== null) return false;
  if (setup && (edge.a === game.pendingSettlement || edge.b === game.pendingSettlement)) return true;
  const touchesSettlement = vertices[edge.a].owner === playerId || vertices[edge.b].owner === playerId;
  const touchesRoad = [edge.a, edge.b].some((vertexId) => {
    if (!canConnectThroughVertex(playerId, vertexId)) return false;
    return edges.some((other) => other.owner === playerId && other.id !== edgeId && (other.a === vertexId || other.b === vertexId));
  });
  return touchesSettlement || touchesRoad;
}

function hasLegalRoadPlacement(playerId) {
  return edges.some((edge) => canBuildRoad(playerId, edge.id, false));
}

function buildSettlement(player, vertexId, setup = false) {
  if (blockOnlineGameAction()) return false;
  if (!canBuildSettlement(player.id, vertexId, setup)) return addLog("마을을 지을 수 없는 위치입니다."), false;
  if (!setup) {
    if (!canTakePostRollAction()) return addLog("주사위를 굴린 뒤 건설할 수 있습니다."), false;
    if (player.settlements <= 0) return addLog("남은 마을 말이 없습니다."), false;
    if (!hasResources(player, COSTS.settlement)) return addLog("마을 비용이 부족합니다."), false;
    spend(player, COSTS.settlement);
  }
  vertices[vertexId].owner = player.id;
  vertices[vertexId].city = false;
  player.settlements -= 1;
  game.pendingSettlement = vertexId;
  addLog(`${player.name}: 마을 건설.`);
  if (setup && game.phase === "setup2") grantInitialResources(player, vertexId);
  updateLongestRoad();
  if (!setup) checkWin();
  return true;
}

function buildRoad(player, edgeId, setup = false) {
  if (blockOnlineGameAction()) return false;
  if (!canBuildRoad(player.id, edgeId, setup)) return addLog("도로를 지을 수 없는 위치입니다."), false;
  const freeRoad = selectedAction === "roadBuilding" && game.pendingFreeRoads > 0;
  if (!setup && !freeRoad) {
    if (!canTakePostRollAction()) return addLog("주사위를 굴린 뒤 건설할 수 있습니다."), false;
    if (player.roads <= 0) return addLog("남은 도로 말이 없습니다."), false;
    if (!hasResources(player, COSTS.road)) return addLog("도로 비용이 부족합니다."), false;
    spend(player, COSTS.road);
  }
  if (freeRoad && player.roads <= 0) return addLog("남은 도로 말이 없습니다."), false;
  edges[edgeId].owner = player.id;
  player.roads -= 1;
  game.pendingSettlement = null;
  if (freeRoad) {
    game.pendingFreeRoads -= 1;
    if (game.pendingFreeRoads > 0 && !hasLegalRoadPlacement(player.id)) game.pendingFreeRoads = 0;
    addLog(`${player.name}: 도로 건설 카드로 무료 도로 건설. 남은 무료 도로 ${game.pendingFreeRoads}개.`);
    if (game.pendingFreeRoads <= 0) selectedAction = "road";
  } else {
    addLog(`${player.name}: 도로 건설.`);
  }
  updateLongestRoad();
  checkWin();
  return true;
}

function buildCity(player, vertexId) {
  if (blockOnlineGameAction()) return false;
  if (!canTakePostRollAction()) return addLog("주사위를 굴린 뒤 도시로 업그레이드할 수 있습니다."), false;
  const vertex = vertices[vertexId];
  if (vertex.owner !== player.id || vertex.city) return addLog("내 마을만 도시로 올릴 수 있습니다."), false;
  if (player.cities <= 0) return addLog("남은 도시 말이 없습니다."), false;
  if (!hasResources(player, COSTS.city)) return addLog("도시 비용이 부족합니다."), false;
  spend(player, COSTS.city);
  vertex.city = true;
  player.cities -= 1;
  player.settlements += 1;
  addLog(`${player.name}: 도시 업그레이드.`);
  checkWin();
  return true;
}

function grantInitialResources(player, vertexId) {
  vertices[vertexId].tiles.forEach((tileId) => {
    const tile = tiles[tileId];
    if (tile.type !== "desert") grantResourceFromBank(player, tile.type, 1);
  });
}

function setupStepComplete() {
  const n = game.players.length;
  if (game.phase === "setup1") {
    game.setupIndex += 1;
    if (game.setupIndex >= n) {
      game.phase = "setup2";
      game.setupIndex = n - 1;
    }
  } else {
    game.setupIndex -= 1;
    if (game.setupIndex < 0) {
      game.phase = "play";
      game.active = 0;
      addLog("초기 배치 완료. 정식 턴을 시작합니다.");
      return;
    }
  }
  game.active = game.setupIndex;
}

function rollDice() {
  const die1 = 1 + Math.floor(Math.random() * 6);
  const die2 = 1 + Math.floor(Math.random() * 6);
  return { die1, die2, total: die1 + die2 };
}

function renderDice() {
  const dice = game.lastDice;
  if (dieOne) dieOne.textContent = dice ? dice.die1 : "-";
  if (dieTwo) dieTwo.textContent = dice ? dice.die2 : "-";
  diceTotal.textContent = dice ? dice.total : "-";
  diceTotal.closest(".dice-readout")?.classList.toggle("dice-seven", dice?.total === 7);
}

function produce(total) {
  const payouts = {};
  tiles.filter((tile) => tile.number === total && tile.id !== robberTile).forEach((tile) => {
    tile.vertexIds.forEach((vertexId) => {
      const vertex = vertices[vertexId];
      if (vertex.owner === null || tile.type === "desert") return;
      if (!payouts[tile.type]) payouts[tile.type] = [];
      payouts[tile.type].push({ playerId: vertex.owner, amount: vertex.city ? 2 : 1 });
    });
  });
  Object.entries(payouts).forEach(([type, entries]) => {
    const needed = entries.reduce((sum, entry) => sum + entry.amount, 0);
    if (game.bank[type] < needed) {
      addLog(`${RESOURCES[type].name}: 은행 재고 부족으로 생산되지 않았습니다.`);
      return;
    }
    entries.forEach((entry) => grantResourceFromBank(game.players[entry.playerId], type, entry.amount));
  });
}

function roll() {
  if (game.winner !== null) return;
  if (isOnlinePlayPhase()) {
    rollOnlineDice();
    return;
  }
  if (blockOnlineGameAction()) return;
  if (game.phase !== "play" || game.rolled || isResolvingForcedAction() || isBusyWithCardAction() || game.winner !== null) return;
  const dice = rollDice();
  game.lastDice = dice;
  renderDice();
  game.rolled = true;
  if (dice.total === 7) {
    addLog(`${currentPlayer().name}: 주사위 ${dice.die1} + ${dice.die2} = 7.`);
    startDiscardForSeven();
  } else {
    produce(dice.total);
    addLog(`${currentPlayer().name}: 주사위 ${dice.die1} + ${dice.die2} = ${dice.total}.`);
  }
  render();
}

function startDiscardForSeven() {
  game.pendingDiscards = game.players
    .filter((player) => resourceCount(player) > 7)
    .map((player) => ({
      playerId: player.id,
      needed: Math.floor(resourceCount(player) / 2),
      selected: Object.fromEntries(Object.keys(RESOURCES).map((type) => [type, 0]))
    }));

  if (!game.pendingDiscards.length) {
    selectedAction = "robber";
    addLog("7이 나왔습니다. 도둑을 옮기세요.");
    hideModal();
    return;
  }

  selectedAction = "discard";
  addLog("7이 나왔습니다. 8장 이상 보유자는 버릴 자원을 직접 선택해야 합니다.");
  showDiscardModal();
}

function showDiscardModal() {
  const pending = game.pendingDiscards[0];
  if (!pending) {
    selectedAction = "robber";
    hideModal();
    addLog("카드 버리기 완료. 도둑을 옮기세요.");
    render();
    return;
  }

  const player = game.players[pending.playerId];
  const selectedCount = Object.values(pending.selected).reduce((sum, amount) => sum + amount, 0);
  showModal("7 규칙: 카드 버리기", `${player.name}: ${pending.needed}장을 선택해 버리세요. 현재 ${selectedCount}/${pending.needed}장 선택했습니다.`);

  const grid = document.createElement("div");
  grid.className = "discard-grid";
  Object.entries(RESOURCES).forEach(([type, info]) => {
    const row = document.createElement("div");
    row.className = "discard-row";

    const label = document.createElement("span");
    label.textContent = `${info.name} 보유 ${player.resources[type]}장`;

    const amount = document.createElement("strong");
    amount.textContent = pending.selected[type];

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "-";
    minus.disabled = pending.selected[type] <= 0;
    minus.addEventListener("click", () => {
      pending.selected[type] -= 1;
      showDiscardModal();
    });

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.disabled = pending.selected[type] >= player.resources[type] || selectedCount >= pending.needed;
    plus.addEventListener("click", () => {
      pending.selected[type] += 1;
      showDiscardModal();
    });

    row.append(label, amount, minus, plus);
    grid.append(row);
  });

  const confirm = document.createElement("button");
  confirm.type = "button";
  confirm.textContent = "버리기 완료";
  confirm.disabled = selectedCount !== pending.needed;
  confirm.addEventListener("click", () => {
    Object.entries(pending.selected).forEach(([type, amount]) => {
      player.resources[type] -= amount;
    });
    returnResourcesToBank(pending.selected);
    addLog(`${player.name}: 7 규칙으로 카드 ${pending.needed}장 버림.`);
    game.pendingDiscards.shift();
    showDiscardModal();
  });

  modalContent.append(grid);
  modalActions.append(confirm);
}

function moveRobber(tileId) {
  if (isOnlinePlayPhase() && game.pendingActionView?.type === "moveRobber") {
    if (game.pendingActionView.role !== "actor") return addLog("도둑 이동을 기다리는 중입니다.");
    if (tileId === robberTile) return addLog("도둑은 다른 타일로 이동해야 합니다.");
    sendOnlineCommand("moveRobber", { tileId }).catch((error) => {
      addLog(onlineErrorMessage(error));
      render();
    });
    return;
  }
  if (blockOnlineGameAction()) return;
  if (tileId === robberTile) return addLog("도둑은 다른 타일로 이동해야 합니다.");
  robberTile = tileId;
  const victims = [...new Set(tiles[tileId].vertexIds.map((id) => vertices[id].owner).filter((id) => id !== null && id !== currentPlayer().id && resourceCount(game.players[id]) > 0))];
  if (victims.length > 1) {
    game.pendingRobberVictims = victims;
    selectedAction = "robberVictim";
    showRobberVictimModal();
  } else {
    if (victims.length === 1) stealRandom(currentPlayer(), game.players[victims[0]]);
    game.pendingRobberVictims = [];
    selectedAction = "road";
    hideModal();
  }
  render();
}

function startRobberDrag(event) {
  if (selectedAction !== "robber") return;
  if (event.button !== undefined && event.button !== 0) return;
  const point = svgPointFromClient(event.clientX, event.clientY);
  if (!point) return;
  robberDrag = {
    pointerId: event.pointerId,
    token: event.currentTarget
  };
  event.currentTarget.classList.add("dragging");
  event.currentTarget.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function moveRobberDrag(event) {
  if (!robberDrag || event.pointerId !== robberDrag.pointerId) return;
  const point = svgPointFromClient(event.clientX, event.clientY);
  if (!point) return;
  robberDrag.token.setAttribute("transform", `translate(${point.x} ${point.y})`);
  svg.querySelectorAll(".hex.drop-hover").forEach((node) => node.classList.remove("drop-hover"));
  const tile = tileAtPoint(point);
  if (tile && tile.id !== robberTile) svg.querySelector(`[data-tile-id="${tile.id}"]`)?.classList.add("drop-hover");
}

function endRobberDrag(event) {
  if (!robberDrag || event.pointerId !== robberDrag.pointerId) return;
  const point = svgPointFromClient(event.clientX, event.clientY);
  const tile = tileAtPoint(point);
  svg.querySelectorAll(".hex.drop-hover").forEach((node) => node.classList.remove("drop-hover"));
  robberDrag.token.classList.remove("dragging");
  robberDrag = null;
  if (tile && tile.id !== robberTile) {
    moveRobber(tile.id);
    return;
  }
  render();
}

function showRobberVictimModal() {
  showModal("도둑 약탈 대상 선택", "도둑을 옮긴 지형에 인접한 상대 중 자원 1장을 가져올 대상을 선택하세요.");
  game.pendingRobberVictims.forEach((playerId) => {
    const victim = game.players[playerId];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "victim-button";
    button.textContent = `${victim.name} - 자원 ${resourceCount(victim)}장`;
    button.addEventListener("click", () => {
      stealRandom(currentPlayer(), victim);
      game.pendingRobberVictims = [];
      selectedAction = "road";
      hideModal();
      render();
    });
    modalContent.append(button);
  });
}

function stealRandom(thief, victim) {
  const pool = Object.keys(RESOURCES).filter((type) => victim.resources[type] > 0);
  if (!pool.length) return;
  const type = pool[Math.floor(Math.random() * pool.length)];
  victim.resources[type] -= 1;
  thief.resources[type] += 1;
  addLog(`${thief.name}: ${victim.name}에게서 자원 1장을 가져왔습니다.`);
}

function buyDevCard() {
  if (blockOnlineGameAction()) return;
  const player = currentPlayer();
  if (!canTakePostRollAction()) return addLog("주사위를 굴린 뒤 개발 카드를 살 수 있습니다.");
  if (!devDeck.length) return addLog("개발 카드 더미가 비었습니다.");
  if (!hasResources(player, COSTS.dev)) return addLog("개발 카드 비용이 부족합니다.");
  spend(player, COSTS.dev);
  const card = makeDevCard(devDeck.pop());
  player.dev.push(card);
  addLog(`${player.name}: 개발 카드 1장 구입.`);
  checkWin();
  render();
}

function showDevCardModal() {
  if (blockOnlineGameAction()) return;
  const player = currentPlayer();
  if (!canUseDevCard()) {
    if (game.usedDevThisTurn) addLog("개발 카드는 한 턴에 1장만 사용할 수 있습니다.");
    return;
  }
  const cards = usableDevCards(player);
  if (!cards.length) return addLog("사용 가능한 개발 카드가 없습니다.");

  showModal("개발 카드 사용", "사용할 개발 카드를 선택하세요. 승점 카드와 이번 턴에 산 카드는 표시되지 않습니다.");
  cards.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "victim-button";
    button.textContent = devCardName(card.type);
    button.addEventListener("click", () => useDevCard(card.id));
    modalContent.append(button);
  });
}

function useDevCard(cardId) {
  const player = currentPlayer();
  if (!canUseDevCard()) return;
  const card = player.dev.find((item) => item.id === cardId);
  if (!card || card.type === "victory" || card.boughtTurn === game.round) return addLog("사용할 수 없는 개발 카드입니다.");

  if (card.type === "knight") return playKnight(cardId);
  if (card.type === "roadBuilding") return playRoadBuilding(cardId);
  if (card.type === "yearPlenty") return showYearPlentyModal(cardId);
  if (card.type === "monopoly") return showMonopolyModal(cardId);
}

function markDevCardUsed(player, cardId) {
  const card = removeDevCard(player, cardId);
  if (!card) return null;
  game.usedDevThisTurn = true;
  hideModal();
  return card;
}

function playKnight(cardId) {
  const player = currentPlayer();
  if (!canUseDevCard()) return;
  const card = markDevCardUsed(player, cardId);
  if (!card) return addLog("사용할 수 있는 기사 카드가 없습니다.");
  player.knights += 1;
  selectedAction = "robber";
  updateLargestArmy();
  checkWin();
  if (game.winner !== null) {
    selectedAction = "road";
    game.pendingRobberVictims = [];
    addLog(`${player.name}: 기사 사용.`);
  } else {
    addLog(`${player.name}: 기사 사용. 도둑을 옮기세요.`);
  }
  render();
}

function playRoadBuilding(cardId) {
  const player = currentPlayer();
  if (!canUseDevCard()) return;
  if (player.roads <= 0) return addLog("남은 도로 말이 없습니다.");
  if (!hasLegalRoadPlacement(player.id)) return addLog("무료 도로를 놓을 수 있는 위치가 없습니다.");
  const card = markDevCardUsed(player, cardId);
  if (!card) return;
  game.pendingFreeRoads = Math.min(2, player.roads);
  selectedAction = "roadBuilding";
  addLog(`${player.name}: 도로 건설 카드 사용. 무료 도로 ${game.pendingFreeRoads}개를 놓으세요.`);
  render();
}

function showYearPlentyModal(cardId) {
  const player = currentPlayer();
  if (!canUseDevCard()) return;
  const selected = [];
  showModal("풍년 카드", "은행에서 받을 자원 2장을 선택하세요. 같은 자원을 두 번 선택할 수 있습니다.");

  const remainingBankAfterSelection = (type) => game.bank[type] - selected.filter((resource) => resource === type).length;
  const updateText = () => {
    modalText.textContent = `은행에서 받을 자원 2장을 선택하세요. 현재 ${selected.map(devCardResourceName).join(", ") || "선택 없음"}`;
  };

  Object.entries(RESOURCES).forEach(([type, info]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "victim-button";
    button.textContent = `${info.name} (${game.bank[type]}장)`;
    button.disabled = game.bank[type] <= 0;
    button.addEventListener("click", () => {
      if (selected.length >= 2) return;
      if (remainingBankAfterSelection(type) <= 0) return addLog(`은행에 ${info.name}이 부족합니다.`);
      selected.push(type);
      updateText();
      if (selected.length === 2) {
        const card = markDevCardUsed(player, cardId);
        if (!card) return;
        selected.forEach((resource) => grantResourceFromBank(player, resource, 1));
        addLog(`${player.name}: 풍년 카드로 자원 2장 획득.`);
        render();
      }
    });
    modalContent.append(button);
  });
}

function devCardResourceName(type) {
  return RESOURCES[type]?.name || type;
}

function harborName(type) {
  return type === "generic" ? "3:1" : `${RESOURCES[type].name} 2:1`;
}

function harborShortName(type) {
  return type === "generic" ? "◆ 3:1" : `${RESOURCES[type].icon} 2:1`;
}

function playerHarbors(playerId) {
  return harbors.filter((harbor) => harbor.vertexIds.some((vertexId) => vertices[vertexId]?.owner === playerId));
}

function tradeRatioFor(playerId, resourceType) {
  const owned = playerHarbors(playerId);
  if (owned.some((harbor) => harbor.type === resourceType)) return 2;
  if (owned.some((harbor) => harbor.type === "generic")) return 3;
  return 4;
}

function tradeRatiosFor(player) {
  if (player?.trade?.ratios) return player.trade.ratios;
  return Object.fromEntries(Object.keys(RESOURCES).map((type) => [type, player ? tradeRatioFor(player.id, type) : 4]));
}

function tradeRuleText(player) {
  const ownedTypes = player?.trade?.ownedHarbors || playerHarbors(player?.id).map((harbor) => harbor.type);
  const unique = [...new Set(ownedTypes)];
  const parts = unique.map((type) => harborName(type));
  if (!parts.length) return "현재 교환 규칙: 기본 4:1";
  return `현재 교환 규칙: ${parts.join(", ")}, 그 외 4:1`;
}

function showMonopolyModal(cardId) {
  const player = currentPlayer();
  if (!canUseDevCard()) return;
  showModal("독점 카드", "독점할 자원 종류를 선택하세요. 다른 모든 플레이어의 해당 자원을 전부 가져옵니다.");

  Object.entries(RESOURCES).forEach(([type, info]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "victim-button";
    button.textContent = info.name;
    button.addEventListener("click", () => {
      const card = markDevCardUsed(player, cardId);
      if (!card) return;
      let gained = 0;
      game.players.forEach((other) => {
        if (other.id === player.id) return;
        gained += other.resources[type];
        player.resources[type] += other.resources[type];
        other.resources[type] = 0;
      });
      addLog(`${player.name}: 독점 카드로 ${info.name} ${gained}장 획득.`);
      render();
    });
    modalContent.append(button);
  });
}

function updateLargestArmy() {
  const leader = game.players.filter((p) => p.knights >= 3).sort((a, b) => b.knights - a.knights)[0];
  if (leader && (game.largestArmy === null || leader.knights > game.players[game.largestArmy].knights)) {
    game.largestArmy = leader.id;
    addLog(`${leader.name}: 최대 기사력 획득.`);
  }
}

function longestRoadLength(playerId) {
  const owned = edges.filter((edge) => edge.owner === playerId);
  const byVertex = new Map();
  owned.forEach((edge) => {
    [edge.a, edge.b].forEach((v) => {
      if (!byVertex.has(v)) byVertex.set(v, []);
      byVertex.get(v).push(edge);
    });
  });
  function dfs(vertex, used) {
    if (used.size > 0 && !canConnectThroughVertex(playerId, vertex)) return 0;
    let best = 0;
    for (const edge of byVertex.get(vertex) || []) {
      if (used.has(edge.id)) continue;
      const next = edge.a === vertex ? edge.b : edge.a;
      used.add(edge.id);
      best = Math.max(best, 1 + dfs(next, used));
      used.delete(edge.id);
    }
    return best;
  }
  return Math.max(0, ...owned.flatMap((edge) => [dfs(edge.a, new Set()), dfs(edge.b, new Set())]));
}

function updateLongestRoad() {
  const lengths = game.players
    .map((p) => ({ id: p.id, length: longestRoadLength(p.id) }))
    .filter((item) => item.length >= 5)
    .sort((a, b) => b.length - a.length);

  if (!lengths.length) {
    game.longestRoad = null;
    return;
  }

  const topLength = lengths[0].length;
  const leaders = lengths.filter((item) => item.length === topLength);
  const current = game.longestRoad === null ? null : lengths.find((item) => item.id === game.longestRoad);

  if (current && current.length === topLength) return;

  if (leaders.length === 1) {
    if (game.longestRoad !== leaders[0].id) addLog(`${game.players[leaders[0].id].name}: 최장 교역로 획득.`);
    game.longestRoad = leaders[0].id;
    return;
  }

  if (!current) game.longestRoad = null;
}

async function bankTrade(give, get) {
  const player = currentPlayer();
  const ratio = tradeRatioFor(player.id, give);
  if (give === get) return addLog("서로 다른 자원을 고르세요.");
  if (player.resources[give] < ratio) return addLog(`은행 교환은 ${RESOURCES[give].name} ${ratio}장이 필요합니다.`);
  if (game.bank[get] < 1) return addLog(`은행에 ${RESOURCES[get].name}이 부족합니다.`);
  player.resources[give] -= ratio;
  game.bank[give] += ratio;
  grantResourceFromBank(player, get, 1);
  addLog(`${player.name}: ${RESOURCES[give].name} ${ratio}장을 ${RESOURCES[get].name} 1장으로 교환했습니다.`);
  hideModal();
  render();
}

async function submitOnlineBankTrade(give, get, submitButton) {
  if (!canUseOnlineBankTradeCommand()) {
    addLog(onlineTradeBlockedMessage());
    render();
    return;
  }
  submitButton.disabled = true;
  try {
    await sendOnlineCommand("bankTrade", { give, get });
    hideModal();
  } catch (error) {
    addLog(onlineErrorMessage(error));
    submitButton.disabled = false;
    render();
  }
}

function showBankTradeModal() {
  if (isOnlinePlayPhase() && !canUseOnlineBankTradeCommand()) {
    addLog(onlineTradeBlockedMessage());
    render();
    return;
  }
  if (!isOnlinePlayPhase()) {
    if (blockOnlineGameAction()) return;
    if (!canTakePostRollAction()) return addLog("주사위를 굴린 뒤 교환할 수 있습니다.");
  }

  const player = currentPlayer();
  if (!player) return;
  const ratios = tradeRatiosFor(player);
  let selectedGive = "";
  let selectedGet = "";

  showModal("은행/항구 교환", "지불할 자원과 받을 자원을 선택하세요.");

  const wrapper = document.createElement("div");
  wrapper.className = "bank-trade-modal";
  const rules = document.createElement("div");
  rules.className = "trade-rules";
  rules.textContent = tradeRuleText(player);

  const columns = document.createElement("div");
  columns.className = "bank-trade-columns";
  const giveColumn = document.createElement("div");
  const getColumn = document.createElement("div");
  giveColumn.className = "bank-trade-column";
  getColumn.className = "bank-trade-column";
  const giveTitle = document.createElement("strong");
  giveTitle.textContent = "지불할 자원";
  const getTitle = document.createElement("strong");
  getTitle.textContent = "받을 자원";
  giveColumn.append(giveTitle);
  getColumn.append(getTitle);

  const summary = document.createElement("div");
  summary.className = "trade-summary";
  const submit = document.createElement("button");
  submit.type = "button";
  submit.textContent = "교환";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "취소";
  cancel.addEventListener("click", hideModal);

  function ratioForSelection() {
    return selectedGive ? Number(ratios[selectedGive] || 4) : 4;
  }

  function refresh() {
    const ratio = ratioForSelection();
    [...giveColumn.querySelectorAll("button[data-resource]")].forEach((button) => {
      const type = button.dataset.resource;
      const enough = (player.resources?.[type] || 0) >= Number(ratios[type] || 4);
      button.classList.toggle("selected", type === selectedGive);
      button.disabled = !enough;
    });
    [...getColumn.querySelectorAll("button[data-resource]")].forEach((button) => {
      const type = button.dataset.resource;
      button.classList.toggle("selected", type === selectedGet);
      button.disabled = type === selectedGive || (game.bank?.[type] || 0) < 1;
    });
    if (!selectedGive || !selectedGet) {
      summary.textContent = "자원을 선택하면 실제 적용 비율과 교환 요약이 표시됩니다.";
      submit.disabled = true;
      return;
    }
    const canPay = (player.resources?.[selectedGive] || 0) >= ratio;
    const bankHas = (game.bank?.[selectedGet] || 0) >= 1;
    summary.textContent = `${RESOURCES[selectedGive].name} ${ratio}장 → ${RESOURCES[selectedGet].name} 1장 (${ratio}:1 적용)`;
    submit.disabled = selectedGive === selectedGet || !canPay || !bankHas;
  }

  Object.entries(RESOURCES).forEach(([type, info]) => {
    const giveButton = document.createElement("button");
    giveButton.type = "button";
    giveButton.dataset.resource = type;
    giveButton.innerHTML = `<span>${info.icon} ${info.name}</span><small>보유 ${player.resources?.[type] || 0} / ${ratios[type]}:1</small>`;
    giveButton.addEventListener("click", () => {
      selectedGive = type;
      if (selectedGet === type) selectedGet = "";
      refresh();
    });
    giveColumn.append(giveButton);

    const getButton = document.createElement("button");
    getButton.type = "button";
    getButton.dataset.resource = type;
    getButton.innerHTML = `<span>${info.icon} ${info.name}</span><small>은행 ${game.bank?.[type] || 0}</small>`;
    getButton.addEventListener("click", () => {
      selectedGet = type;
      refresh();
    });
    getColumn.append(getButton);
  });

  submit.addEventListener("click", () => {
    if (!selectedGive || !selectedGet || selectedGive === selectedGet) return;
    if (isOnlinePlayPhase()) {
      submitOnlineBankTrade(selectedGive, selectedGet, submit);
    } else {
      bankTrade(selectedGive, selectedGet);
    }
  });

  columns.append(giveColumn, getColumn);
  wrapper.append(rules, columns, summary);
  modalContent.append(wrapper);
  modalActions.append(cancel, submit);
  refresh();
}

function emptyResourceBundle() {
  return Object.fromEntries(Object.keys(RESOURCES).map((type) => [type, 0]));
}

function resourceBundleTotal(bundle = {}) {
  return Object.values(bundle).reduce((sum, amount) => sum + (Number(amount) || 0), 0);
}

function resourceBundleText(bundle = {}) {
  const entries = Object.entries(bundle).filter(([, amount]) => Number(amount) > 0);
  if (!entries.length) return "없음";
  return entries.map(([type, amount]) => resourceAmountText(type, amount)).join(", ");
}

function resourceBundleShortfall(player, bundle = {}) {
  return Object.entries(bundle)
    .filter(([, amount]) => Number(amount) > 0)
    .filter(([type, amount]) => (player?.resources?.[type] || 0) < Number(amount))
    .map(([type, amount]) => ({
      type,
      needed: Number(amount),
      owned: player?.resources?.[type] || 0
    }));
}

function hasBundleResources(player, bundle = {}) {
  return resourceBundleShortfall(player, bundle).length === 0;
}

function tradeWarningText(messages) {
  return messages.filter(Boolean).join(" / ");
}

function createTradeWarning() {
  const warning = document.createElement("p");
  warning.className = "trade-warning";
  return warning;
}

function setTradeWarning(warning, text) {
  warning.textContent = text || "";
  warning.classList.toggle("is-visible", Boolean(text));
}

function createResourceBundleEditor(title, bundle, { owner = null, onChange = () => {}, maxByOwner = false } = {}) {
  const group = document.createElement("div");
  group.className = "trade-resource-group";
  const heading = document.createElement("strong");
  heading.textContent = title;
  group.append(heading);

  Object.entries(RESOURCES).forEach(([type, info]) => {
    const row = document.createElement("div");
    row.className = "trade-resource-row";
    const label = document.createElement("span");
    const owned = owner?.resources?.[type] ?? null;
    label.textContent = owned === null
      ? resourceDisplayName(type)
      : `${resourceDisplayName(type)} (보유 ${owned})`;
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "-";
    const amount = document.createElement("strong");
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";

    function sync() {
      amount.textContent = bundle[type] || 0;
      minus.disabled = (bundle[type] || 0) <= 0;
      plus.disabled = maxByOwner && owned !== null && (bundle[type] || 0) >= owned;
    }

    minus.addEventListener("click", () => {
      bundle[type] = Math.max(0, (bundle[type] || 0) - 1);
      sync();
      onChange();
    });
    plus.addEventListener("click", () => {
      if (maxByOwner && owned !== null && (bundle[type] || 0) >= owned) return;
      bundle[type] = (bundle[type] || 0) + 1;
      sync();
      onChange();
    });

    sync();
    row.append(label, minus, amount, plus);
    group.append(row);
  });

  return group;
}

function requesterTradePlayerName(trade) {
  const player = onlineSession.state?.players?.find((entry) => entry.id === trade?.requesterPlayerId);
  return player?.name || "요청자";
}

function onlinePlayerName(playerId) {
  return onlineSession.state?.players?.find((entry) => entry.id === playerId)?.name || "플레이어";
}

function onlineViewerGamePlayer() {
  if (!Number.isInteger(game.viewerSeatIndex)) return currentPlayer();
  return game.players[game.viewerSeatIndex] || currentPlayer();
}

function showPlayerTradeResultModal(result) {
  if (!result || ["room-ended", "reconnect-waiting"].includes(onlineSession.modalKind)) return;
  onlineSession.lastPlayerTradeResultAt = result.createdAt || Date.now();
  onlineSession.modalKind = "player-trade-result";
  if (result.type === "completed") {
    showModal("거래 완료", `${onlinePlayerName(result.requesterPlayerId)}님과 ${onlinePlayerName(result.targetPlayerId)}님의 거래가 완료되었습니다.`);
    const review = document.createElement("div");
    review.className = "trade-review";
    review.innerHTML = `<p>${onlinePlayerName(result.requesterPlayerId)} 제공: ${resourceBundleText(result.offer)}</p><p>${onlinePlayerName(result.targetPlayerId)} 제공: ${resourceBundleText(result.request)}</p>`;
    modalContent.append(review);
  } else if (result.type === "canceled") {
    showModal("거래 취소", `${onlinePlayerName(result.requesterPlayerId)}님의 거래 요청이 취소되었습니다.`);
  } else {
    showModal("거래 취소", "자원 상태가 바뀌어 거래가 완료되지 않았습니다.");
  }
  addModalButton("확인", hideModal);
}

function showPendingPlayerTradeModal() {
  const trade = onlineSession.state?.pendingPlayerTrade;
  if (!trade) return;
  if (["room-ended", "reconnect-waiting", "leave-confirm"].includes(onlineSession.modalKind)) return;
  onlineSession.modalKind = "player-trade";
  if (trade.role === "requester") return showRequesterPendingTradeModal(trade);
  if (trade.role === "responder") return showResponderPendingTradeModal(trade);
  showModal("플레이어 교환 진행 중", `${requesterTradePlayerName(trade)}님의 거래 요청이 진행 중입니다.`);
}

function showOnlinePlayerTradeComposer({ trade = null, counter = null } = {}) {
  if (!isOnlinePlayPhase()) return;
  if (!trade && !canUseOnlinePlayerTradeCommand()) {
    addLog(onlineTradeBlockedMessage());
    render();
    return;
  }

  onlineSession.modalKind = "player-trade";
  const player = onlineViewerGamePlayer();
  const offer = trade ? { ...trade.offer } : counter?.counterRequest ? { ...counter.counterRequest } : emptyResourceBundle();
  const request = trade ? { ...trade.request } : counter?.counterOffer ? { ...counter.counterOffer } : emptyResourceBundle();
  showModal(trade ? "교환 조건 수정" : "플레이어 교환", counter ? "흥정 조건을 반영해 다시 요청합니다." : "내가 줄 자원과 받을 자원을 정해 모든 참가자에게 요청합니다.");

  const layout = document.createElement("div");
  layout.className = "player-trade-composer";
  const offerZone = document.createElement("section");
  offerZone.className = "player-trade-zone player-trade-zone-offer";
  const requestZone = document.createElement("section");
  requestZone.className = "player-trade-zone player-trade-zone-request";
  const summaryZone = document.createElement("section");
  summaryZone.className = "player-trade-zone player-trade-zone-summary";

  const offerTitle = document.createElement("strong");
  offerTitle.className = "player-trade-zone-title";
  offerTitle.textContent = "내가 줄 자원";
  const requestTitle = document.createElement("strong");
  requestTitle.className = "player-trade-zone-title";
  requestTitle.textContent = "받을 자원";
  const summaryTitle = document.createElement("strong");
  summaryTitle.className = "player-trade-zone-title";
  summaryTitle.textContent = "요약";

  const summary = document.createElement("div");
  summary.className = "trade-summary";
  const offerWarning = createTradeWarning();
  const requestWarning = createTradeWarning();
  const summaryWarning = createTradeWarning();
  const submit = document.createElement("button");
  submit.type = "button";
  submit.textContent = trade ? "재요청" : "요청";

  function refresh() {
    const offerEmpty = resourceBundleTotal(offer) <= 0;
    const requestEmpty = resourceBundleTotal(request) <= 0;
    const offerShort = !hasBundleResources(player, offer);
    const offerMessage = tradeWarningText([
      offerEmpty ? "줄 자원을 선택하세요" : "",
      offerShort ? "자원이 없습니다" : ""
    ]);
    const requestMessage = requestEmpty ? "받을 자원을 선택하세요" : "";
    summary.innerHTML = `<p>내가 줌: ${resourceBundleText(offer)}</p><p>내가 받음: ${resourceBundleText(request)}</p>`;
    setTradeWarning(offerWarning, offerMessage);
    setTradeWarning(requestWarning, requestMessage);
    setTradeWarning(summaryWarning, tradeWarningText([offerMessage, requestMessage]));
    submit.disabled = offerEmpty || requestEmpty || offerShort;
  }

  offerZone.append(
    offerTitle,
    createResourceBundleEditor("내가 줄 자원", offer, { owner: player, onChange: refresh, maxByOwner: true }),
    offerWarning
  );
  requestZone.append(
    requestTitle,
    createResourceBundleEditor("받을 자원", request, { onChange: refresh }),
    requestWarning
  );
  summaryZone.append(summaryTitle, summary, summaryWarning);
  layout.append(offerZone, requestZone, summaryZone);
  modalContent.append(layout);

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "닫기";
  cancel.addEventListener("click", hideModal);
  submit.addEventListener("click", async () => {
    submit.disabled = true;
    try {
      if (trade) {
        await sendOnlineCommand("updatePlayerTradeOffer", { tradeId: trade.id, round: trade.round, offer, request });
      } else {
        await sendOnlineCommand("openPlayerTrade", { offer, request });
      }
    } catch (error) {
      addLog(onlineErrorMessage(error));
      submit.disabled = false;
      render();
    }
  });
  modalActions.append(cancel, submit);
  refresh();
}

function showRequesterPendingTradeModal(trade) {
  showModal("플레이어 교환", "모든 참가자의 응답을 확인한 뒤 수락한 참가자를 선택해 거래를 확정하세요.");
  const viewer = onlineViewerGamePlayer();
  const layout = document.createElement("div");
  layout.className = "player-trade-requester-grid";

  const offerPanel = document.createElement("section");
  offerPanel.className = "player-trade-zone";
  offerPanel.innerHTML = `<strong class="player-trade-zone-title">내가 줄 자원</strong><div class="trade-review"><p>${resourceBundleText(trade.offer)}</p></div>`;

  const requestPanel = document.createElement("section");
  requestPanel.className = "player-trade-zone";
  requestPanel.innerHTML = `<strong class="player-trade-zone-title">받을 자원</strong><div class="trade-review"><p>${resourceBundleText(trade.request)}</p></div>`;

  const responsePanel = document.createElement("section");
  responsePanel.className = "player-trade-zone player-trade-responses";
  const responseTitle = document.createElement("strong");
  responseTitle.className = "player-trade-zone-title";
  responseTitle.textContent = "응답";
  responsePanel.append(responseTitle);

  const responses = trade.responses || {};
  const responders = onlineSession.state.players.filter((player) => player.id !== onlineSession.playerId && !player.left);
  const allResponded = responders.every((player) => responses[player.id]);
  responders.forEach((player) => {
    const response = responses[player.id];
    const row = document.createElement("div");
    row.className = "trade-response-row";
    const label = document.createElement("span");
    label.textContent = `${player.name}: ${response ? response.type === "accept" ? "수락" : response.type === "reject" ? "거절" : "흥정" : "대기"}`;
    row.append(label);

    if (response?.type === "counter") {
      const counter = document.createElement("small");
      counter.className = "trade-response-counter";
      counter.textContent = `상대가 줌: ${resourceBundleText(response.counterOffer)} / 상대가 받음: ${resourceBundleText(response.counterRequest)}`;
      const useCounter = document.createElement("button");
      useCounter.type = "button";
      useCounter.textContent = "흥정 조건 반영";
      const counterWarning = createTradeWarning();
      const canUseCounter = hasBundleResources(viewer, response.counterRequest);
      useCounter.disabled = !canUseCounter;
      setTradeWarning(counterWarning, canUseCounter ? "" : "자원이 없습니다");
      useCounter.addEventListener("click", () => showOnlinePlayerTradeComposer({ trade, counter: response }));
      row.append(counter, useCounter, counterWarning);
    }

    if (response?.type === "accept") {
      const choose = document.createElement("button");
      choose.type = "button";
      choose.textContent = "선택";
      choose.disabled = !allResponded;
      choose.addEventListener("click", async () => {
        choose.disabled = true;
        try {
          await sendOnlineCommand("choosePlayerTradeResponse", { tradeId: trade.id, round: trade.round, targetPlayerId: player.id });
        } catch (error) {
          addLog(onlineErrorMessage(error));
          choose.disabled = false;
          render();
        }
      });
      row.append(choose);
    }
    responsePanel.append(row);
  });

  layout.append(offerPanel, requestPanel, responsePanel);
  modalContent.append(layout);
  addModalButton("조건 수정", () => showOnlinePlayerTradeComposer({ trade }));
  addModalButton("거래 취소", async () => {
    try {
      await sendOnlineCommand("cancelPlayerTrade", { tradeId: trade.id, round: trade.round });
    } catch (error) {
      addLog(onlineErrorMessage(error));
      render();
    }
  });
}

function showResponderPendingTradeModal(trade) {
  showModal("플레이어 교환 요청", `${requesterTradePlayerName(trade)}의 거래 요청에 응답하세요.`);
  const player = onlineViewerGamePlayer();
  const hasResponded = Boolean(trade.myResponse);
  const canAccept = hasBundleResources(player, trade.request);
  const review = document.createElement("div");
  review.className = "trade-review";
  review.innerHTML = `<p>상대가 줌: ${resourceBundleText(trade.offer)}</p><p>내가 줘야 함: ${resourceBundleText(trade.request)}</p><p>내 응답: ${trade.myResponse?.type || "대기"}</p>`;
  const acceptWarning = createTradeWarning();
  setTradeWarning(acceptWarning, !canAccept ? "자원이 없습니다" : "");
  modalContent.append(review, acceptWarning);

  const sendResponse = async (response, extra = {}) => {
    try {
      await sendOnlineCommand("respondPlayerTrade", { tradeId: trade.id, round: trade.round, response, ...extra });
    } catch (error) {
      addLog(onlineErrorMessage(error));
      render();
    }
  };
  const reject = addModalButton("거절", () => sendResponse("reject"));
  const accept = addModalButton("수락", () => sendResponse("accept"));
  const counter = addModalButton("흥정", () => showCounterTradeModal(trade));
  reject.disabled = hasResponded;
  accept.disabled = hasResponded || !canAccept;
  counter.disabled = hasResponded;
}

function showCounterTradeModal(trade) {
  const player = onlineViewerGamePlayer();
  const counterOffer = emptyResourceBundle();
  const counterRequest = emptyResourceBundle();
  showModal("흥정 제안", "내가 원하는 거래 조건을 지정해 요청자에게 보냅니다.");
  const summary = document.createElement("div");
  summary.className = "trade-summary";
  const offerWarning = createTradeWarning();
  const requestWarning = createTradeWarning();
  const summaryWarning = createTradeWarning();
  const submit = document.createElement("button");
  submit.type = "button";
  submit.textContent = "흥정 보내기";

  function refresh() {
    const offerEmpty = resourceBundleTotal(counterOffer) <= 0;
    const requestEmpty = resourceBundleTotal(counterRequest) <= 0;
    const offerShort = !hasBundleResources(player, counterOffer);
    const offerMessage = tradeWarningText([
      offerEmpty ? "줄 자원을 선택하세요" : "",
      offerShort ? "자원이 없습니다" : ""
    ]);
    const requestMessage = requestEmpty ? "받을 자원을 선택하세요" : "";
    summary.innerHTML = `<p>내가 줌: ${resourceBundleText(counterOffer)}</p><p>내가 받음: ${resourceBundleText(counterRequest)}</p>`;
    setTradeWarning(offerWarning, offerMessage);
    setTradeWarning(requestWarning, requestMessage);
    setTradeWarning(summaryWarning, tradeWarningText([offerMessage, requestMessage]));
    submit.disabled = offerEmpty || requestEmpty || offerShort;
  }

  const layout = document.createElement("div");
  layout.className = "player-trade-composer";
  const offerZone = document.createElement("section");
  offerZone.className = "player-trade-zone";
  const offerTitle = document.createElement("strong");
  offerTitle.className = "player-trade-zone-title";
  offerTitle.textContent = "내가 줄 자원";
  const requestZone = document.createElement("section");
  requestZone.className = "player-trade-zone";
  const requestTitle = document.createElement("strong");
  requestTitle.className = "player-trade-zone-title";
  requestTitle.textContent = "받을 자원";
  const summaryZone = document.createElement("section");
  summaryZone.className = "player-trade-zone";
  const summaryTitle = document.createElement("strong");
  summaryTitle.className = "player-trade-zone-title";
  summaryTitle.textContent = "요약";

  offerZone.append(
    offerTitle,
    createResourceBundleEditor("내가 줄 자원", counterOffer, { owner: player, onChange: refresh, maxByOwner: true }),
    offerWarning
  );
  requestZone.append(
    requestTitle,
    createResourceBundleEditor("받을 자원", counterRequest, { onChange: refresh }),
    requestWarning
  );
  summaryZone.append(summaryTitle, summary, summaryWarning);
  layout.append(offerZone, requestZone, summaryZone);
  modalContent.append(layout);

  addModalButton("뒤로", () => showResponderPendingTradeModal(trade));
  submit.addEventListener("click", async () => {
    submit.disabled = true;
    try {
      await sendOnlineCommand("respondPlayerTrade", { tradeId: trade.id, round: trade.round, response: "counter", counterOffer, counterRequest });
    } catch (error) {
      addLog(onlineErrorMessage(error));
      submit.disabled = false;
      render();
    }
  });
  modalActions.append(submit);
  refresh();
}

function showOnlineDevCardModal() {
  if (!canUseOnlineDevCard()) {
    if (game.usedDevThisTurn) addLog("개발 카드는 한 턴에 1장만 사용할 수 있습니다.");
    else addLog("사용 가능한 개발 카드가 없습니다.");
    render();
    return;
  }

  const player = currentPlayer();
  const cards = usableDevCards(player);
  showModal("개발 카드 사용", "사용할 개발 카드를 선택하세요. 승점 카드는 사용할 수 없습니다.");
  cards.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "victim-button";
    button.textContent = devCardName(card.type);
    button.addEventListener("click", () => {
      if (card.type === "yearPlenty") return showOnlineYearPlentyModal(card.id);
      if (card.type === "monopoly") return showOnlineMonopolyModal(card.id);
      return playOnlineDevCard(card.id);
    });
    modalContent.append(button);
  });
  addModalButton("닫기", hideModal);
}

function showOnlineYearPlentyModal(cardId) {
  const selected = [];
  showModal("풍년 카드", "은행에서 받을 자원 2장을 선택하세요. 같은 자원을 두 번 선택할 수 있습니다.");

  function selectedCount(type) {
    return selected.filter((resource) => resource === type).length;
  }

  function refreshText() {
    modalText.textContent = `은행에서 받을 자원 2장을 선택하세요. 현재: ${selected.map(devCardResourceName).join(", ") || "선택 없음"}`;
  }

  Object.entries(RESOURCES).forEach(([type, info]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "victim-button";
    button.textContent = `${info.name} (${game.bank[type]}장)`;
    button.disabled = game.bank[type] <= 0;
    button.addEventListener("click", () => {
      if (selected.length >= 2) return;
      if ((game.bank[type] || 0) - selectedCount(type) <= 0) {
        addLog(`${info.name}: 은행 재고가 부족합니다.`);
        return;
      }
      selected.push(type);
      refreshText();
      if (selected.length === 2) playOnlineDevCard(cardId, { resources: selected });
    });
    modalContent.append(button);
  });
  addModalButton("뒤로", showOnlineDevCardModal);
  refreshText();
}

function showOnlineMonopolyModal(cardId) {
  showModal("독점 카드", "독점할 자원 종류를 선택하세요.");
  Object.entries(RESOURCES).forEach(([type, info]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "victim-button";
    button.textContent = info.name;
    button.addEventListener("click", () => playOnlineDevCard(cardId, { resource: type }));
    modalContent.append(button);
  });
  addModalButton("뒤로", showOnlineDevCardModal);
}

function showPlayerTradeModal() {
  if (blockOnlineGameAction()) return;
  const player = currentPlayer();
  if (!canTakePostRollAction()) return addLog("주사위를 굴린 뒤 교환할 수 있습니다.");
  const partners = game.players.filter((other) => other.id !== player.id);
  if (!partners.length) return addLog("교환할 상대가 없습니다.");

  const partnerSelect = document.createElement("select");
  partners.forEach((partner) => {
    const option = document.createElement("option");
    option.value = partner.id;
    option.textContent = partner.name;
    partnerSelect.append(option);
  });

  const offer = Object.fromEntries(Object.keys(RESOURCES).map((type) => [type, 0]));
  const request = Object.fromEntries(Object.keys(RESOURCES).map((type) => [type, 0]));
  const summary = document.createElement("p");
  summary.className = "trade-summary";
  const propose = document.createElement("button");
  propose.type = "button";
  propose.textContent = "제안";

  const resourceText = resourceBundleText;

  function updateSummary() {
    const partner = game.players[Number(partnerSelect.value)];
    summary.textContent = `${player.name} 제안: ${resourceText(offer)} / ${partner.name} 요청: ${resourceText(request)}`;
  }

  function updateProposeState() {
    const offerTotal = resourceCount({ resources: offer });
    const requestTotal = resourceCount({ resources: request });
    propose.disabled = offerTotal <= 0 || requestTotal <= 0;
  }

  function refreshDraftState() {
    updateSummary();
    updateProposeState();
  }

  function addResourceEditor(title, owner, values) {
    const group = document.createElement("div");
    group.className = "trade-resource-group";
    const heading = document.createElement("strong");
    heading.textContent = title;
    group.append(heading);

    Object.entries(RESOURCES).forEach(([type, info]) => {
      const row = document.createElement("div");
      row.className = "trade-resource-row";
      const label = document.createElement("span");
      label.textContent = `${info.name} (보유 ${owner.resources[type]})`;
      const minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "-";
      const amount = document.createElement("strong");
      amount.textContent = values[type];
      const plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";

      function syncButtons() {
        amount.textContent = values[type];
        minus.disabled = values[type] <= 0;
        plus.disabled = values[type] >= owner.resources[type];
      }

      minus.addEventListener("click", () => {
        values[type] = Math.max(0, values[type] - 1);
        syncButtons();
        refreshDraftState();
      });
      plus.addEventListener("click", () => {
        if (values[type] >= owner.resources[type]) return;
        values[type] += 1;
        syncButtons();
        refreshDraftState();
      });

      syncButtons();
      row.append(label, minus, amount, plus);
      group.append(row);
    });
    return group;
  }

  function resetRequest() {
    Object.keys(request).forEach((type) => { request[type] = 0; });
  }

  function renderEditor({ resetRequestValues = false } = {}) {
    showModal("플레이어 교환", "상대와 주고받을 자원을 정해 제안하세요. 상대가 수락해야 교환됩니다.");
    if (resetRequestValues) resetRequest();
    const editor = document.createElement("div");
    editor.className = "trade-offer";

    const partnerRow = document.createElement("label");
    partnerRow.className = "trade-partner";
    const partnerLabel = document.createElement("span");
    partnerLabel.textContent = "상대";
    partnerRow.append(partnerLabel, partnerSelect);

    const partner = game.players[Number(partnerSelect.value)];
    const offerGroup = addResourceEditor(`${player.name}이 줄 자원`, player, offer);
    const requestGroup = addResourceEditor(`${partner.name}에게 요청할 자원`, partner, request);

    editor.append(partnerRow, offerGroup, requestGroup, summary);
    modalContent.append(editor);

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "취소";
    cancel.addEventListener("click", hideModal);

    modalActions.append(cancel, propose);
    refreshDraftState();
  }

  function renderReview(partner) {
    showModal("교환 제안 확인", `${partner.name}님, ${player.name}의 교환 제안을 수락하시겠습니까?`);
    const review = document.createElement("div");
    review.className = "trade-review";
    const offerLine = document.createElement("p");
    offerLine.textContent = `${player.name} 제공: ${resourceText(offer)}`;
    const requestLine = document.createElement("p");
    requestLine.textContent = `${partner.name} 제공: ${resourceText(request)}`;
    review.append(offerLine, requestLine);
    modalContent.append(review);

    const revise = document.createElement("button");
    revise.type = "button";
    revise.textContent = "수정";
    revise.addEventListener("click", () => renderEditor());

    const reject = document.createElement("button");
    reject.type = "button";
    reject.textContent = "거절";
    reject.addEventListener("click", () => {
      addLog(`${partner.name}: ${player.name}의 교환 제안을 거절했습니다.`);
      hideModal();
      render();
    });

    const accept = document.createElement("button");
    accept.type = "button";
    accept.textContent = "수락";
    accept.addEventListener("click", () => {
      if (!canTakePostRollAction()) {
        hideModal();
        render();
        return addLog("현재는 교환할 수 없습니다.");
      }
      if (!hasResources(player, offer)) return addLog(`${player.name}: 제안할 자원이 부족합니다.`);
      if (!hasResources(partner, request)) return addLog(`${partner.name}: 요청받은 자원이 부족합니다.`);

      Object.keys(RESOURCES).forEach((type) => {
        player.resources[type] -= offer[type];
        partner.resources[type] += offer[type];
        partner.resources[type] -= request[type];
        player.resources[type] += request[type];
      });
      addLog(`${player.name}: ${partner.name}과 교환. 제공 ${resourceText(offer)} / 획득 ${resourceText(request)}.`);
      hideModal();
      render();
    });

    modalActions.append(revise, reject, accept);
  }

  partnerSelect.addEventListener("change", () => renderEditor({ resetRequestValues: true }));

  propose.addEventListener("click", () => {
    const partner = game.players[Number(partnerSelect.value)];
    if (!partner) return;
    const offerTotal = resourceCount({ resources: offer });
    const requestTotal = resourceCount({ resources: request });
    if (offerTotal <= 0 || requestTotal <= 0) return addLog("주고받을 자원을 각각 1장 이상 선택하세요.");
    if (!hasResources(player, offer)) return addLog(`${player.name}: 제안할 자원이 부족합니다.`);
    if (!hasResources(partner, request)) return addLog(`${partner.name}: 요청받은 자원이 부족합니다.`);
    renderReview(partner);
  });

  renderEditor();
}

function endTurn() {
  if (isOnlinePlayPhase()) {
    endOnlineTurn();
    return;
  }
  if (blockOnlineGameAction()) return;
  if (game.phase !== "play" || !game.rolled || isResolvingForcedAction() || isBusyWithCardAction() || game.winner !== null) return;
  game.active = (game.active + 1) % game.players.length;
  if (game.active === 0) game.round += 1;
  game.rolled = false;
  game.usedDevThisTurn = false;
  game.lastDice = null;
  selectedAction = "road";
  renderDice();
  addLog(`${currentPlayer().name} 차례입니다.`);
  render();
}

function checkWin() {
  const player = currentPlayer();
  if (player && totalPoints(player) >= 10 && game.phase === "play") {
    game.winner = player.id;
    addLog(`${player.name} 승리! 10점 달성.`);
  }
}

function startGame() {
  const count = Number(playerCount.value);
  game.players = Array.from({ length: count }, (_, i) => freshPlayer(document.querySelector(`#name${i}`).value.trim() || `플레이어 ${i + 1}`, i));
  game.active = 0;
  game.round = 1;
  game.phase = "setup1";
  game.setupIndex = 0;
  game.pendingSettlement = null;
  game.rolled = false;
  game.largestArmy = null;
  game.longestRoad = null;
  game.pendingDiscards = [];
  game.pendingRobberVictims = [];
  game.pendingAction = null;
  game.pendingActionView = null;
  game.lastRobberResult = null;
  game.pendingFreeRoads = 0;
  game.devCardSeq = 0;
  game.usedDevThisTurn = false;
  game.lastDice = null;
  resetBank();
  game.winner = null;
  game.winnerSummary = null;
  game.viewerSeatIndex = null;
  selectedAction = "settlement";
  renderDice();
  logEl.replaceChildren();
  setupBoard();
  makeDevDeck();
  setupScreen.classList.add("hidden");
  hideModal();
  addLog("초기 배치: 순서대로 마을 1개와 도로 1개를 놓으세요.");
  render();
}

function resetToSetup() {
  showOfflineSetup();
  game.players = [];
  game.pendingDiscards = [];
  game.pendingRobberVictims = [];
  game.pendingAction = null;
  game.pendingActionView = null;
  game.lastRobberResult = null;
  game.pendingFreeRoads = 0;
  game.devCardSeq = 0;
  game.usedDevThisTurn = false;
  game.lastDice = null;
  resetBank();
  game.winner = null;
  game.winnerSummary = null;
  game.viewerSeatIndex = null;
  selectedAction = "road";
  renderDice();
  hideModal();
  logEl.replaceChildren();
  setupBoard();
  render();
}

function guideFor() {
  if (isOnlineEnded()) return ["게임 종료", onlineEndReasonMessage(onlineSession.state?.endReason)];
  if (isOnlineInitialSetup()) {
    const name = onlineSetupPlayerName();
    if (!isMyOnlineInitialSetupTurn()) return ["초기 배치", `${name}님의 초기 배치 차례입니다.`];
    if (disconnectedOnlinePlayers().length) return ["재접속 대기", "끊긴 참가자가 돌아올 때까지 초기 배치를 진행할 수 없습니다."];
    if (game.pendingSettlement === null) return ["초기 배치", `${name}: 마을을 놓으세요.`];
    return ["초기 배치", `${name}: 방금 놓은 마을과 연결된 도로를 놓으세요.`];
  }
  if (isOnlinePlayPhase()) {
    const name = currentPlayer()?.name || "플레이어";
    if (!isMyOnlineTurn()) return ["상대 차례", `${name}님의 차례입니다.`];
    if (disconnectedOnlinePlayers().length) return ["재접속 대기", "끊긴 참가자가 돌아올 때까지 진행할 수 없습니다."];
    if (!game.rolled) return ["내 차례", "주사위를 굴리세요."];
    return ["내 차례", "서버 주사위 결과가 반영되었습니다. 턴을 넘길 수 있습니다."];
  }
  if (!currentPlayer()) return ["대기 중", "3~4명 닉네임을 입력하고 게임을 시작하세요."];
  if (game.winner !== null) return ["게임 종료", `${game.players[game.winner].name} 승리입니다.${winnerVictoryDevText()} 새 게임을 시작할 수 있습니다.`];
  if (game.phase === "setup1" || game.phase === "setup2") {
    return ["초기 배치", `${currentPlayer().name}: 마을을 놓은 뒤, 그 마을과 붙은 도로를 놓으세요. 두 번째 배치의 마을에서 시작 자원을 받습니다.`];
  }
  if (selectedAction === "discard") return ["카드 버리기", "8장 이상 보유자는 버릴 자원을 직접 선택해야 합니다. 모두 완료하면 도둑을 옮길 수 있습니다."];
  if (selectedAction === "robber") return ["도둑 이동", "도둑을 다른 타일로 옮기세요. 인접한 상대가 있으면 자원 1장을 가져옵니다."];
  if (selectedAction === "robberVictim") return ["약탈 대상 선택", "도둑이 놓인 지형에 인접한 상대 중 자원 1장을 가져올 대상을 선택하세요."];
  if (selectedAction === "roadBuilding") return ["도로 건설 카드", `무료 도로 ${game.pendingFreeRoads}개를 더 놓으세요.`];
  if (!game.rolled) return ["주사위 또는 개발 카드", "주사위를 굴리세요. 이전 턴에 산 기사 카드는 굴리기 전에도 사용할 수 있습니다."];
  return ["건설/교환", "도로, 마을, 도시, 개발 카드, 은행/항구 교환, 플레이어 교환을 할 수 있습니다. 끝나면 턴 넘기기를 누르세요."];
}

function drawTile(tile) {
  const group = createSvg("g");
  const isRolledTile = game.lastDice?.total !== 7 && tile.number === game.lastDice?.total;
  const isBlockedRoll = isRolledTile && tile.id === robberTile;
  const hasRobber = tile.id === robberTile;
  const isRobberTarget = selectedAction === "robber" && tile.id !== robberTile;
  const className = [`hex`, tile.type, hasRobber ? "robber-occupied" : "", isRolledTile ? "rolled" : "", isBlockedRoll ? "blocked-roll" : "", isRobberTarget ? "robber-target" : ""].filter(Boolean).join(" ");
  const poly = createSvg("polygon", { class: className, "data-tile-id": tile.id, points: tile.corners.map((p) => `${p.x},${p.y}`).join(" ") });
  poly.addEventListener("click", () => {
    if (selectedAction === "robber") moveRobber(tile.id);
  });
  group.append(poly);
  group.append(drawTileTexture(tile));
  if (hasRobber) group.append(drawRobberOverlay(tile));
  const name = tile.type === "desert" ? "사막" : RESOURCES[tile.type].name;
  const label = createSvg("text", { x: tile.x, y: tile.y - 24, class: "tile-name" });
  label.textContent = name;
  group.append(label);
  if (tile.number) {
    group.append(drawNumberToken(tile, isRolledTile, isBlockedRoll));
  }
  svg.append(group);
}

function drawNumberToken(tile, isRolledTile, isBlockedRoll) {
  const isHot = tile.number === 6 || tile.number === 8;
  const className = [
    "number-token",
    isHot ? "hot" : "",
    isRolledTile ? "rolled" : "",
    isBlockedRoll ? "blocked-roll" : ""
  ].filter(Boolean).join(" ");
  const group = createSvg("g", { class: className, transform: `translate(${tile.x} ${tile.y + 8})` });
  group.append(createSvg("circle", { class: "number-token-shadow", cx: 0, cy: 3, r: 25 }));
  group.append(createSvg("circle", { class: "number-token-base", cx: 0, cy: 0, r: 24 }));
  group.append(createSvg("circle", { class: "number-token-inner", cx: 0, cy: 0, r: 17 }));
  group.append(createSvg("path", { class: "number-token-shine", d: "M-12,-10 C-5,-16 7,-16 14,-8" }));
  const pips = pipCountForNumber(tile.number);
  if (pips) {
    const gap = 5.2;
    const start = -((pips - 1) * gap) / 2;
    for (let i = 0; i < pips; i++) {
      group.append(createSvg("circle", { class: "number-token-pip", cx: start + i * gap, cy: 15, r: 1.8 }));
    }
  }
  const text = createSvg("text", { x: 0, y: -1, class: "number-text" });
  text.textContent = tile.number;
  group.append(text);
  if (isBlockedRoll || tile.id === robberTile) {
    group.append(createSvg("circle", { class: "number-token-blocker", cx: 0, cy: 0, r: 20 }));
    group.append(createSvg("path", { class: "number-token-x", d: "M-9,-9 L9,9 M9,-9 L-9,9" }));
  }
  return group;
}

function pipCountForNumber(number) {
  return { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 }[number] || 0;
}

function insetPoint(point, tile, amount = 0.82) {
  return {
    x: tile.x + (point.x - tile.x) * amount,
    y: tile.y + (point.y - tile.y) * amount
  };
}

function drawTileTexture(tile) {
  const group = createSvg("g", { class: `tile-texture tile-texture-${tile.type}` });
  const innerCorners = tile.corners.map((corner) => insetPoint(corner, tile, 0.8));
  group.append(createSvg("polygon", { class: "tile-inner-shade", points: innerCorners.map((p) => `${p.x},${p.y}`).join(" ") }));
  group.append(createSvg("polygon", { class: "tile-inner-line", points: innerCorners.map((p) => `${p.x},${p.y}`).join(" ") }));

  if (tile.type === "forest") {
    [-26, 0, 26].forEach((offset, index) => {
      group.append(createSvg("path", { class: "tile-texture-stroke", d: `M${tile.x + offset},${tile.y + 35} L${tile.x + offset - 12},${tile.y + 10} L${tile.x + offset},${tile.y - 20} L${tile.x + offset + 12},${tile.y + 10} Z` }));
      group.append(createSvg("line", { class: "tile-texture-fine", x1: tile.x + offset, y1: tile.y - 13, x2: tile.x + offset, y2: tile.y + 32 }));
    });
  } else if (tile.type === "field") {
    [-24, -8, 8, 24].forEach((offset) => {
      group.append(createSvg("path", { class: "tile-texture-fine", d: `M${tile.x + offset},${tile.y + 40} C${tile.x + offset - 10},${tile.y + 14} ${tile.x + offset + 10},${tile.y - 8} ${tile.x + offset},${tile.y - 34}` }));
    });
  } else if (tile.type === "pasture") {
    [-30, -8, 16].forEach((offset) => {
      group.append(createSvg("path", { class: "tile-texture-fine", d: `M${tile.x + offset - 14},${tile.y + 18} C${tile.x + offset - 2},${tile.y + 4} ${tile.x + offset + 14},${tile.y + 4} ${tile.x + offset + 26},${tile.y + 18}` }));
    });
  } else if (tile.type === "hill") {
    [-22, 12].forEach((offset) => {
      group.append(createSvg("path", { class: "tile-texture-stroke", d: `M${tile.x + offset - 34},${tile.y + 30} C${tile.x + offset - 14},${tile.y - 8} ${tile.x + offset + 18},${tile.y - 8} ${tile.x + offset + 36},${tile.y + 30}` }));
    });
  } else if (tile.type === "mountain") {
    group.append(createSvg("path", { class: "tile-texture-stroke", d: `M${tile.x - 44},${tile.y + 34} L${tile.x - 16},${tile.y - 34} L${tile.x + 4},${tile.y + 8} L${tile.x + 24},${tile.y - 28} L${tile.x + 48},${tile.y + 34}` }));
    group.append(createSvg("path", { class: "tile-texture-fine", d: `M${tile.x - 16},${tile.y - 28} L${tile.x - 6},${tile.y - 4} L${tile.x - 20},${tile.y + 2}` }));
  } else if (tile.type === "desert") {
    [-28, 2, 30].forEach((offset) => {
      group.append(createSvg("path", { class: "tile-texture-fine", d: `M${tile.x + offset - 24},${tile.y + 12} C${tile.x + offset - 10},${tile.y + 4} ${tile.x + offset + 12},${tile.y + 4} ${tile.x + offset + 26},${tile.y + 12}` }));
    });
  }

  return group;
}

function drawRobberOverlay(tile) {
  const group = createSvg("g", { class: `robber-overlay ${selectedAction === "robber" ? "moving" : ""}` });
  group.append(createSvg("polygon", { class: "robber-overlay-wash", points: tile.corners.map((p) => `${p.x},${p.y}`).join(" ") }));
  group.append(createSvg("circle", { class: "robber-overlay-ring", cx: tile.x, cy: tile.y + 8, r: 34 }));
  tile.corners.forEach((corner) => {
    const start = {
      x: corner.x * 0.9 + tile.x * 0.1,
      y: corner.y * 0.9 + tile.y * 0.1
    };
    const end = {
      x: corner.x * 0.56 + tile.x * 0.44,
      y: corner.y * 0.56 + tile.y * 0.44
    };
    group.append(createSvg("path", { class: "robber-overlay-spoke", d: `M${start.x},${start.y} L${end.x},${end.y}` }));
  });
  tile.corners.forEach((corner) => {
    const mark = {
      x: corner.x * 0.72 + tile.x * 0.28,
      y: corner.y * 0.72 + tile.y * 0.28
    };
    group.append(createSvg("circle", { class: "robber-overlay-node", cx: mark.x, cy: mark.y, r: 4.5 }));
  });
  return group;
}

function drawRobber() {
  if (selectedAction !== "robber") return;
  const tile = tiles[robberTile];
  if (!tile) return;
  const group = createSvg("g", {
    class: "robber-token draggable",
    transform: `translate(${tile.x} ${tile.y + 38})`,
    "aria-label": "해적"
  });
  group.append(createSvg("ellipse", { class: "robber-token-shadow", cx: 0, cy: 28, rx: 21, ry: 7 }));
  group.append(createSvg("path", { class: "robber-cloak", d: "M-20,24 C-17,7 -12,-6 0,-6 C12,-6 17,7 20,24 Z" }));
  group.append(createSvg("circle", { class: "robber-head", cx: 0, cy: -13, r: 12 }));
  group.append(createSvg("path", { class: "robber-hood", d: "M-15,-11 C-12,-25 12,-25 15,-11 C9,-16 -9,-16 -15,-11 Z" }));
  group.append(createSvg("rect", { class: "robber-mask", x: -12, y: -15, width: 24, height: 8, rx: 4 }));
  group.append(createSvg("circle", { class: "robber-eye", cx: -5, cy: -11, r: 1.6 }));
  group.append(createSvg("circle", { class: "robber-eye", cx: 5, cy: -11, r: 1.6 }));
  group.append(createSvg("path", { class: "robber-highlight", d: "M-8,6 C-5,0 5,0 8,6" }));
  group.addEventListener("pointerdown", startRobberDrag);
  group.addEventListener("pointermove", moveRobberDrag);
  group.addEventListener("pointerup", endRobberDrag);
  group.addEventListener("pointercancel", endRobberDrag);
  svg.append(group);
}

function drawEdges() {
  const player = currentPlayer();
  edges.forEach((edge) => {
    const a = vertices[edge.a];
    const b = vertices[edge.b];
    const setup = game.phase === "setup1" || game.phase === "setup2";
    const placingRoad = selectedAction === "road" || selectedAction === "roadBuilding";
    const canPlace = isOnlineInitialSetup()
      ? canPlaceOnlineInitialRoad(edge.id)
      : isOnlinePlayPhase()
        ? (selectedAction === "roadBuilding" ? canPlaceOnlineFreeRoad(edge.id) : canBuildOnlineRoad(edge.id))
        : player && placingRoad && (setup || canTakePostRollAction() || selectedAction === "roadBuilding") && canBuildRoad(player.id, edge.id, setup);
    const visible = createSvg("line", { class: "edge-visible", x1: a.x, y1: a.y, x2: b.x, y2: b.y });

    if (edge.owner !== null) {
      svg.append(drawRoadPiece(edge, game.players[edge.owner].color));
      return;
    }

    if (canPlace) {
      visible.classList.add("buildable");
      svg.append(drawRoadHint(edge));
    }

    const hit = drawRoadTarget(edge);
    hit.addEventListener("click", () => {
      if (selectedAction !== "road" && selectedAction !== "roadBuilding") return;
      if (isOnlineInitialSetup()) {
        placeOnlineInitialRoad(edge.id);
        return;
      }
      if (isOnlinePlayPhase()) {
        if (selectedAction === "roadBuilding") placeOnlineFreeRoad(edge.id);
        else buildOnlineRoad(edge.id);
        return;
      }
      if (buildRoad(player, edge.id, setup)) {
        if (setup) {
          setupStepComplete();
          selectedAction = game.phase === "play" ? "road" : "settlement";
        }
        render();
      }
    });
    svg.append(visible, hit);
  });
}

function edgeTransform(edge) {
  const a = vertices[edge.a];
  const b = vertices[edge.b];
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  return { midX, midY, length, angle };
}

function drawRoadPiece(edge, color) {
  const { midX, midY, length, angle } = edgeTransform(edge);
  const group = createSvg("g", {
    class: "road-token",
    transform: `translate(${midX} ${midY}) rotate(${angle})`
  });
  const shadow = createSvg("rect", {
    class: "road-token-shadow",
    x: -length * 0.34,
    y: -9,
    width: length * 0.68,
    height: 18,
    rx: 8,
    fill: color
  });
  const body = createSvg("rect", {
    class: "road-token-body",
    x: -length * 0.34,
    y: -7,
    width: length * 0.68,
    height: 14,
    rx: 7,
    fill: color
  });
  const shine = createSvg("rect", {
    class: "road-token-shine",
    x: -length * 0.24,
    y: -5,
    width: length * 0.24,
    height: 4,
    rx: 2,
    fill: color
  });
  group.append(shadow, body, shine);
  return group;
}

function drawRoadHint(edge) {
  const { midX, midY, length, angle } = edgeTransform(edge);
  const group = createSvg("g", {
    class: "road-hint",
    transform: `translate(${midX} ${midY}) rotate(${angle})`
  });
  group.append(createSvg("rect", {
    x: -length * 0.29,
    y: -6,
    width: length * 0.58,
    height: 12,
    rx: 6
  }));
  return group;
}

function drawRoadTarget(edge) {
  const { midX, midY, length, angle } = edgeTransform(edge);
  return createSvg("rect", {
    class: "road-target",
    x: -length * 0.44,
    y: -18,
    width: length * 0.88,
    height: 36,
    rx: 16,
    transform: `translate(${midX} ${midY}) rotate(${angle})`
  });
}

function drawVertices() {
  const player = currentPlayer();
  vertices.forEach((vertex) => {
    const setup = game.phase === "setup1" || game.phase === "setup2";
    const node = vertex.owner === null ? createOpenVertex(vertex) : createBuilding(vertex);
    if (isOnlineInitialSetup()) {
      if (canPlaceOnlineInitialSettlement(vertex.id)) node.classList.add("buildable");
    } else if (isOnlinePlayPhase()) {
      if (canBuildOnlineSettlement(vertex.id) || canBuildOnlineCity(vertex.id)) node.classList.add("buildable");
    } else if (player && selectedAction === "settlement" && (setup || canTakePostRollAction()) && canBuildSettlement(player.id, vertex.id, setup)) {
      node.classList.add("buildable");
    }
    if (!isOnlinePlayPhase() && player && selectedAction === "city" && canTakePostRollAction() && vertex.owner === player.id && !vertex.city) node.classList.add("buildable");
    node.addEventListener("click", () => {
      if (isOnlineInitialSetup()) {
        if (selectedAction === "settlement") placeOnlineInitialSettlement(vertex.id);
        return;
      }
      if (isOnlinePlayPhase()) {
        if (selectedAction === "settlement") buildOnlineSettlement(vertex.id);
        else if (selectedAction === "city") buildOnlineCity(vertex.id);
        return;
      }
      if (selectedAction === "settlement" && buildSettlement(player, vertex.id, setup)) {
        selectedAction = "road";
        render();
      } else if (selectedAction === "city" && game.phase === "play" && buildCity(player, vertex.id)) {
        render();
      }
    });
    svg.append(node);
  });
}

function createOpenVertex(vertex) {
  return createSvg("circle", { class: "vertex", cx: vertex.x, cy: vertex.y, r: 9 });
}

function createBuilding(vertex) {
  const owner = game.players[vertex.owner];
  const ownerColor = owner.color;
  const group = createSvg("g", {
    class: `vertex building ${vertex.city ? "city-piece" : "settlement-piece"}`,
    transform: `translate(${vertex.x} ${vertex.y})`
  });
  group.dataset.vertex = vertex.id;

  if (vertex.city) {
    const badge = createSvg("circle", { class: "building-badge city-badge", cx: 0, cy: 0, r: 24, fill: ownerColor });
    const face = createSvg("circle", { class: "building-face", cx: 0, cy: 0, r: 18 });
    const icon = drawModernCityIcon(ownerColor);
    const shine = createSvg("path", { class: "building-badge-shine", d: "M-10,-16 C-4,-20 6,-20 12,-14" });
    group.append(badge, face, icon, shine);
  } else {
    const badge = createSvg("circle", { class: "building-badge settlement-badge", cx: 0, cy: 0, r: 19, fill: ownerColor });
    const face = createSvg("circle", { class: "building-face", cx: 0, cy: 0, r: 14 });
    const icon = drawModernSettlementIcon(ownerColor);
    const shine = createSvg("path", { class: "building-badge-shine", d: "M-8,-12 C-3,-15 5,-15 10,-10" });
    group.append(badge, face, icon, shine);
  }

  return group;
}

function drawModernSettlementIcon(color) {
  const group = createSvg("g", { class: "building-icon settlement-icon" });
  group.append(createSvg("path", { class: "building-icon-fill", d: "M-11,1 L0,-9 L11,1 L8,1 L8,10 L-8,10 L-8,1 Z", fill: color }));
  group.append(createSvg("path", { class: "building-icon-cut", d: "M-2,10 L-2,4 L3,4 L3,10 Z" }));
  return group;
}

function drawModernCityIcon(color) {
  const group = createSvg("g", { class: "building-icon city-icon" });
  group.append(createSvg("rect", { class: "building-icon-fill", x: -12, y: -1, width: 7, height: 13, rx: 1.5, fill: color }));
  group.append(createSvg("rect", { class: "building-icon-fill", x: -3, y: -10, width: 7, height: 22, rx: 1.5, fill: color }));
  group.append(createSvg("rect", { class: "building-icon-fill", x: 6, y: -5, width: 7, height: 17, rx: 1.5, fill: color }));
  return group;
}

function renderBoard() {
  svg.replaceChildren();
  svg.append(createSvg("rect", { class: "sea", x: -60, y: -55, width: 880, height: 760 }));
  tiles.forEach(drawTile);
  drawHarbors();
  drawEdges();
  drawVertices();
  drawRobber();
}

function drawHarbors() {
  harbors.forEach((harbor) => {
    const [firstId, secondId] = harbor.vertexIds;
    const first = vertices[firstId];
    const second = vertices[secondId];
    if (!first || !second) return;
    const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    const dx = midpoint.x - CENTER.x;
    const dy = midpoint.y - CENTER.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = dx / length;
    const ny = dy / length;
    const anchorX = midpoint.x + nx * 10;
    const anchorY = midpoint.y + ny * 10;
    const dockX = midpoint.x + nx * 36;
    const dockY = midpoint.y + ny * 36;
    const tokenX = midpoint.x + nx * 64;
    const tokenY = midpoint.y + ny * 64;
    const angle = Math.atan2(ny, nx) * 180 / Math.PI;
    const group = createSvg("g", { class: `harbor harbor-${harbor.type}` });
    group.append(createSvg("line", { class: "harbor-link", x1: first.x, y1: first.y, x2: second.x, y2: second.y }));
    group.append(createSvg("line", { class: "harbor-line", x1: anchorX, y1: anchorY, x2: dockX, y2: dockY }));
    group.append(createSvg("g", { class: "harbor-dock", transform: `translate(${dockX} ${dockY}) rotate(${angle})` }));
    const dock = group.lastElementChild;
    dock.append(createSvg("rect", { class: "harbor-dock-shadow", x: -17, y: -7, width: 34, height: 14, rx: 4 }));
    dock.append(createSvg("rect", { class: "harbor-dock-plank", x: -15, y: -5, width: 30, height: 10, rx: 3 }));
    dock.append(createSvg("line", { class: "harbor-dock-mark", x1: -6, y1: -5, x2: -6, y2: 5 }));
    dock.append(createSvg("line", { class: "harbor-dock-mark", x1: 5, y1: -5, x2: 5, y2: 5 }));
    group.append(createSvg("rect", { class: "harbor-token", x: tokenX - 26, y: tokenY - 15, width: 52, height: 30, rx: 9 }));
    const text = createSvg("text", { class: "harbor-text", x: tokenX, y: tokenY });
    text.textContent = harborShortName(harbor.type);
    group.append(text);
    svg.append(group);
  });
}

function renderResourceBreakdown(player) {
  if (!player.resources) return renderResourceSummary(player);
  return Object.entries(RESOURCES)
    .map(([key, info]) => `<div class="mini-card">${info.icon}<strong>${player.resources[key]}</strong></div>`)
    .join("");
}

function renderResourceSummary(player) {
  return `<div class="mini-card summary">자원<strong>${resourceCount(player)}</strong></div>`;
}

function renderDevSummary(player) {
  const count = Array.isArray(player.dev) ? player.dev.length : Number(player.devCount || 0);
  return `<div class="mini-card summary">개발<strong>${count}</strong></div>`;
}

function renderSeats() {
  for (let i = 0; i < 4; i++) {
    const seat = document.querySelector(`#seat${i}`);
    const player = game.players[i];
    if (!player) {
      seat.className = `seat hidden ${seat.className.split(" ").find((c) => c.startsWith("seat-")) || ""}`;
      seat.replaceChildren();
      continue;
    }
    seat.classList.remove("hidden");
    seat.classList.toggle("active", i === game.active);
    seat.style.setProperty("--player-color", player.color);
    const isViewer = !isOnlinePlaying() || player.id === game.viewerSeatIndex;
    const isCurrent = i === game.active;
    seat.innerHTML = `
      <div class="seat-head">
        <i class="dot" style="background:${player.color}"></i>
        <span class="seat-name">${player.name}</span>
        <strong class="vp">${pointBadgeHtml(player, isViewer)}</strong>
      </div>
      <div class="hand">
        ${isViewer ? renderResourceBreakdown(player) : renderResourceSummary(player)}
        ${renderDevSummary(player)}
      </div>
    `;
  }
}

function renderPlayers() {
  playersList.replaceChildren();
  game.players.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = `player-row ${index === game.active ? "active" : ""}`;
    const revealHidden = !isOnlinePlaying() ? index === game.active : player.id === game.viewerSeatIndex;
    row.innerHTML = `
      <i class="dot" style="background:${player.color}"></i>
      <span>${player.name}</span>
      <b>카드 ${resourceCount(player)}장</b>
      <strong class="score-text">${pointBadgeHtml(player, revealHidden)}</strong>
    `;
    playersList.append(row);
  });
}

function infoChip(label, value, wide = false) {
  return `<div class="info-chip ${wide ? "wide" : ""}">${label}<strong>${value}</strong></div>`;
}

function renderTurnStage() {
  if (!turnStagePanel) return;
  const [title] = guideFor();
  const player = currentPlayer();
  turnStagePanel.innerHTML = [
    infoChip("단계", title),
    infoChip("라운드", game.round || "-"),
    infoChip("차례", player?.name || "-"),
    infoChip("주사위", game.rolled ? "완료" : "대기")
  ].join("");
}

function renderBankStock() {
  if (!bankStockPanel) return;
  bankStockPanel.innerHTML = Object.entries(RESOURCES)
    .map(([type, info]) => infoChip(info.name, `${game.bank[type]}장`))
    .join("");
}

function renderCostReference() {
  if (!costReferencePanel) return;
  const rows = [
    ["도로", COSTS.road],
    ["마을", COSTS.settlement],
    ["도시", COSTS.city],
    ["개발", COSTS.dev]
  ];
  costReferencePanel.innerHTML = rows.map(([label, cost]) => {
    const text = resourceBundleText(cost);
    return `<div class="cost-row"><strong>${label}</strong><span>${text}</span></div>`;
  }).join("");
}

function buildActionCost(action) {
  if (action === "road") return COSTS.road;
  if (action === "settlement") return COSTS.settlement;
  if (action === "city") return COSTS.city;
  if (action === "dev") return COSTS.dev;
  return null;
}

function buildActionPlayerForCost() {
  return isOnlinePlayPhase() ? onlineViewerGamePlayer() : currentPlayer();
}

function onlineLockedForButton() {
  return isOnlineControlledGame();
}

function buildActionDisabledReason(action) {
  const setup = game.phase === "setup1" || game.phase === "setup2";
  const cost = buildActionCost(action);
  if (isOnlinePlayPhase()) {
    if (["road", "settlement", "city"].includes(action)) {
      if (!canUseOnlineBuildCommand()) return onlineBuildBlockedMessage(action);
    } else if (action === "trade") {
      if (!canUseOnlineBankTradeCommand()) return onlineTradeBlockedMessage();
    } else if (action === "playerTrade") {
      if (!canUseOnlinePlayerTradeCommand()) return onlineTradeBlockedMessage();
    } else if (action === "dev") {
      if (!canBuyOnlineDevCard()) {
        if (!canUseOnlineTurnCommand()) return onlineTurnBlockedMessage("dev");
        if (!game.rolled) return "주사위를 굴린 뒤 사용할 수 있습니다.";
        if (hasPendingOnlineAction()) return "진행 중인 처리를 먼저 완료해야 합니다.";
        if (Number(onlineSession.state?.matchState?.devDeckCount || 0) <= 0) return "개발 카드 더미가 비었습니다.";
        return "자원이 부족합니다.";
      }
    } else if (action === "playDev") {
      if (!canUseOnlineDevCard()) return game.usedDevThisTurn ? "이번 턴에는 이미 개발 카드를 사용했습니다." : "사용 가능한 개발 카드가 없습니다.";
    } else {
      return "현재 사용할 수 없습니다.";
    }
    if (cost && !hasResources(buildActionPlayerForCost(), cost)) return "자원이 부족합니다.";
    return "";
  }

  if (onlineLockedForButton()) return "온라인 게임에서는 서버 명령만 사용할 수 있습니다.";
  if (setup) {
    if (["road", "settlement"].includes(action)) return "";
    return "초기 배치 단계에서는 사용할 수 없습니다.";
  }
  if (isResolvingForcedAction() || isBusyWithCardAction()) return "진행 중인 처리를 먼저 완료해야 합니다.";
  if (["road", "settlement", "city", "dev", "trade", "playerTrade"].includes(action) && game.phase === "play" && !game.rolled) {
    return "주사위를 굴린 뒤 사용할 수 있습니다.";
  }
  if (action === "playDev") {
    if (game.usedDevThisTurn) return "이번 턴에는 이미 개발 카드를 사용했습니다.";
    if (!canUseDevCard()) return "사용 가능한 개발 카드가 없습니다.";
  }
  if (action === "dev" && !devDeck.length) return "개발 카드 더미가 비었습니다.";
  if (cost && game.phase === "play" && !hasResources(buildActionPlayerForCost(), cost)) return "자원이 부족합니다.";
  return "";
}

function setActionButtonState(button, disabled, title = "") {
  button.disabled = Boolean(disabled);
  button.title = title || "";
}

function isBoardActionArmed() {
  if (isResolvingForcedAction() || isBusyWithCardAction()) return true;
  if (!["road", "settlement", "city"].includes(selectedAction)) return false;
  if (game.phase === "setup1" || game.phase === "setup2") return true;
  if (isOnlinePlayPhase()) return canUseOnlineBuildCommand();
  return canTakePostRollAction();
}

function canOpenBoardZoom() {
  return isMobileViewport() && !isModalOpen() && !isBoardActionArmed();
}

function renderBoardZoomButton() {
  if (!boardZoomButton) return;
  boardZoomButton.disabled = !canOpenBoardZoom();
  boardZoomButton.title = boardZoomButton.disabled
    ? "건설, 강도 이동, 진행 중 모달이 없을 때 확대 보기를 열 수 있습니다."
    : "보드를 크게 봅니다.";
}

function hideBoardZoomModal() {
  const overlay = document.querySelector(".board-zoom-overlay");
  overlay?.remove();
  document.body.classList.remove("board-zoom-open");
  renderBoardZoomButton();
}

function showBoardZoomModal() {
  if (!canOpenBoardZoom()) return;
  const existing = document.querySelector(".board-zoom-overlay");
  existing?.remove();
  const overlay = document.createElement("section");
  overlay.className = "board-zoom-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "보드 확대 보기");

  const panel = document.createElement("div");
  panel.className = "board-zoom-panel";
  const header = document.createElement("div");
  header.className = "board-zoom-head";
  const title = document.createElement("strong");
  title.textContent = "보드 확대 보기";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "닫기";
  close.addEventListener("click", hideBoardZoomModal);
  header.append(title, close);

  const viewport = document.createElement("div");
  viewport.className = "board-zoom-viewport";
  const boardClone = svg.cloneNode(true);
  boardClone.id = "boardZoomClone";
  boardClone.setAttribute("aria-hidden", "true");
  boardClone.style.pointerEvents = "none";
  viewport.append(boardClone);
  panel.append(header, viewport);
  overlay.append(panel);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) hideBoardZoomModal();
  });
  document.body.append(overlay);
  document.body.classList.add("board-zoom-open");
  close.focus();
  renderBoardZoomButton();
}

function initBoardZoom() {
  boardZoomButton?.addEventListener("click", showBoardZoomModal);
  boardWrap?.addEventListener("click", () => {
    if (canOpenBoardZoom()) showBoardZoomModal();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.querySelector(".board-zoom-overlay")) hideBoardZoomModal();
  });
  window.matchMedia?.(MOBILE_VIEWPORT_QUERY).addEventListener?.("change", () => {
    syncFloatingPanelsForViewport();
    if (!isMobileViewport()) hideBoardZoomModal();
    renderBoardZoomButton();
  });
}

function renderCurrentPlayerDevCards() {
  if (!devCardPanel) return;
  const player = currentPlayer();
  if (!player) {
    devCardPanel.innerHTML = infoChip("카드", "-", true);
    return;
  }
  if (!Array.isArray(player.dev)) {
    devCardPanel.innerHTML = infoChip("보유", `${Number(player.devCount || 0)}장`, true);
    return;
  }
  const counts = player.dev.reduce((acc, card) => {
    acc[card.type] = (acc[card.type] || 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(counts);
  if (!entries.length) {
    devCardPanel.innerHTML = infoChip("보유", "없음", true);
    return;
  }
  devCardPanel.innerHTML = entries
    .map(([type, count]) => infoChip(devCardName(type), `${count}장${usableDevCards(player).some((card) => card.type === type) ? "" : " / 대기"}`))
    .join("");
}

function renderCurrentPlayerHarbors() {
  if (!harborPanel) return;
  const player = currentPlayer();
  if (!player) {
    harborPanel.innerHTML = infoChip("항구", "-", true);
    return;
  }
  const owned = playerHarbors(player.id);
  if (!owned.length) {
    harborPanel.innerHTML = infoChip("보유", "없음", true);
    return;
  }
  harborPanel.innerHTML = owned.map((harbor) => infoChip("항구", harborName(harbor.type))).join("");
}

function renderSessionButtons() {
  const online = onlineSession.enabled;
  const status = onlineSession.state?.status || "";
  const inOnlineGameScreen = online && ["playing", "ended"].includes(status);

  if (newGameButton) {
    newGameButton.classList.toggle("hidden", online);
    newGameButton.disabled = online;
    newGameButton.title = online
      ? "온라인에서는 방을 나간 뒤 새 방을 만들어 다시 시작하세요."
      : "";
  }

  if (leaveGameRoomButton) {
    leaveGameRoomButton.classList.toggle("hidden", !inOnlineGameScreen);
    leaveGameRoomButton.disabled = !inOnlineGameScreen;
  }
}

function renderControls() {
  renderSessionButtons();
  buildButtons.forEach((button) => button.classList.toggle("active", button.dataset.action === selectedAction));
  tradeBox?.classList.toggle("hidden", true);
  const onlineLocked = isOnlineControlledGame();
  const setup = game.phase === "setup1" || game.phase === "setup2";
  rollButton.disabled = isOnlinePlayPhase()
    ? !canRollOnlineDice()
    : onlineLocked || game.phase !== "play" || game.rolled || isResolvingForcedAction() || isBusyWithCardAction() || game.winner !== null;
  endTurnButton.disabled = isOnlinePlayPhase()
    ? !canEndOnlineTurn()
    : onlineLocked || game.phase !== "play" || !game.rolled || isResolvingForcedAction() || isBusyWithCardAction() || game.winner !== null;
  buildButtons.forEach((button) => {
    const action = button.dataset.action;
    if (isOnlinePlayPhase()) {
      const onlineBuildAction = ["road", "settlement", "city"].includes(action);
      const onlineTradeAction = action === "trade";
      const onlinePlayerTradeAction = action === "playerTrade";
      const onlineBuyDevAction = action === "dev";
      const onlinePlayDevAction = action === "playDev";
      const baseDisabled = (onlineBuildAction && !canUseOnlineBuildCommand())
        || (onlineTradeAction && !canUseOnlineBankTradeCommand())
        || (onlinePlayerTradeAction && !canUseOnlinePlayerTradeCommand())
        || (onlineBuyDevAction && !canBuyOnlineDevCard())
        || (onlinePlayDevAction && !canUseOnlineDevCard())
        || (!onlineBuildAction && !onlineTradeAction && !onlinePlayerTradeAction && !onlineBuyDevAction && !onlinePlayDevAction);
      const reason = buildActionDisabledReason(action);
      setActionButtonState(button, baseDisabled || Boolean(reason), reason);
      return;
    }
    const postRollOnly = ["road", "settlement", "city", "dev", "trade", "playerTrade"].includes(action);
    const blockedByTiming = postRollOnly && game.phase === "play" && !game.rolled;
    const blockedDevUse = action === "playDev" && game.usedDevThisTurn;
    const reason = buildActionDisabledReason(action);
    setActionButtonState(
      button,
      onlineLocked || isResolvingForcedAction() || isBusyWithCardAction() || blockedByTiming || blockedDevUse || (setup && !["road", "settlement"].includes(action)) || Boolean(reason),
      reason
    );
  });
  if (tradeButton) tradeButton.disabled = onlineLocked;
  renderBoardZoomButton();
}

function renderTradeOptions() {
  if (!tradeGive || !tradeGet) return;
  const options = Object.entries(RESOURCES).map(([key, info]) => `<option value="${key}">${info.name}</option>`).join("");
  tradeGive.innerHTML = options;
  tradeGet.innerHTML = options;
  updateTradeRatioLabel();
}

function updateTradeRatioLabel() {
  if (!tradeRatioLabel) return;
  const player = currentPlayer();
  const give = tradeGive?.value || Object.keys(RESOURCES)[0];
  const ratio = player ? tradeRatioFor(player.id, give) : 4;
  tradeRatioLabel.textContent = `${ratio}장 →`;
}

function installTestHelpers() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("test") !== "1") return;

  window.__katanTest = {
    setResources(playerId, resources) {
      const player = game.players[playerId];
      if (!player) return false;
      Object.keys(RESOURCES).forEach((type) => {
        if (resources[type] !== undefined) player.resources[type] = Math.max(0, Number(resources[type]) || 0);
      });
      render();
      return true;
    },
    setBank(resources) {
      Object.keys(RESOURCES).forEach((type) => {
        if (resources[type] !== undefined) game.bank[type] = Math.max(0, Number(resources[type]) || 0);
      });
      render();
      return true;
    },
    setDevCards(playerId, cardTypes, boughtTurnOffset = -1) {
      const player = game.players[playerId];
      if (!player) return false;
      player.dev = cardTypes.map((type) => {
        const card = makeDevCard(type);
        card.boughtTurn = game.round + boughtTurnOffset;
        return card;
      });
      render();
      return true;
    },
    setDevDeck(cardTypes) {
      devDeck = [...cardTypes].reverse();
      render();
      return true;
    },
    setPhasePlay({ active = 0, rolled = false } = {}) {
      if (!game.players.length) return false;
      game.phase = "play";
      game.active = Math.max(0, Math.min(active, game.players.length - 1));
      game.rolled = Boolean(rolled);
      selectedAction = "road";
      game.pendingDiscards = [];
      game.pendingRobberVictims = [];
      game.pendingAction = null;
      game.pendingActionView = null;
      game.lastRobberResult = null;
      game.pendingFreeRoads = 0;
      render();
      return true;
    },
    forceRoll(die1, die2) {
      if (game.phase !== "play" || game.rolled || game.winner !== null) return false;
      const dice = { die1: Number(die1), die2: Number(die2), total: Number(die1) + Number(die2) };
      if (dice.die1 < 1 || dice.die1 > 6 || dice.die2 < 1 || dice.die2 > 6) return false;
      game.lastDice = dice;
      renderDice();
      game.rolled = true;
      if (dice.total === 7) {
        addLog(`${currentPlayer().name}: 주사위 ${dice.die1} + ${dice.die2} = 7.`);
        startDiscardForSeven();
      } else {
        produce(dice.total);
        addLog(`${currentPlayer().name}: 주사위 ${dice.die1} + ${dice.die2} = ${dice.total}.`);
      }
      render();
      return true;
    },
    placeSettlement(playerId, vertexId, city = false) {
      const vertex = vertices[vertexId];
      if (!vertex || !game.players[playerId]) return false;
      vertex.owner = playerId;
      vertex.city = Boolean(city);
      render();
      return true;
    },
    placeRoad(playerId, edgeId) {
      const edge = edges[edgeId];
      if (!edge || !game.players[playerId]) return false;
      edge.owner = playerId;
      render();
      return true;
    },
    getStateSummary() {
      return {
        active: game.active,
        round: game.round,
        phase: game.phase,
        rolled: game.rolled,
        selectedAction,
        lastDice: game.lastDice,
        bank: { ...game.bank },
        tiles: tiles.map((tile) => ({ id: tile.id, q: tile.q, r: tile.r, type: tile.type, number: tile.number })),
        harbors: harbors.map((harbor) => ({ id: harbor.id, type: harbor.type, vertexIds: [...harbor.vertexIds] })),
        players: game.players.map((player) => ({
          id: player.id,
          name: player.name,
          resources: { ...player.resources },
          dev: player.dev.map((card) => ({ ...card })),
          points: publicPoints(player),
          publicPoints: publicPoints(player),
          hiddenPoints: hiddenVictoryPoints(player),
          totalPoints: totalPoints(player),
          knights: player.knights,
          roads: player.roads,
          settlements: player.settlements,
          cities: player.cities
        }))
      };
    }
  };
}

function render() {
  if (!tiles.length) setupBoard();
  renderBoard();
  renderSeats();
  renderPlayers();
  renderTurnStage();
  renderDice();
  renderCurrentPlayerDevCards();
  renderBankStock();
  renderCostReference();
  renderCurrentPlayerHarbors();
  renderControls();
  const [title, text] = guideFor();
  guideTitle.textContent = title;
  guideText.textContent = text;
  currentPlayerLabel.textContent = currentPlayer()?.name || "플레이어";
  updateTradeRatioLabel();
}

buildButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (isOnlinePlayPhase()) {
      const action = button.dataset.action;
      if (action === "trade") {
        showBankTradeModal();
        render();
        return;
      }
      if (action === "playerTrade") {
        showOnlinePlayerTradeComposer();
        render();
        return;
      }
      if (action === "dev") {
        buyOnlineDevCard();
        render();
        return;
      }
      if (action === "playDev") {
        showOnlineDevCardModal();
        render();
        return;
      }
      if (!["road", "settlement", "city"].includes(action) || !canUseOnlineBuildCommand()) {
        addLog(onlineBuildBlockedMessage(action));
        render();
        return;
      }
      selectedAction = action;
      render();
      return;
    }
    if (blockOnlineGameAction()) {
      render();
      return;
    }
    if (button.dataset.action === "playDev") {
      showDevCardModal();
      render();
      return;
    }
    if (button.dataset.action === "playerTrade") {
      showPlayerTradeModal();
      render();
      return;
    }
    if (button.dataset.action === "trade") {
      showBankTradeModal();
      render();
      return;
    }
    selectedAction = button.dataset.action;
    if (selectedAction === "dev") buyDevCard();
    render();
  });
});
playerCount.addEventListener("change", updateNameFields);
startGameButton.addEventListener("click", startGame);
rollButton.addEventListener("click", roll);
endTurnButton.addEventListener("click", endTurn);
newGameButton.addEventListener("click", () => {
  if (onlineSession.enabled) {
    addLog("온라인 새 게임은 서버 명령으로만 처리됩니다. 이번 단계에서는 로컬 초기화를 실행하지 않습니다.");
    render();
    return;
  }
  resetToSetup();
});
tradeButton?.addEventListener("click", () => showBankTradeModal());
tradeGive?.addEventListener("change", updateTradeRatioLabel);
offlineModeButton?.addEventListener("click", showOfflineSetup);
onlineCreateModeButton?.addEventListener("click", () => {
  setOnlineStatus(createStatus, "");
  showSetupView(onlineCreateView);
  createNickname.focus();
});
onlineJoinModeButton?.addEventListener("click", () => {
  setOnlineStatus(joinStatus, "");
  showSetupView(onlineJoinView);
  joinRoomCode.focus();
});
backToModeFromOffline?.addEventListener("click", showModeSelect);
backToModeFromCreate?.addEventListener("click", showModeSelect);
backToModeFromJoin?.addEventListener("click", showModeSelect);
createRoomButton?.addEventListener("click", createOnlineRoom);
joinRoomButton?.addEventListener("click", joinOnlineRoom);
copyShareUrlButton?.addEventListener("click", copyShareUrl);
lobbyStartButton?.addEventListener("click", startOnlineGame);
leaveLobbyButton?.addEventListener("click", () => {
  confirmLeaveOnlineRoom();
});
leaveGameRoomButton?.addEventListener("click", () => {
  confirmLeaveOnlineRoom();
});
createNickname?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") createOnlineRoom();
});
joinNickname?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") joinOnlineRoom();
});
joinRoomCode?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") joinOnlineRoom();
});

updateNameFields();
renderTradeOptions();
initCostCardDrag();
initDicePanelDrag();
initBoardZoom();
syncFloatingPanelsForViewport();
installTestHelpers();
setupBoard();
showJoinFromUrlIfNeeded();
render();
