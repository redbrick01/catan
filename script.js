const svg = document.querySelector("#board");
const appEl = document.querySelector(".app");
const tabletop = document.querySelector(".tabletop");
const boardArea = document.querySelector(".board-area");
const topBar = document.querySelector(".top-bar");
const boardPlayerStrip = document.querySelector(".board-player-strip");
const landscapePlayerStripMount = document.querySelector("#landscapePlayerStripMount");
const landscapeDiceMount = document.querySelector("#landscapeDiceMount");
const setupScreen = document.querySelector("#setupScreen");
const playerCount = document.querySelector("#playerCount");
const nameFields = document.querySelector("#nameFields");
const startGameButton = document.querySelector("#startGameButton");
const rollButton = document.querySelector("#rollButton");
const diceHoldGauge = (() => {
  const existing = document.querySelector("#diceHoldGauge");
  if (existing) return existing;
  if (!rollButton?.parentElement) return null;
  const gauge = document.createElement("span");
  gauge.id = "diceHoldGauge";
  gauge.className = "dice-hold-gauge";
  gauge.setAttribute("aria-hidden", "true");
  gauge.innerHTML = '<span class="dice-hold-gauge-fill"></span>';
  rollButton.parentElement.insertBefore(gauge, rollButton);
  return gauge;
})();
const endTurnButton = document.querySelector("#endTurnButton");
const newGameButton = document.querySelector("#newGameButton");
const feelSettingsButton = document.querySelector("#feelSettingsButton");
const dicePanel = document.querySelector("#dicePanel");
const dieOne = document.querySelector("#dieOne");
const dieTwo = document.querySelector("#dieTwo");
const diceTotal = document.querySelector("#diceTotal");
const currentPlayerLabel = document.querySelector("#currentPlayerLabel");
const actionNoticePanel = document.querySelector("#actionNoticePanel");
const actionNoticePrev = document.querySelector("#actionNoticePrev");
const actionNoticeNext = document.querySelector("#actionNoticeNext");
const guideTitle = document.querySelector("#guideTitle");
const guideText = document.querySelector("#guideText");
const playersList = document.querySelector("#playersList");
const playersPanel = playersList?.closest(".panel-block");
const turnStagePanel = document.querySelector("#turnStagePanel");
const devCardPanel = document.querySelector("#devCardPanel");
const bankStockPanel = document.querySelector("#bankStockPanel");
const playerHandDock = document.querySelector("#playerHandDock");
const playerResourceHand = document.querySelector("#playerResourceHand");
const playerHandOwner = document.querySelector("#playerHandOwner");
const playerHandToggle = document.querySelector("#playerHandToggle");
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
const lobbyBotControls = document.querySelector("#lobbyBotControls");
const lobbyAddBotButton = document.querySelector("#lobbyAddBotButton");
const lobbyStartButton = document.querySelector("#lobbyStartButton");
const lobbyStartHint = document.querySelector("#lobbyStartHint");
const leaveLobbyButton = document.querySelector("#leaveLobbyButton");
const leaveGameRoomButton = ensureButton("leaveGameRoomButton", "방 나가기", newGameButton?.parentElement, "wide-button muted hidden");

const NS = "http://www.w3.org/2000/svg";
const SIZE = 72;
const CENTER = { x: 380, y: 320 };
const COLORS = ["#3fa7d6", "#e45757", "#f4f0e6", "#ee8c42"];
const RESOURCES = {
  forest: { name: "목재" },
  field: { name: "곡물" },
  pasture: { name: "가죽" },
  hill: { name: "벽돌" },
  mountain: { name: "광석" }
};
// Inline Tabler Icons paths, MIT license: https://tabler.io/icons
const TABLER_ICON_PATHS = {
  "alert-triangle": '<path d="M12 9v4m-1.637-9.409L2.257 17.125a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636-2.87L13.637 3.59a1.914 1.914 0 0 0-3.274 0M12 16h.01"/>',
  "building-community": '<path d="m8 9l5 5v7H8v-4m0 4H3v-7l5-5m1 1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17h-8m0-14v.01M17 7v.01M17 11v.01M17 15v.01"/>',
  "chevron-left": '<path d="m15 6l-6 6l6 6"/>',
  "chevron-right": '<path d="m9 6l6 6l-6 6"/>',
  clock: '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0"/><path d="M12 7v5l3 3"/>',
  crown: '<path d="m12 6l4 6l5 -4l-2 10H5L3 8l5 4z"/><path d="M5 21h14"/>',
  dice: '<path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path fill="currentColor" stroke="none" d="M8 8.5a.5.5 0 1 0 1 0a.5.5 0 1 0-1 0m7 7a.5.5 0 1 0 1 0a.5.5 0 1 0-1 0M11.5 12a.5.5 0 1 0 1 0a.5.5 0 1 0-1 0"/>',
  exchange: '<path d="M3 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0M17 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M19 8v5a5 5 0 0 1-5 5h-3l3-3m0 6l-3-3m-6-2v-5a5 5 0 0 1 5-5h3l-3-3m0 6l3-3"/>',
  home: '<path d="M5 12H3l9-9l9 9h-2M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/><path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6"/>',
  mask: '<path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0"/><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
  mountain: '<path d="M3 20h18L14.079 5.388a2.3 2.3 0 0 0-4.158 0z"/><path d="m7.5 11l2 2.5L12 11l2 3l2.5-2"/>',
  package: '<path d="m12 3l8 4.5v9L12 21l-8-4.5v-9zm0 9l8-4.5M12 12v9m0-9L4 7.5m12-2.25l-8 4.5"/>',
  pick: '<path d="m13 8l-9.383 9.418a2.09 2.09 0 0 0 0 2.967a2.11 2.11 0 0 0 2.976 0L16 11"/><path d="M9 3h4.586a1 1 0 0 1 .707.293l6.414 6.414a1 1 0 0 1 .293.707V15a2 2 0 1 1-4 0v-3l-5-5H9a2 2 0 1 1 0-4"/>',
  "play-card": '<path d="M19 5v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2M8 6h.01M16 18h.01"/><path d="m12 16l-3-4l3-4l3 4z"/>',
  "refresh-alert": '<path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4m-4 4a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4m-4-6v3m0 3h.01"/>',
  "robot-face": '<path d="M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2"/><path d="M9 16q1.5 1 3 1c1.5 0 2-.333 3-1M9 7L8 3m7 4l1-4m-7 9v-1m6 1v-1"/>',
  route: '<path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0-4 0M19 7a2 2 0 1 0 0-4a2 2 0 0 0 0 4m-8 12h5.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7H13"/>',
  shield: '<path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1-8.5 15A12 12 0 0 1 3.5 6A12 12 0 0 0 12 3"/><path d="M12 9v4m0 3h.01"/>',
  paw: '<path d="M14.7 13.5c-1.1 -2 -1.441 -2.5 -2.7 -2.5c-1.259 0 -1.736 .755 -2.836 2.747c-.942 1.703 -2.846 1.845 -3.321 3.291c-.097 .265 -.145 .677 -.143 .962c0 1.176 .787 2 1.8 2c1.259 0 3 -1 4.5 -1s3.241 1 4.5 1c1.013 0 1.8 -.823 1.8 -2c0 -.285 -.049 -.697 -.146 -.962c-.475 -1.451 -2.512 -1.835 -3.454 -3.538" /><path d="M20.188 8.082a1.039 1.039 0 0 0 -.406 -.082h-.015c-.735 .012 -1.56 .75 -1.993 1.866c-.519 1.335 -.28 2.7 .538 3.052c.129 .055 .267 .082 .406 .082c.739 0 1.575 -.742 2.011 -1.866c.516 -1.335 .273 -2.7 -.54 -3.052l-.001 0" /><path d="M9.474 9c.055 0 .109 0 .163 -.011c.944 -.128 1.533 -1.346 1.32 -2.722c-.203 -1.297 -1.047 -2.267 -1.932 -2.267c-.055 0 -.109 0 -.163 .011c-.944 .128 -1.533 1.346 -1.32 2.722c.204 1.293 1.048 2.267 1.933 2.267" /><path d="M16.456 6.733c.214 -1.376 -.375 -2.594 -1.32 -2.722a1.164 1.164 0 0 0 -.162 -.011c-.885 0 -1.728 .97 -1.93 2.267c-.214 1.376 .375 2.594 1.32 2.722c.054 .007 .108 .011 .162 .011c.885 0 1.73 -.974 1.93 -2.267" /><path d="M5.69 12.918c.816 -.352 1.054 -1.719 .536 -3.052c-.436 -1.124 -1.271 -1.866 -2.009 -1.866c-.14 0 -.277 .027 -.407 .082c-.816 .352 -1.054 1.719 -.536 3.052c.436 1.124 1.271 1.866 2.009 1.866c.14 0 .277 -.027 .407 -.082" />',
  shirt: '<path d="m15 4l6 2v5h-3v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8H3V6l6-2a3 3 0 0 0 6 0"/>',
  trophy: '<path d="M8 21h8m-4-4v4M7 4h10m0 0v8a5 5 0 0 1-10 0V4M3 9a2 2 0 1 0 4 0a2 2 0 1 0-4 0m14 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/>',
  urgent: '<path d="M8 16v-4a4 4 0 0 1 8 0v4M3 12h1m8-9v1m8 8h1M5.6 5.6l.7.7m12.1-.7l-.7.7M6 17a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/>',
  "user-check": '<path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0M6 21v-2a4 4 0 0 1 4-4h4m1 4l2 2l4-4"/>',
  wheat: '<path d="M12.014 21.514v-3.75M5.93 9.504l-.43 1.604a4.986 4.986 0 0 0 3.524 6.105q1.495.402 2.99.801v-3.44a4.98 4.98 0 0 0-3.676-4.426z"/><path d="M13.744 11.164a4.9 4.9 0 0 0 1.433-3.46a4.88 4.88 0 0 0-1.433-3.46l-1.73-1.73l-1.73 1.73a4.9 4.9 0 0 0-1.433 3.46a4.9 4.9 0 0 0 1.433 3.46"/><path d="m18.099 9.504l.43 1.604a4.986 4.986 0 0 1-3.525 6.105l-2.99.801v-3.44a4.98 4.98 0 0 1 3.677-4.426z"/>',
  wall: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm0 2h16m0 4H4m0 4h16M9 4v4m5 0v4m-6 0v4m8-4v4m-5 0v4"/>',
  wood: '<path d="M6 5.5a6 2.5 0 1 0 12 0a6 2.5 0 1 0-12 0"/><path d="M18 5.5v4.626a1.415 1.415 0 0 1 1.683 2.18l-.097.108L18 14v4c0 1.61-2.54 2.925-5.725 3H12c-3.314 0-6-1.343-6-3v-2l-1.586-1.586A1.414 1.414 0 0 1 6 12.127V5.5m4 7V14m4 2v1"/>'
};
const ICON_TOKENS = {
  resource: {
    forest: { icon: "wood", label: RESOURCES.forest.name },
    field: { icon: "wheat", label: RESOURCES.field.name },
    pasture: { icon: "paw", label: RESOURCES.pasture.name },
    hill: { icon: "wall", label: RESOURCES.hill.name },
    mountain: { icon: "pick", label: RESOURCES.mountain.name },
    generic: { icon: "package", label: "자원" }
  },
  action: {
    road: { icon: "route", label: "도로" },
    settlement: { icon: "home", label: "마을" },
    city: { icon: "building-community", label: "도시" },
    devCard: { icon: "play-card", label: "개발 카드" },
    trade: { icon: "exchange", label: "교환" },
    dice: { icon: "dice", label: "주사위" },
    robber: { icon: "mask", label: "도둑" }
  },
  status: {
    myTurn: { icon: "user-check", label: "내 차례" },
    pending: { icon: "urgent", label: "행동 필요" },
    connection: { icon: "refresh-alert", label: "연결/재접속" },
    error: { icon: "alert-triangle", label: "오류/경고" },
    victory: { icon: "trophy", label: "승리" },
    waiting: { icon: "clock", label: "대기" },
    bot: { icon: "robot-face", label: "봇" }
  }
};
const ACTION_ICON_BY_BUTTON = {
  road: "road",
  settlement: "settlement",
  city: "city",
  dev: "devCard",
  playDev: "devCard",
  trade: "trade",
  playerTrade: "trade"
};
const ACTION_LABEL_BY_BUTTON = {
  road: "도로",
  settlement: "마을",
  city: "도시",
  dev: "개발 카드",
  playDev: "카드 사용",
  trade: "교환",
  playerTrade: "플레이어 교환"
};
const DEV_CARD_ICON_BY_TYPE = {
  knight: "shield",
  victory: "trophy",
  roadBuilding: "route",
  yearPlenty: "wheat",
  monopoly: "crown"
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
  lastRobberResultId: null,
  playLogRoomId: null,
  noticeQueue: [],
  activeNoticeKey: null,
  diceRollPending: false
};
let shownVictoryModalKey = null;
const ONLINE_IDENTITY_KEY = "catanOnlineIdentity";
const REQUEST_TIMEOUT_MS = 8000;
const MOBILE_VIEWPORT_QUERY = "(max-width: 780px) and (orientation: portrait)";
const LANDSCAPE_PANEL_QUERY = "(max-width: 1150px) and (orientation: landscape)";
const FEEL_SETTINGS_STORAGE_KEY = "catanFeelSettings";
const DEFAULT_FEEL_SETTINGS = {
  schemaVersion: 1,
  motionMode: "auto",
  soundEnabled: false,
  soundVolume: 60,
  turnSoundEnabled: true,
  importantEventSoundEnabled: true,
  turnEmphasis: "normal",
  importantEventEmphasis: true
};
const SOUND_EVENT_MAP = {
  turnChanged: { asset: "turn-bell", category: "turn", volumeScale: 0.82, setting: "turnSoundEnabled" },
  diceRolled: { asset: "dice-roll", category: "dice", volumeScale: 0.9 },
  resourcesProduced: { asset: "resource-gain", category: "resource", volumeScale: 0.86 },
  blockedProduction: { asset: "blocked-soft", category: "alert", volumeScale: 0.78 },
  buildCompleted: { asset: "build-success", category: "action", volumeScale: 0.9 },
  bankTradeCompleted: { asset: "trade-success", category: "action", volumeScale: 0.86 },
  playerTradeCompleted: { asset: "trade-success", category: "action", volumeScale: 0.86 },
  devCardBought: { asset: "card-flip", category: "card", volumeScale: 0.82 },
  devCardPlayed: { asset: "card-play", category: "card", volumeScale: 0.9 },
  sevenRolled: { asset: "robber-alert", category: "alert", volumeScale: 1, setting: "importantEventSoundEnabled" },
  discardPendingStarted: { asset: "robber-alert", category: "alert", volumeScale: 0.72, setting: "importantEventSoundEnabled" },
  robberMovePendingStarted: { asset: "robber-alert", category: "alert", volumeScale: 0.72, setting: "importantEventSoundEnabled" },
  robberVictimPendingStarted: { asset: "robber-alert", category: "alert", volumeScale: 0.72, setting: "importantEventSoundEnabled" },
  robberMoved: { asset: "robber-move", category: "robber", volumeScale: 0.86, setting: "importantEventSoundEnabled" },
  robberResult: { asset: "robber-result", category: "robber", volumeScale: 0.9, setting: "importantEventSoundEnabled" },
  winnerDeclared: { asset: "win-fanfare", category: "victory", volumeScale: 1, setting: "importantEventSoundEnabled" },
  commandRejected: { asset: "error-soft", category: "error", volumeScale: 0.75, setting: "importantEventSoundEnabled" }
};
const SOUND_ASSET_KEYS = [
  "turn-bell",
  "dice-roll",
  "dice-release",
  "dice-settle",
  "resource-gain",
  "card-gain",
  "build-success",
  "trade-success",
  "card-flip",
  "card-play",
  "robber-alert",
  "robber-move",
  "robber-result",
  "blocked-soft",
  "error-soft",
  "win-fanfare"
];
const SOUND_ASSET_MANIFEST = {
  "dice-roll": "assets/audio/dice/dice-10.wav",
  "dice-release": "assets/audio/dice/dice-11.wav",
  "dice-settle": "assets/audio/dice/dice-4.wav"
};

let offlineActionCounter = 0;
let offlineCueScopeId = `offline-${Date.now().toString(36)}`;
const responsivePanelRuntime = {
  playerStripHome: null,
  dicePanelHome: null,
  movedToLandscapePanel: false
};
const actionNoticeRuntime = {
  key: null,
  title: "",
  text: "",
  timeoutId: null,
  history: [],
  index: -1,
  maxHistory: 20
};
let activeScoreTooltipPlayerId = null;
const rollHoldState = {
  pointerId: null,
  startedAt: 0,
  lastHoldMs: 0,
  lastStartedAt: 0,
  awaitingClick: false,
  releaseCleanupTimer: null,
  motionState: "idle"
};
const diceTotalRevealState = {
  rollKey: "",
  visible: false,
  settlePlayed: false,
  cueEmitted: false,
  timer: null
};
const audioRuntime = {
  context: null,
  unlocked: false,
  ready: false,
  backend: "none",
  loadedAssets: {},
  activeSounds: {},
  lastError: null
};
const actionFeedbackRuntime = {
  recent: new Map(),
  ttlMs: 900
};
let playerHandExpanded = false;
let playerHandMetricFrame = null;

// FEEL-000 foundation: shared cue helpers for visual, sound, log, and toast feedback.
const feelCueRuntime = {
  playedCueKeys: new Map(),
  maxPlayedKeys: 500,
  hydrateSuppression: new Map()
};

function makeCueKey(scopeId, revision, eventType, entityId = "global", detailKey = "default") {
  return [scopeId, revision, eventType, entityId, detailKey]
    .map((part) => String(part ?? "none").replace(/\s+/g, "_"))
    .join(":");
}

function makeCueScopeId() {
  return onlineSession?.roomId || offlineCueScopeId;
}

function resetOfflineCueScope() {
  offlineActionCounter = 0;
  offlineCueScopeId = `offline-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  resetPlayedCueKeys();
}

function nextOfflineCueRevision() {
  offlineActionCounter += 1;
  return offlineActionCounter;
}

function resetPlayedCueKeys(scopeId = null) {
  if (!scopeId) {
    feelCueRuntime.playedCueKeys.clear();
    return;
  }
  const prefix = `${scopeId}:`;
  [...feelCueRuntime.playedCueKeys.keys()]
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => feelCueRuntime.playedCueKeys.delete(key));
}

function hasPlayedCue(key) {
  return feelCueRuntime.playedCueKeys.has(key);
}

function markCuePlayed(key, result = {}) {
  feelCueRuntime.playedCueKeys.set(key, {
    result,
    playedAt: Date.now()
  });
  while (feelCueRuntime.playedCueKeys.size > feelCueRuntime.maxPlayedKeys) {
    const firstKey = feelCueRuntime.playedCueKeys.keys().next().value;
    feelCueRuntime.playedCueKeys.delete(firstKey);
  }
}

function suppressHydrateCueScope(scopeId, revision) {
  if (!scopeId) return;
  feelCueRuntime.hydrateSuppression.set(scopeId, Number(revision) || 0);
}

function isHydrateCueSuppressed(scopeId, revision) {
  if (!scopeId) return false;
  const suppressedRevision = feelCueRuntime.hydrateSuppression.get(scopeId);
  return Number.isFinite(suppressedRevision) && Number(revision) <= suppressedRevision;
}

function makeRawCueCandidate(type, data = {}) {
  const scopeId = data.scopeId || makeCueScopeId();
  const revision = Number(data.revision ?? onlineSession?.revision ?? offlineActionCounter);
  const entityId = data.entityId ?? data.seatIndex ?? "global";
  const detailKey = data.detailKey ?? "default";
  return {
    type,
    eventType: data.eventType || type,
    scopeId,
    revision,
    entityId,
    detailKey,
    visibility: data.visibility || "public",
    viewerRole: data.viewerRole || null,
    source: data.source || "stateDelta",
    debugLabel: data.debugLabel || type,
    payload: data.payload || {},
    channels: {
      visual: data.channels?.visual !== false,
      sound: Boolean(data.channels?.sound),
      log: Boolean(data.channels?.log),
      toast: Boolean(data.channels?.toast)
    }
  };
}

function sanitizeCueForViewer(rawCue, viewerState = {}) {
  if (!rawCue) return null;
  const viewerSeatIndex = viewerState.viewerSeatIndex ?? game.viewerSeatIndex ?? null;
  const cue = {
    ...rawCue,
    payload: { ...(rawCue.payload || {}) },
    channels: { ...(rawCue.channels || {}) }
  };

  if (cue.visibility === "viewerOnly" && cue.payload.viewerSeatIndex !== viewerSeatIndex) {
    return null;
  }

  if (cue.type === "resourcesProduced" && cue.payload.seatIndex !== viewerSeatIndex) {
    delete cue.payload.resourceType;
    delete cue.payload.resourceTypes;
    cue.payload.cardDelta = Number(cue.payload.cardDelta ?? cue.payload.amount ?? 0);
  }

  if (cue.type === "robberResult") {
    const canSeeResource = viewerSeatIndex === cue.payload.actorSeatIndex || viewerSeatIndex === cue.payload.victimSeatIndex;
    cue.viewerRole = canSeeResource
      ? (viewerSeatIndex === cue.payload.actorSeatIndex ? "actor" : "victim")
      : "observer";
    if (!canSeeResource) {
      delete cue.payload.resourceType;
      cue.payload.generic = true;
    }
  }

  if (cue.type === "devCardBought") {
    delete cue.payload.cardType;
    delete cue.payload.devCardType;
    cue.payload.cardDelta = Number(cue.payload.cardDelta ?? 1);
  }

  cue.key = cue.key || makeCueKey(cue.scopeId, cue.revision, cue.eventType || cue.type, cue.entityId, cue.detailKey);
  return cue;
}

function shouldPlayCue(cue, settings = DEFAULT_FEEL_SETTINGS, viewerState = {}) {
  if (!cue?.key) return false;
  if (hasPlayedCue(cue.key)) return false;
  if (viewerState.isHydrating || isHydrateCueSuppressed(cue.scopeId, cue.revision)) return false;
  return true;
}

function runCueChannel(channel, cue) {
  try {
    if (channel === "visual") return "skipped";
    if (channel === "sound") return playSoundCue(cue);
    if (channel === "log" && cue.payload?.logText) {
      addLog(cue.payload.logText, cue.payload.logType || "system");
      return "played";
    }
    if (channel === "toast") return "skipped";
    return "skipped";
  } catch (error) {
    return "failed";
  }
}

function emitGameCue(rawCue, options = {}) {
  const viewerState = {
    viewerSeatIndex: game.viewerSeatIndex,
    isHydrating: Boolean(options.isHydrating),
    ...(options.viewerState || {})
  };
  const cue = sanitizeCueForViewer(rawCue, viewerState);
  if (!cue) return { played: false, reason: "not-visible" };
  if (!shouldPlayCue(cue, options.settings || DEFAULT_FEEL_SETTINGS, viewerState)) {
    return { played: false, reason: "suppressed", key: cue.key };
  }
  const result = {};
  ["visual", "sound", "log", "toast"].forEach((channel) => {
    if (!cue.channels?.[channel]) {
      result[channel] = "skipped";
      return;
    }
    result[channel] = runCueChannel(channel, cue);
  });
  markCuePlayed(cue.key, result);
  return { played: true, key: cue.key, result, cue };
}

const dispatchGameCue = emitGameCue;

function enumValue(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function sanitizeFeelSettings(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const sourceVolume = Number(source.soundVolume);
  return {
    ...DEFAULT_FEEL_SETTINGS,
    schemaVersion: DEFAULT_FEEL_SETTINGS.schemaVersion,
    motionMode: enumValue(source.motionMode, ["auto", "reduced", "on"], DEFAULT_FEEL_SETTINGS.motionMode),
    soundEnabled: Boolean(source.soundEnabled),
    soundVolume: Number.isFinite(sourceVolume) ? clamp(sourceVolume, 0, 100) : DEFAULT_FEEL_SETTINGS.soundVolume,
    turnSoundEnabled: source.turnSoundEnabled === undefined ? DEFAULT_FEEL_SETTINGS.turnSoundEnabled : Boolean(source.turnSoundEnabled),
    importantEventSoundEnabled: source.importantEventSoundEnabled === undefined ? DEFAULT_FEEL_SETTINGS.importantEventSoundEnabled : Boolean(source.importantEventSoundEnabled),
    turnEmphasis: enumValue(source.turnEmphasis, ["normal", "strong"], DEFAULT_FEEL_SETTINGS.turnEmphasis),
    importantEventEmphasis: source.importantEventEmphasis === undefined ? DEFAULT_FEEL_SETTINGS.importantEventEmphasis : Boolean(source.importantEventEmphasis)
  };
}

function loadFeelSettings() {
  try {
    const raw = localStorage.getItem(FEEL_SETTINGS_STORAGE_KEY);
    if (!raw) return sanitizeFeelSettings(DEFAULT_FEEL_SETTINGS);
    return sanitizeFeelSettings(JSON.parse(raw));
  } catch (error) {
    return sanitizeFeelSettings(DEFAULT_FEEL_SETTINGS);
  }
}

function saveFeelSettings(settings) {
  const next = sanitizeFeelSettings(settings);
  currentFeelSettings = next;
  try {
    localStorage.setItem(FEEL_SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    // Storage failures should not block the game.
  }
  applyFeelSettings(next);
  return next;
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

function getEffectiveFeelSettings(settings = currentFeelSettings) {
  const normalized = sanitizeFeelSettings(settings);
  const effectiveMotion = normalized.motionMode === "auto"
    ? (prefersReducedMotion() ? "reduced" : "on")
    : normalized.motionMode;
  return {
    ...normalized,
    effectiveMotion,
    sound: normalized.soundEnabled ? "on" : "off"
  };
}

function applyFeelSettings(settings = currentFeelSettings) {
  const effective = getEffectiveFeelSettings(settings);
  document.documentElement.dataset.motionMode = effective.motionMode;
  document.documentElement.dataset.effectiveMotion = effective.effectiveMotion;
  document.documentElement.dataset.sound = effective.sound;
  document.documentElement.dataset.eventEmphasis = effective.importantEventEmphasis ? "on" : "off";
  document.documentElement.dataset.turnEmphasis = effective.turnEmphasis;
  document.documentElement.classList.toggle("is-reduced-motion", effective.effectiveMotion === "reduced");
  return effective;
}

let currentFeelSettings = loadFeelSettings();
applyFeelSettings(currentFeelSettings);

function getAudioRuntimeState() {
  return {
    unlocked: audioRuntime.unlocked,
    ready: audioRuntime.ready,
    backend: audioRuntime.backend,
    loadedAssets: { ...audioRuntime.loadedAssets },
    lastError: audioRuntime.lastError
  };
}

async function enableSoundEffects() {
  audioRuntime.lastError = null;
  if (!currentFeelSettings.soundEnabled) return { status: "skipped-disabled", ...getAudioRuntimeState() };
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      audioRuntime.backend = typeof Audio === "function" ? "htmlAudio" : "none";
      audioRuntime.unlocked = audioRuntime.backend === "htmlAudio";
      if (audioRuntime.unlocked) {
        return { status: "unlocked", ...getAudioRuntimeState() };
      }
      audioRuntime.lastError = "audio-context-unavailable";
      return { status: "failed", ...getAudioRuntimeState() };
    }
    if (!audioRuntime.context) {
      audioRuntime.context = new AudioContextClass();
      audioRuntime.backend = "webAudio";
    }
    if (audioRuntime.context.state === "suspended") {
      await audioRuntime.context.resume();
    }
    audioRuntime.unlocked = audioRuntime.context.state === "running";
    return { status: audioRuntime.unlocked ? "unlocked" : "locked", ...getAudioRuntimeState() };
  } catch (error) {
    audioRuntime.unlocked = false;
    audioRuntime.lastError = error?.message || String(error);
    return { status: "failed", ...getAudioRuntimeState() };
  }
}

function setSoundVolume(value) {
  const soundVolume = Number.isFinite(Number(value)) ? clamp(Number(value), 0, 100) : DEFAULT_FEEL_SETTINGS.soundVolume;
  return saveFeelSettings({ ...currentFeelSettings, soundVolume });
}

function soundPrivacyForCue(cue) {
  if (!cue?.type) return "generic";
  if (cue.type === "resourcesProduced") {
    return cue.payload?.resourceType ? "viewer-resource" : "generic-resource";
  }
  if (cue.type === "robberResult") {
    return cue.payload?.resourceType ? "viewer-resource" : "generic-robber";
  }
  if (cue.type === "devCardBought") return "generic-card";
  if (cue.type === "devCardPlayed") return cue.payload?.publicCardType ? "public-card" : "generic-card";
  return "public";
}

function soundAssetForCue(cue, baseAsset) {
  if (cue?.type === "resourcesProduced" && !cue.payload?.resourceType) return "card-gain";
  return baseAsset;
}

function mapCueToSound(cue, settings = currentFeelSettings) {
  if (!cue?.type) return null;
  const eventType = cue.type || cue.eventType;
  const definition = SOUND_EVENT_MAP[eventType] || SOUND_EVENT_MAP[cue.eventType];
  if (!definition) return null;
  if (definition.setting && settings?.[definition.setting] === false) {
    return {
      asset: definition.asset,
      category: definition.category,
      disabled: true,
      reason: definition.setting,
      privacy: soundPrivacyForCue(cue),
      volumeScale: definition.volumeScale
    };
  }
  const asset = soundAssetForCue(cue, definition.asset);
  return {
    asset,
    category: definition.category,
    privacy: soundPrivacyForCue(cue),
    volumeScale: definition.volumeScale,
    eventType,
    available: Boolean(audioRuntime.loadedAssets[asset])
  };
}

function playSoundCue(cue, settings = currentFeelSettings) {
  const effective = getEffectiveFeelSettings(settings);
  if (!effective.soundEnabled) return "skipped-disabled";
  if (effective.soundVolume <= 0) return "skipped-muted";
  const soundCue = mapCueToSound(cue, effective);
  if (!soundCue) return "skipped-no-asset";
  if (soundCue.disabled) return "skipped-disabled";
  if (!audioRuntime.unlocked) return "skipped-locked";
  if (!audioRuntime.loadedAssets[soundCue.asset]) return "skipped-no-asset";
  return playSoundAsset(soundCue.asset, { volumeScale: soundCue.volumeScale });
}

function preloadSoundAssets(manifest = {}) {
  Object.entries(manifest).forEach(([key, value]) => {
    audioRuntime.loadedAssets[key] = value;
  });
  return getAudioRuntimeState();
}

function playSoundAsset(assetKey, { loop = false, volumeScale = 1, restart = true, allowLocked = false } = {}) {
  const effective = getEffectiveFeelSettings();
  if (!effective.soundEnabled) return "skipped-disabled";
  if (effective.soundVolume <= 0) return "skipped-muted";
  if (!allowLocked && !audioRuntime.unlocked) return "skipped-locked";
  const source = audioRuntime.loadedAssets[assetKey];
  if (!source || typeof Audio !== "function") return "skipped-no-asset";
  try {
    if (loop && audioRuntime.activeSounds[assetKey] && !audioRuntime.activeSounds[assetKey].paused) return "playing";
    if (restart) stopSoundAsset(assetKey);
    const audio = new Audio(source);
    audio.loop = loop;
    audio.volume = clamp((effective.soundVolume / 100) * volumeScale, 0, 1);
    audioRuntime.activeSounds[assetKey] = audio;
    const result = audio.play();
    if (result?.catch) result.catch((error) => { audioRuntime.lastError = error?.message || String(error); });
    if (!loop) {
      audio.addEventListener("ended", () => {
        if (audioRuntime.activeSounds[assetKey] === audio) delete audioRuntime.activeSounds[assetKey];
      }, { once: true });
    }
    return "played";
  } catch (error) {
    audioRuntime.lastError = error?.message || String(error);
    return "failed";
  }
}

function stopSoundAsset(assetKey) {
  const audio = audioRuntime.activeSounds[assetKey];
  if (!audio) return "skipped";
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (error) {
    audioRuntime.lastError = error?.message || String(error);
  }
  delete audioRuntime.activeSounds[assetKey];
  return "stopped";
}

function playDiceReleaseSound() {
  enableSoundEffects();
  playSoundAsset("dice-release", { volumeScale: 0.54, allowLocked: true });
}

function playDiceSettleSound() {
  playSoundAsset("dice-settle", { volumeScale: 0.5, allowLocked: true });
}

function stopAllSounds() {
  Object.keys(audioRuntime.activeSounds).forEach(stopSoundAsset);
  return getAudioRuntimeState();
}

preloadSoundAssets(SOUND_ASSET_MANIFEST);

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function iconTokenHtml(group, key, { className = "", hidden = true, title = "" } = {}) {
  const token = ICON_TOKENS[group]?.[key];
  if (!token) return "";
  const classes = ["icon-token", `${group}-token`, `${group}-${key}`, className].filter(Boolean).join(" ");
  const attrs = [
    `class="${escapeHtml(classes)}"`,
    hidden ? `aria-hidden="true"` : `role="img" aria-label="${escapeHtml(token.label)}"`,
    title ? `title="${escapeHtml(title)}"` : ""
  ].filter(Boolean);
  const iconPath = TABLER_ICON_PATHS[token.icon];
  if (!iconPath) return "";
  return `<span ${attrs.join(" ")}><svg class="tabler-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">${iconPath}</svg></span>`;
}

function tablerIconHtml(iconKey, className = "") {
  const iconPath = TABLER_ICON_PATHS[iconKey];
  if (!iconPath) return "";
  const classes = ["icon-token", className].filter(Boolean).join(" ");
  return `<span class="${escapeHtml(classes)}" aria-hidden="true"><svg class="tabler-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">${iconPath}</svg></span>`;
}

function resourceIconToken(type, options = {}) {
  return iconTokenHtml("resource", type, options);
}

function actionIconToken(type, options = {}) {
  return iconTokenHtml("action", type, options);
}

function statusIconToken(type, options = {}) {
  return iconTokenHtml("status", type, options);
}

function resourceDisplayName(type) {
  const resource = RESOURCES[type];
  return resource ? resource.name : type;
}

function resourceAmountText(type, amount) {
  return `${resourceDisplayName(type)} ${Number(amount) || 0}`;
}

function botBadgeHtml(player) {
  return "";
}

function playerDisplayName(player) {
  return `${player?.name || "플레이어"}${player?.isBot ? " (봇)" : ""}`;
}

function activePlayerIsBot() {
  return Boolean(isOnlinePlayPhase() && game.players[game.active]?.isBot);
}

function pendingActionLabel(view = game.pendingActionView) {
  if (!view) return "진행 중인 처리";
  if (view.type === "discardForSeven") return "카드 버리기";
  if (view.type === "moveRobber") return "도둑 이동";
  if (view.type === "chooseRobberVictim") return "약탈 대상 선택";
  return "진행 중인 처리";
}

function pendingActionInstruction(view = game.pendingActionView) {
  if (!view) return "진행 중인 처리를 완료하세요.";
  if (view.type === "discardForSeven") {
    return view.role === "discarder"
      ? `버릴 자원 ${view.needed}장을 선택하세요.`
      : `다른 플레이어가 자원을 버리는 중입니다. 남은 인원: ${view.remainingCount || 0}`;
  }
  if (view.type === "moveRobber") {
    return view.role === "actor"
      ? "보드에서 현재 도둑 위치가 아닌 타일을 선택하세요."
      : "현재 행동자가 도둑을 이동하는 중입니다.";
  }
  if (view.type === "chooseRobberVictim") {
    return view.role === "actor"
      ? "자원 1장을 가져올 대상을 선택하세요."
      : "현재 행동자가 약탈 대상을 선택하는 중입니다.";
  }
  return "진행 중인 처리를 완료하세요.";
}

function currentTurnUxState() {
  const online = isOnlinePlaying();
  const viewerSeatIndex = online ? game.viewerSeatIndex : null;
  const viewerPlayer = Number.isInteger(viewerSeatIndex) ? game.players[viewerSeatIndex] : null;
  const activePlayer = currentPlayer();
  const pendingView = game.pendingActionView;
  const disconnected = online ? disconnectedOnlinePlayers() : [];
  const base = {
    online,
    viewerSeatIndex,
    viewerPlayer,
    activePlayer,
    actingPlayer: null,
    pendingActors: [],
    currentFocusPlayer: activePlayer,
    kind: "waiting",
    headline: activePlayer ? `${activePlayer.name} 차례입니다` : "대기 중",
    guideTitle: "대기 중",
    guideText: "3~4명 닉네임을 입력하고 게임을 시작하세요.",
    possibleAction: "-",
    nextAction: "-",
    blocking: false
  };

  if (isOnlineEnded()) {
    return {
      ...base,
      currentFocusPlayer: null,
      kind: "blocking",
      headline: "게임방이 종료되었습니다",
      guideTitle: "게임 종료",
      guideText: onlineEndReasonMessage(onlineSession.state?.endReason),
      possibleAction: "방 나가기",
      nextAction: "로비로 나가 새 방을 만들거나 다시 참가하세요.",
      blocking: true
    };
  }

  if (online && disconnected.length) {
    return {
      ...base,
      kind: "blocking",
      headline: "재접속 대기 중",
      guideTitle: "재접속 대기",
      guideText: `${disconnected.map((player) => player.name).join(", ")}의 재접속을 기다리는 중입니다.`,
      possibleAction: "대기",
      nextAction: "연결이 복구되면 자동으로 진행할 수 있습니다.",
      blocking: true
    };
  }

  if (isOnlineInitialSetup()) {
    const setupPlayer = game.players[game.setupIndex] || null;
    const isViewer = setupPlayer && setupPlayer.id === viewerSeatIndex;
    const needsSettlement = game.pendingSettlement === null;
    return {
      ...base,
      activePlayer: setupPlayer,
      actingPlayer: setupPlayer,
      pendingActors: setupPlayer ? [setupPlayer] : [],
      currentFocusPlayer: setupPlayer,
      kind: isViewer ? "action-needed" : setupPlayer?.isBot ? "bot-turn" : "waiting",
      headline: isViewer ? "내가 행동할 차례입니다" : `현재 진행: ${playerDisplayName(setupPlayer)}`,
      guideTitle: "초기 배치",
      guideText: isViewer
        ? (needsSettlement ? "마을을 놓으세요." : "방금 놓은 마을과 연결된 도로를 놓으세요.")
        : `${playerDisplayName(setupPlayer)}의 초기 배치를 기다리는 중입니다.`,
      possibleAction: isViewer ? (needsSettlement ? "마을 배치" : "도로 배치") : "대기",
      nextAction: needsSettlement ? "마을을 놓은 뒤 연결 도로를 놓습니다." : "도로를 놓으면 다음 순서로 넘어갑니다."
    };
  }

  if (online && pendingView) {
    const actorSeat = pendingView.role === "discarder" ? viewerSeatIndex : pendingView.actorSeatIndex;
    const actingPlayer = Number.isInteger(actorSeat) ? game.players[actorSeat] : activePlayer;
    const viewerIsActor = actingPlayer && actingPlayer.id === viewerSeatIndex;
    return {
      ...base,
      actingPlayer,
      pendingActors: actingPlayer ? [actingPlayer] : [],
      currentFocusPlayer: actingPlayer || activePlayer,
      kind: viewerIsActor ? "action-needed" : actingPlayer?.isBot ? "bot-turn" : "pending-wait",
      headline: viewerIsActor ? "내가 행동할 차례입니다" : `${playerDisplayName(actingPlayer)} 진행 중`,
      guideTitle: pendingActionLabel(pendingView),
      guideText: pendingActionInstruction(pendingView),
      possibleAction: viewerIsActor ? pendingActionLabel(pendingView) : "대기",
      nextAction: "모달 안내를 기준으로 진행합니다."
    };
  }

  if (isOnlinePlayPhase()) {
    const isViewerActive = activePlayer && activePlayer.id === viewerSeatIndex;
    const botActive = Boolean(activePlayer?.isBot);
    if (botActive) {
      return {
        ...base,
        kind: "bot-turn",
        headline: `${playerDisplayName(activePlayer)} 진행 중`,
        guideTitle: "봇 진행 중",
        guideText: "봇이 자동으로 행동을 처리하는 중입니다.",
        possibleAction: "대기",
        nextAction: "봇 행동이 끝나면 다음 차례로 넘어갑니다."
      };
    }
    if (isViewerActive) {
      return {
        ...base,
        kind: "my-turn",
        headline: "내 차례입니다",
        guideTitle: "내 차례",
        guideText: game.rolled ? "건설, 교환, 개발 카드 구입 또는 턴 넘기기를 할 수 있습니다." : "주사위를 굴릴 차례입니다.",
        possibleAction: game.rolled ? "건설/교환/턴 넘기기" : "주사위 굴리기",
        nextAction: game.rolled ? "할 행동을 마쳤다면 턴을 넘기세요." : "주사위 결과를 확인한 뒤 행동을 선택하세요."
      };
    }
    return {
      ...base,
      kind: "waiting",
      headline: `현재 진행: ${playerDisplayName(activePlayer)}`,
      guideTitle: "상대 차례",
      guideText: `${playerDisplayName(activePlayer)}님의 행동을 기다리는 중입니다.`,
      possibleAction: "대기",
      nextAction: "내 차례가 오면 행동 버튼이 활성화됩니다."
    };
  }

  if (game.winner !== null) {
    return {
      ...base,
      currentFocusPlayer: game.players[game.winner],
      kind: "blocking",
      headline: `${game.players[game.winner].name} 승리`,
      guideTitle: "게임 종료",
      guideText: `${game.players[game.winner].name} 승리입니다.${winnerVictoryDevText()} 새 게임을 시작할 수 있습니다.`,
      possibleAction: "새 게임",
      nextAction: "새 게임을 시작할 수 있습니다.",
      blocking: true
    };
  }

  if (game.phase === "setup1" || game.phase === "setup2") {
    return {
      ...base,
      actingPlayer: activePlayer,
      pendingActors: activePlayer ? [activePlayer] : [],
      currentFocusPlayer: activePlayer,
      kind: "action-needed",
      headline: `${activePlayer?.name || "플레이어"} 차례입니다`,
      guideTitle: "초기 배치",
      guideText: `${activePlayer?.name || "플레이어"} 차례입니다. 마을을 놓은 뒤, 그 마을과 붙은 도로를 놓으세요.`,
      possibleAction: "마을/도로 배치",
      nextAction: "두 번째 배치의 마을에서 시작 자원을 받습니다."
    };
  }

  if (selectedAction === "discard" || selectedAction === "robber" || selectedAction === "robberVictim" || selectedAction === "roadBuilding") {
    const label = selectedAction === "discard" ? "카드 버리기"
      : selectedAction === "robber" ? "도둑 이동"
        : selectedAction === "robberVictim" ? "약탈 대상 선택" : "도로 건설 카드";
    return {
      ...base,
      actingPlayer: activePlayer,
      pendingActors: activePlayer ? [activePlayer] : [],
      currentFocusPlayer: activePlayer,
      kind: "action-needed",
      headline: `${activePlayer?.name || "플레이어"} 차례입니다`,
      guideTitle: label,
      guideText: selectedAction === "roadBuilding" ? `무료 도로 ${game.pendingFreeRoads}개를 더 놓으세요.` : `${activePlayer?.name || "플레이어"}가 ${label}을 처리해야 합니다.`,
      possibleAction: label,
      nextAction: "화면 안내에 따라 선택을 완료하세요."
    };
  }

  if (activePlayer) {
    return {
      ...base,
      kind: "active-turn",
      headline: `${activePlayer.name} 차례입니다`,
      guideTitle: game.rolled ? "건설/교환" : "주사위 또는 개발 카드",
      guideText: game.rolled
        ? `${activePlayer.name} 차례입니다. 도로, 마을, 도시, 개발 카드, 교환을 할 수 있습니다.`
        : `${activePlayer.name} 차례입니다. 주사위를 굴리세요. 이전 턴에 산 기사 카드는 굴리기 전에도 사용할 수 있습니다.`,
      possibleAction: game.rolled ? "건설/교환/턴 넘기기" : "주사위 굴리기",
      nextAction: game.rolled ? "행동을 마치면 턴을 넘기세요." : "굴림 후 자원을 확인하세요."
    };
  }

  return base;
}

function viewerMustAnswerPending() {
  return Boolean(
    game.pendingActionView && (
      game.pendingActionView.role === "discarder"
      || game.pendingActionView.role === "actor"
    )
  );
}

function viewerMustAnswerTrade() {
  const trade = onlineSession.state?.pendingPlayerTrade;
  return Boolean(trade?.role === "responder" && !trade.myResponse);
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

function pointBadgeNumber(player, revealHidden = false) {
  return String(revealHidden ? totalPoints(player) : publicPoints(player));
}

function scoreBreakdownText(player, revealHidden = false) {
  if (!player) return "점수 정보 없음";
  const settlements = vertices.filter((vertex) => vertex.owner === player.id && !vertex.city).length;
  const cities = vertices.filter((vertex) => vertex.owner === player.id && vertex.city).length;
  const largestArmy = game.largestArmy === player.id ? 2 : 0;
  const longestRoad = game.longestRoad === player.id ? 2 : 0;
  const hidden = revealHidden ? hiddenVictoryPoints(player) : 0;
  const lines = [
    `마을 ${settlements}개: ${settlements}점`,
    `도시 ${cities}개: ${cities * 2}점`
  ];
  if (largestArmy) lines.push("최대 기사단: 2점");
  if (longestRoad) lines.push("최장 교역로: 2점");
  if (revealHidden && hidden) lines.push(`승점 카드 ${hidden}장: ${hidden}점`);
  if (!revealHidden && isOnlinePlaying()) lines.push("비공개 승점 카드는 제외");
  lines.push(`합계: ${pointBadgeNumber(player, revealHidden)}점`);
  return lines.join("\n");
}

function scoreBadgeAttributes(player, revealHidden = false) {
  const label = `${playerDisplayName(player)} ${pointBadgeNumber(player, revealHidden)}점`;
  const breakdown = scoreBreakdownText(player, revealHidden);
  const isOpen = String(activeScoreTooltipPlayerId) === String(player.id);
  return `role="button" aria-label="${escapeHtml(`${label}\n${breakdown}`)}" aria-expanded="${isOpen ? "true" : "false"}" data-score-player-id="${escapeHtml(player.id)}" data-score-tooltip="${escapeHtml(breakdown)}" tabindex="0"`;
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

function devCardIconToken(type) {
  return tablerIconHtml(DEV_CARD_ICON_BY_TYPE[type] || "play-card", "dev-card-token");
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
  const rawMessage = String(error?.message || "");
  const fallback = rawMessage
    ? `${rawMessage} 잠시 후 다시 시도하거나 방장에게 서버 상태를 확인해 달라고 요청하세요.`
    : "요청을 처리할 수 없습니다. 잠시 후 다시 시도하세요.";
  return {
    BAD_MESSAGE: "요청 형식이 올바르지 않습니다. 화면을 새로고침한 뒤 다시 시도하세요.",
    ROOM_NOT_FOUND: "방을 찾을 수 없습니다. 방 코드가 맞는지 확인하거나 방장에게 새 공유 링크를 요청하세요.",
    ROOM_FULL: "방 정원이 가득 찼습니다. 방장에게 빈 자리가 있는지 확인하세요.",
    ROOM_NOT_JOINABLE: "이미 시작되었거나 참가할 수 없는 방입니다. 방장에게 새 방 생성을 요청하세요.",
    GAME_ALREADY_STARTED: "이미 시작한 방입니다. 방장에게 새 방을 만들어 달라고 요청하세요.",
    INVALID_NAME: "닉네임을 사용할 수 없습니다. 1~24자 닉네임을 다시 입력하세요.",
    ROOM_ENDED: "이미 종료된 방입니다. 로비로 나가 새 방을 만들거나 새 공유 링크로 참가하세요.",
    PLAYER_LEFT: "이미 나간 방입니다. 새 방을 만들어 다시 시작하세요.",
    PLAYER_DISCONNECTED: "연결이 끊긴 참가자가 있습니다. 재접속이 완료된 뒤 다시 시도하세요.",
    NOT_YOUR_TURN: "지금은 내 차례가 아닙니다.",
    ROOM_NOT_READY: "아직 진행할 수 없습니다. 인원 조건이나 재접속 대기 상태를 확인하세요.",
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
    INVALID_TOKEN: "접속 정보가 만료되었습니다. 방 코드나 공유 링크로 다시 참가하세요.",
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
    REQUEST_TIMEOUT: "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도하고, 방장 PC에서 서버가 켜져 있는지 확인하세요.",
    SOCKET_CLOSED: "서버 연결이 끊겼습니다. 같은 네트워크인지 확인하고 방장 PC의 서버 실행 상태를 확인하세요.",
    SOCKET_ERROR: "서버에 연결할 수 없습니다. 방장 PC에서 서버가 켜져 있는지, 같은 네트워크인지 확인하세요.",
    SERVER_ERROR: "서버 오류가 발생했습니다. 방장에게 서버를 재시작한 뒤 다시 시도해 달라고 요청하세요."
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
  onlineSession.diceRollPending = false;
  shownVictoryModalKey = null;
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
      const error = new Error("서버에 연결할 수 없습니다.");
      error.code = "SOCKET_ERROR";
      reject(error);
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
        const error = new Error("서버에 연결할 수 없습니다.");
        error.code = "SOCKET_CLOSED";
        reject(error);
      }
      renderLobby();
      const error = new Error("서버 연결이 끊겼습니다.");
      error.code = "SOCKET_CLOSED";
      rejectPendingRequests(error);
    });

    socket.addEventListener("error", () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        const error = new Error("서버에 연결할 수 없습니다.");
        error.code = "SOCKET_ERROR";
        reject(error);
      }
    });
  });
}

function sendOnlineCommand(name, payload = {}) {
  const socket = onlineSession.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    const error = new Error("서버에 연결되어 있지 않습니다.");
    error.code = "SOCKET_CLOSED";
    error.commandName = name;
    emitCommandRejectedCue(error, name, payload?.edgeId ?? payload?.vertexId ?? payload?.cardId ?? "socket");
    return Promise.reject(error);
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
      const error = new Error("서버 응답이 지연되고 있습니다.");
      error.code = "REQUEST_TIMEOUT";
      error.commandName = name;
      emitCommandRejectedCue(error, name, requestId);
      reject(error);
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
      , commandName: name
      , commandPayload: payload
      , requestId
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
    applyOnlineState(message.state, message.revision, { suppressCues: true, resetCueScope: true });
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
    applyOnlineState(message.state, message.revision, { suppressCues: true, resetCueScope: true });
    pending.resolve(message);
    return;
  }

  if (["botAdded", "botRemoved", "initialSettlementPlaced", "initialRoadPlaced", "diceRolled", "turnEnded", "roadBuilt", "settlementBuilt", "cityBuilt", "bankTraded", "devCardBought", "devCardPlayed", "freeRoadPlaced", "sevenDiscarded", "robberMoved", "robberVictimChosen", "playerTradeOpened", "playerTradeResponded", "playerTradeChosen", "playerTradeUpdated", "playerTradeCanceled", "playerTradeInvalidated"].includes(message.type)) {
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
      error.commandName = pending.commandName;
      emitCommandRejectedCue(error, pending.commandName || "command", message.requestId);
      pending.reject(error);
    }
  }
}

function applyOnlineState(state, revision, options = {}) {
  if (!state) return;
  const nextRevision = Number(revision ?? state.revision ?? 0);
  if (onlineSession.state && nextRevision <= onlineSession.revision) return;
  const previousState = onlineSession.state;
  onlineSession.revision = nextRevision;
  onlineSession.state = state;
  onlineSession.isHost = state.hostPlayerId === onlineSession.playerId;
  if (options.resetCueScope && state.roomId) resetPlayedCueKeys(state.roomId);
  if (options.suppressCues && state.roomId) suppressHydrateCueScope(state.roomId, nextRevision);
  if ((state.status === "playing" || state.status === "ended") && state.matchState) {
    if (state.matchState.game?.lastDice || state.matchState.game?.rolled || options.suppressCues) {
      onlineSession.diceRollPending = false;
    }
    hydrateMatchState(state.matchState);
    if (!options.suppressCues) logOnlineStateDelta(previousState, state);
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
  game.lastTrade = nextGame.lastTrade || null;
  game.lastRobberResult = nextGame.lastRobberResult || null;
  game.bank = { ...STARTING_BANK_RESOURCES, ...(nextGame.bank || {}) };
  game.winner = nextGame.winner ?? null;
  game.winnerSummary = nextGame.winnerSummary || null;
  game.viewerSeatIndex = nextGame.viewerSeatIndex ?? null;
}

function gameFromState(state) {
  return state?.matchState?.game || null;
}

function botNameFromGame(gameState, seatIndex) {
  const player = gameState?.players?.[seatIndex];
  return playerDisplayName(player);
}

function onlineActionPlayerName(gameState, seatIndex) {
  return playerDisplayName(gameState?.players?.[seatIndex]);
}

function isViewerSeat(gameState, seatIndex) {
  return Number.isInteger(seatIndex) && seatIndex === gameState?.viewerSeatIndex;
}

function pieceDelta(previousPlayer, nextPlayer, key) {
  return (Number(previousPlayer?.[key]) || 0) - (Number(nextPlayer?.[key]) || 0);
}

function hasOnlineNoticeBlockingState() {
  return Boolean(
    game.pendingActionView
    || onlineSession.state?.pendingPlayerTrade
    || disconnectedOnlinePlayers().length
    || onlineSession.state?.status === "ended"
    || ["leave-confirm", "room-ended", "reconnect-waiting"].includes(onlineSession.modalKind)
  );
}

function setActionNotice(title, text, key = null, durationMs = 6500) {
  if (!title && !text) return;
  if (key && actionNoticeRuntime.key === key) return;
  const notice = {
    key: key || `notice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: title || "행동 알림",
    text: text || "",
    createdAt: Date.now()
  };
  actionNoticeRuntime.history = actionNoticeRuntime.history.filter((entry) => entry.key !== notice.key);
  actionNoticeRuntime.history.push(notice);
  while (actionNoticeRuntime.history.length > actionNoticeRuntime.maxHistory) actionNoticeRuntime.history.shift();
  actionNoticeRuntime.index = actionNoticeRuntime.history.length - 1;
  actionNoticeRuntime.key = notice.key;
  actionNoticeRuntime.title = notice.title;
  actionNoticeRuntime.text = notice.text;
  if (actionNoticeRuntime.timeoutId) window.clearTimeout(actionNoticeRuntime.timeoutId);
  actionNoticeRuntime.timeoutId = window.setTimeout(() => {
    if (actionNoticeRuntime.key !== notice.key) return;
    actionNoticeRuntime.key = null;
    actionNoticeRuntime.title = "";
    actionNoticeRuntime.text = "";
    render();
  }, durationMs);
  render();
}

function clearActionNotice() {
  actionNoticeRuntime.key = null;
  actionNoticeRuntime.title = "";
  actionNoticeRuntime.text = "";
  actionNoticeRuntime.index = actionNoticeRuntime.history.length ? actionNoticeRuntime.history.length - 1 : -1;
  if (actionNoticeRuntime.timeoutId) {
    window.clearTimeout(actionNoticeRuntime.timeoutId);
    actionNoticeRuntime.timeoutId = null;
  }
}

function currentActionNotice() {
  if (!actionNoticeRuntime.title && !actionNoticeRuntime.text) return null;
  return [actionNoticeRuntime.title, actionNoticeRuntime.text];
}

function showActionNoticeAt(index) {
  if (!actionNoticeRuntime.history.length) return;
  const nextIndex = clamp(index, 0, actionNoticeRuntime.history.length - 1);
  const notice = actionNoticeRuntime.history[nextIndex];
  actionNoticeRuntime.index = nextIndex;
  actionNoticeRuntime.key = notice.key;
  actionNoticeRuntime.title = notice.title;
  actionNoticeRuntime.text = notice.text;
  if (actionNoticeRuntime.timeoutId) {
    window.clearTimeout(actionNoticeRuntime.timeoutId);
    actionNoticeRuntime.timeoutId = null;
  }
  render();
}

function showPreviousActionNotice() {
  showActionNoticeAt(actionNoticeRuntime.index - 1);
}

function showNextActionNotice() {
  showActionNoticeAt(actionNoticeRuntime.index + 1);
}

function renderActionNoticeControls() {
  const hasHistory = actionNoticeRuntime.history.length > 0;
  const index = actionNoticeRuntime.index;
  if (actionNoticePrev) {
    actionNoticePrev.innerHTML = tablerIconHtml("chevron-left");
    actionNoticePrev.disabled = !hasHistory || index <= 0;
  }
  if (actionNoticeNext) {
    actionNoticeNext.innerHTML = tablerIconHtml("chevron-right");
    actionNoticeNext.disabled = !hasHistory || index >= actionNoticeRuntime.history.length - 1;
  }
  actionNoticePanel?.setAttribute("data-notice-count", String(actionNoticeRuntime.history.length));
}

function showNextOnlineNotice() {
  if (!onlineSession.enabled || onlineSession.modalKind || hasOnlineNoticeBlockingState()) return;
  const notice = onlineSession.noticeQueue.shift();
  if (!notice) return;
  onlineSession.activeNoticeKey = notice.key;
  setActionNotice(notice.title, notice.text, notice.key);
  window.setTimeout(() => {
    if (onlineSession.activeNoticeKey === notice.key) onlineSession.activeNoticeKey = null;
    showNextOnlineNotice();
  }, 6600);
}

function queueOnlineNotice(key, title, text) {
  if (!key || onlineSession.activeNoticeKey === key || onlineSession.noticeQueue.some((notice) => notice.key === key)) return;
  onlineSession.noticeQueue.push({ key, title, text });
  showNextOnlineNotice();
}

function queueOtherPlayerActionNotice(key, gameState, seatIndex, title, text) {
  if (isViewerSeat(gameState, seatIndex)) return;
  queueOnlineNotice(key, title, text);
}

function describeOnlineBankTrade(previousPlayer, nextPlayer, lastTrade = null, seatIndex = null) {
  if (!lastTrade || lastTrade.seatIndex !== seatIndex) return "";
  const ratio = Number(lastTrade.ratio);
  const giveName = RESOURCES[lastTrade?.give]?.name || "";
  const getName = RESOURCES[lastTrade?.get]?.name || "";
  if (!giveName || !getName || !Number.isInteger(ratio) || ratio <= 0) return "";
  return `${giveName} ${ratio}장 → ${getName} 1장으로 교환했습니다.`;
}

function queueOnlineActionNotices(previousState, state, previousGame, nextGame) {
  if (previousGame.phase !== "play" || nextGame.phase !== "play") return;
  nextGame.players?.forEach((nextPlayer, seatIndex) => {
    const previousPlayer = previousGame.players?.[seatIndex];
    if (!previousPlayer || !nextPlayer) return;

    const name = onlineActionPlayerName(nextGame, seatIndex);
    const keyBase = `${state.roomId}:${state.revision}:${seatIndex}`;
    const roadDelta = pieceDelta(previousPlayer, nextPlayer, "roads");
    const settlementDelta = pieceDelta(previousPlayer, nextPlayer, "settlements");
    const cityDelta = pieceDelta(previousPlayer, nextPlayer, "cities");
    const devDelta = pieceDelta(nextPlayer, previousPlayer, "devCount");
    const resourceDelta = (Number(previousPlayer.resourceCount) || 0) - (Number(nextPlayer.resourceCount) || 0);

    if (roadDelta > 0) {
      queueOtherPlayerActionNotice(`${keyBase}:road`, nextGame, seatIndex, "건설 알림", `${name}님이 도로를 건설했습니다.`);
    }
    if (settlementDelta > 0 && cityDelta === 0) {
      queueOtherPlayerActionNotice(`${keyBase}:settlement`, nextGame, seatIndex, "건설 알림", `${name}님이 마을을 건설했습니다.`);
    }
    if (cityDelta > 0) {
      queueOtherPlayerActionNotice(`${keyBase}:city`, nextGame, seatIndex, "건설 알림", `${name}님이 도시로 업그레이드했습니다.`);
    }
    if (devDelta > 0) {
      queueOtherPlayerActionNotice(`${keyBase}:dev`, nextGame, seatIndex, "개발 카드 알림", `${name}님이 개발 카드 1장을 구입했습니다.`);
    }
    if (
      resourceDelta > 0
      && roadDelta === 0
      && settlementDelta === 0
      && cityDelta === 0
      && devDelta === 0
      && previousState.pendingPlayerTrade === state.pendingPlayerTrade
      && !previousGame.pendingActionView
      && !nextGame.pendingActionView
      && nextGame.active === seatIndex
    ) {
      const tradeDescription = describeOnlineBankTrade(previousPlayer, nextPlayer, nextGame.lastTrade, seatIndex);
      if (tradeDescription) {
        queueOtherPlayerActionNotice(`${keyBase}:bank-trade`, nextGame, seatIndex, "은행/항구 교환 알림", `${name}님이 ${tradeDescription}`);
      }
    }
  });
}

function logBotPublicAction(gameState, seatIndex, text) {
  const player = gameState?.players?.[seatIndex];
  if (!player?.isBot) return;
  addLog(`${playerDisplayName(player)}: ${text}`, "bot");
}

function logOnlineStateDelta(previousState, state) {
  if (!previousState || previousState.roomId !== state.roomId || state.status !== "playing") return;
  const previousGame = gameFromState(previousState);
  const nextGame = gameFromState(state);
  if (!previousGame || !nextGame) return;
  queueOnlineActionNotices(previousState, state, previousGame, nextGame);

  const previousEdges = previousState.matchState?.edges || [];
  const nextEdges = state.matchState?.edges || [];
  nextEdges.forEach((edge, edgeId) => {
    if (previousEdges[edgeId]?.owner === null && edge.owner !== null) {
      emitBuildCompletedCue("road", edgeId, edge.owner, state.revision);
    }
  });

  const previousVertices = previousState.matchState?.vertices || [];
  const nextVertices = state.matchState?.vertices || [];
  nextVertices.forEach((vertex, vertexId) => {
    const previousVertex = previousVertices[vertexId];
    if (!previousVertex) return;
    if (previousVertex.owner === null && vertex.owner !== null) {
      emitBuildCompletedCue("settlement", vertexId, vertex.owner, state.revision);
    } else if (!previousVertex.city && vertex.city) {
      emitBuildCompletedCue("city", vertexId, vertex.owner, state.revision);
    }
  });

  if (nextGame.lastTrade && nextGame.lastTrade?.createdAt !== previousGame.lastTrade?.createdAt) {
    emitTradeCompletedCue("bankTradeCompleted", {
      ...nextGame.lastTrade,
      revision: state.revision,
      detailKey: `${nextGame.lastTrade.seatIndex}:${nextGame.lastTrade.give}:${nextGame.lastTrade.get}:${nextGame.lastTrade.createdAt}`
    });
  }

  if (state.lastPlayerTradeResult && state.lastPlayerTradeResult?.createdAt !== previousState.lastPlayerTradeResult?.createdAt) {
    emitTradeCompletedCue(
      state.lastPlayerTradeResult.type === "completed" ? "playerTradeCompleted" : "playerTradeInvalidated",
      {
        ...state.lastPlayerTradeResult,
        revision: state.revision,
        detailKey: `${state.lastPlayerTradeResult.tradeId || "trade"}:${state.lastPlayerTradeResult.round || "round"}:${state.lastPlayerTradeResult.type || "result"}`
      }
    );
  }

  nextGame.players?.forEach((nextPlayer, seatIndex) => {
    const previousPlayer = previousGame.players?.[seatIndex];
    if (!previousPlayer || !nextPlayer) return;
    if ((Number(nextPlayer.devCount) || 0) > (Number(previousPlayer.devCount) || 0)) {
      emitDevCardCue("devCardBought", { seatIndex, revision: state.revision });
    }
  });

  if ((previousGame.winner === null || previousGame.winner === undefined) && nextGame.winner !== null && nextGame.winner !== undefined) {
    emitWinnerDeclaredCue(nextGame.winner, state.revision);
    showVictoryModal(nextGame.winner, state.revision);
  }

  const previousPendingKey = previousGame.pendingActionView
    ? pendingActionCueDetail(previousGame.pendingActionView)
    : "none";
  const nextPendingKey = nextGame.pendingActionView
    ? pendingActionCueDetail(nextGame.pendingActionView)
    : "none";
  if (previousPendingKey !== nextPendingKey && nextGame.pendingActionView) {
    emitPendingActionCue(nextGame.pendingActionView, state.revision);
  }

  if (!previousGame.rolled && nextGame.rolled) {
    logBotPublicAction(nextGame, nextGame.active, "주사위를 굴렸습니다.");
  }

  if (previousGame.usedDevThisTurn !== nextGame.usedDevThisTurn && nextGame.usedDevThisTurn) {
    logBotPublicAction(nextGame, nextGame.active, "개발 카드를 사용했습니다.");
  }

  if (previousGame.pendingActionView?.type === "discardForSeven" && nextGame.pendingActionView?.type !== "discardForSeven") {
    previousGame.players?.filter((player) => player.isBot).forEach((player) => {
      if ((previousGame.players[player.id]?.resourceCount || 0) > (nextGame.players[player.id]?.resourceCount || 0)) {
        addLog(`${playerDisplayName(player)}: 카드를 버렸습니다.`);
      }
    });
  }

  if (previousState.pendingPlayerTrade && nextStateTradeResponseCount(state) > nextStateTradeResponseCount(previousState)) {
    Object.values(state.pendingPlayerTrade?.responses || {}).forEach((response) => {
      const player = state.players?.find((entry) => entry.id === response.playerId);
      if (player?.isBot && !previousState.pendingPlayerTrade?.responses?.[response.playerId]) {
        addLog(`${playerDisplayName(player)}: 거래에 응답했습니다.`);
      }
    });
  }

  if (previousState.matchState?.robberTile !== state.matchState?.robberTile) {
    logBotPublicAction(nextGame, previousGame.pendingActionView?.actorSeatIndex ?? nextGame.active, "강도를 이동했습니다.");
    emitRobberMovedCue({
      actorSeatIndex: previousGame.pendingActionView?.actorSeatIndex ?? nextGame.active,
      fromTileId: previousState.matchState?.robberTile ?? null,
      toTileId: state.matchState?.robberTile ?? null,
      revision: state.revision
    });
  }

  if (nextGame.lastRobberResult?.id && nextGame.lastRobberResult?.id !== previousGame.lastRobberResult?.id) {
    emitRobberResultCue(nextGame.lastRobberResult, state.revision);
  }
}

function nextStateTradeResponseCount(state) {
  return Object.keys(state?.pendingPlayerTrade?.responses || {}).length;
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
  if (!onlineSession.state?.pendingPlayerTrade && onlineSession.modalKind === "player-trade") hideModal();
  setupScreen.classList.add("hidden");
  if (onlineSession.playLogRoomId !== onlineSession.roomId) {
    onlineSession.playLogRoomId = onlineSession.roomId;
    logEl.replaceChildren();
    addLog("온라인 게임이 시작되었습니다.");
  }
  if (onlineSession.state?.status === "ended") {
    addLog(onlineEndReasonMessage(onlineSession.state?.endReason));
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
  lobbyConnectionBadge.innerHTML = `${statusIconToken(onlineSession.connected ? "connection" : "error")}<span>${onlineSession.connected ? "연결됨" : "연결 끊김"}</span>`;
  lobbyConnectionBadge.setAttribute("aria-label", onlineSession.connected ? "연결됨" : "연결 끊김");
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
    if (player.isBot) row.classList.add("is-bot");
    row.style.setProperty("--player-color", player.color || "#f4c460");
    const badges = player.isBot
      ? [
        player.id === state.hostPlayerId ? "방장" : "",
        player.id === onlineSession.playerId ? "나" : "",
        "봇",
        "준비됨"
      ].filter(Boolean)
      : [
        player.id === state.hostPlayerId ? "방장" : "",
        player.id === onlineSession.playerId ? "나" : "",
        player.connected ? "연결됨" : "끊김"
      ].filter(Boolean);
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.setAttribute("aria-hidden", "true");
    const name = document.createElement("strong");
    name.textContent = player.name;
    if (player.isBot) {
      const badge = document.createElement("span");
      badge.className = "bot-badge";
      badge.textContent = "봇";
      badge.title = "봇 플레이어";
      badge.setAttribute("aria-label", "봇 플레이어");
      name.append(" ", badge);
    }
    const status = document.createElement("span");
    status.className = "lobby-player-status";
    status.innerHTML = `${statusIconToken(player.isBot ? "bot" : player.connected ? "connection" : "error")}<span>${escapeHtml(badges.join(" · "))}</span>`;
    status.setAttribute("aria-label", badges.join(" · "));
    row.append(dot, name, status);
    if (onlineSession.isHost && state.status === "lobby" && player.isBot) {
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "lobby-remove-bot-button";
      removeButton.dataset.botPlayerId = player.id;
      removeButton.textContent = "제거";
      removeButton.title = `${player.name} 제거`;
      removeButton.setAttribute("aria-label", `${player.name} 제거`);
      row.append(removeButton);
    }
    lobbyPlayersList.append(row);
  });

  const humanPlayers = state.players.filter((player) => !player.isBot && !player.left);
  const totalPlayers = state.players.filter((player) => !player.left);
  const allConnected = humanPlayers.every((player) => player.connected);
  const hasHumanPlayer = humanPlayers.length >= 1;
  const hasEnoughPlayers = totalPlayers.length >= 3;
  const canManageBots = onlineSession.isHost && state.status === "lobby";
  const canStart = canManageBots && hasHumanPlayer && hasEnoughPlayers && allConnected;
  lobbyBotControls?.classList.toggle("hidden", !canManageBots);
  if (lobbyAddBotButton) {
    lobbyAddBotButton.disabled = !canManageBots || totalPlayers.length >= (state.maxPlayers || 4);
    lobbyAddBotButton.title = lobbyAddBotButton.disabled ? "최대 4명까지 참가할 수 있습니다." : "";
  }
  lobbyStartButton.disabled = !canStart;
  lobbyStartButton.textContent = canStart ? "게임 시작" : "게임 시작";
  if (!onlineSession.isHost) {
    lobbyStartButton.title = "방장만 게임을 시작할 수 있습니다.";
  } else if (!hasHumanPlayer) {
    lobbyStartButton.title = "사람 플레이어가 1명 이상 필요합니다.";
  } else if (!hasEnoughPlayers) {
    lobbyStartButton.title = "사람과 봇을 합쳐 3명 이상이면 시작할 수 있습니다.";
  } else if (!allConnected) {
    lobbyStartButton.title = "모든 사람 참가자가 연결되어 있어야 합니다.";
  } else {
    lobbyStartButton.title = "";
  }
  if (lobbyStartHint) {
    lobbyStartHint.textContent = "사람 1명 이상, 사람+봇 합산 3명 이상이면 시작할 수 있습니다.";
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

async function addOnlineBot() {
  if (!onlineSession.isHost || onlineSession.state?.status !== "lobby") return;
  if (lobbyAddBotButton) lobbyAddBotButton.disabled = true;
  setOnlineStatus(copyStatus, "봇을 추가하는 중입니다.", "pending");

  try {
    await sendOnlineCommand("addBot");
    setOnlineStatus(copyStatus, "");
  } catch (error) {
    setOnlineStatus(copyStatus, onlineErrorMessage(error), "error");
    renderLobby();
  }
}

async function removeOnlineBot(playerId) {
  if (!onlineSession.isHost || onlineSession.state?.status !== "lobby" || !playerId) return;
  setOnlineStatus(copyStatus, "봇을 제거하는 중입니다.", "pending");

  try {
    await sendOnlineCommand("removeBot", { playerId });
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

  if (game.lastRobberResult?.id && game.lastRobberResult.id !== onlineSession.lastRobberResultId) {
    if (shouldShowRobberResultModal(game.lastRobberResult)) {
      showRobberResultModal(game.lastRobberResult);
      return;
    }
    rememberRobberResult(game.lastRobberResult);
  }

  showNextOnlineNotice();
}

function showOnlinePendingActionModal(view) {
  if (view.type === "discardForSeven") {
    if (view.role === "discarder") {
      if (onlineSession.modalKind !== "discard-seven") showOnlineDiscardForSevenModal(view);
      return;
    }
    if (onlineSession.modalKind === "discard-waiting") hideModal();
    return;
  }

  if (view.type === "moveRobber") {
    if (view.role === "actor") {
      setActionNotice("도둑 이동", "현재 도둑 위치가 아닌 타일을 선택하세요.", `move-robber-${view.actorSeatIndex ?? game.active}`);
      return;
    }
    if (onlineSession.modalKind === "move-robber-waiting") hideModal();
    return;
  }

  if (view.type === "chooseRobberVictim") {
    if (view.role === "actor") {
      if (onlineSession.modalKind !== "choose-robber-victim") showOnlineChooseRobberVictimModal(view);
      return;
    }
    if (onlineSession.modalKind === "choose-robber-victim-waiting") hideModal();
    setActionNotice("약탈 대상 선택 대기", "현재 플레이어가 약탈 대상을 선택하는 중입니다.", `choose-robber-victim-waiting-${view.actorSeatIndex ?? game.active}`);
  }
}

function showOnlineDiscardForSevenModal(view) {
  const player = game.players[game.viewerSeatIndex];
  const selected = Object.fromEntries(Object.keys(RESOURCES).map((type) => [type, 0]));
  onlineSession.modalKind = "discard-seven";
  showModal("7 규칙: 카드 버리기", `자원 ${view.needed}장을 선택해 버리세요.`);
  const panel = document.createElement("div");
  panel.className = "discard-picker";
  const head = document.createElement("div");
  head.className = "discard-picker-head";
  const progressLabel = document.createElement("strong");
  const progressTrack = document.createElement("div");
  progressTrack.className = "discard-progress";
  progressTrack.setAttribute("role", "progressbar");
  progressTrack.setAttribute("aria-valuemin", "0");
  progressTrack.setAttribute("aria-valuemax", String(view.needed));
  const progressBar = document.createElement("span");
  progressTrack.append(progressBar);
  const list = document.createElement("div");
  list.className = "discard-picker-list";
  const summary = document.createElement("p");
  summary.className = "discard-picker-summary";
  head.append(progressLabel, progressTrack);
  panel.append(head, list, summary);
  const submit = addModalButton("선택 완료", async () => {
    const expectedModalKind = onlineSession.modalKind;
    submit.disabled = true;
    try {
      await sendOnlineCommand("discardForSeven", { resources: selected });
      if (onlineSession.modalKind === expectedModalKind) hideModal();
    } catch (error) {
      addLog(onlineErrorMessage(error));
      submit.disabled = false;
    }
  });

  function refresh() {
    const total = resourceBundleTotal(selected);
    const remaining = Math.max(0, view.needed - total);
    const percent = view.needed > 0 ? Math.min(100, Math.round(total / view.needed * 100)) : 0;
    progressLabel.textContent = `${total}/${view.needed}장 선택`;
    progressTrack.setAttribute("aria-valuenow", String(total));
    progressBar.style.width = `${percent}%`;
    summary.textContent = remaining > 0
      ? `${remaining}장을 더 선택하세요.`
      : "버릴 카드 선택이 완료되었습니다.";
    summary.dataset.complete = remaining === 0 ? "true" : "false";
    submit.disabled = total !== view.needed;
  }

  Object.keys(RESOURCES).forEach((type) => {
    const info = RESOURCES[type];
    const row = document.createElement("div");
    row.className = "discard-picker-row";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "-";
    const amount = document.createElement("strong");
    amount.className = "discard-picker-amount";
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    const label = document.createElement("span");
    label.className = "discard-picker-label";
    const name = document.createElement("span");
    name.textContent = info.name;
    const owned = document.createElement("small");
    owned.textContent = `보유 ${player?.resources?.[type] || 0}`;
    label.innerHTML = resourceIconToken(type, { className: "discard-picker-icon" });
    label.append(name, owned);
    function paint() {
      amount.textContent = String(selected[type]);
      minus.disabled = selected[type] <= 0;
      plus.disabled = selected[type] >= (player?.resources?.[type] || 0) || resourceBundleTotal(selected) >= view.needed;
      row.dataset.selected = selected[type] > 0 ? "true" : "false";
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
  modalContent.append(panel);
  refresh();
}

function showOnlineChooseRobberVictimModal(view) {
  onlineSession.modalKind = "choose-robber-victim";
  showModal("약탈 대상 선택", "자원 1장을 무작위로 가져올 대상을 선택하세요.");
  const panel = document.createElement("div");
  panel.className = "robber-victim-picker";
  const head = document.createElement("div");
  head.className = "robber-victim-head";
  const title = document.createElement("strong");
  title.textContent = "강도와 인접한 상대";
  const hint = document.createElement("span");
  hint.textContent = "상대 1명을 선택하면 보유 자원 중 1장을 무작위로 가져옵니다.";
  head.append(title, hint);
  const list = document.createElement("div");
  list.className = "robber-victim-list";
  panel.append(head, list);
  const victims = Array.isArray(view.victims) ? view.victims : [];
  if (!victims.length) {
    const empty = document.createElement("p");
    empty.className = "robber-victim-empty";
    empty.textContent = "선택 가능한 대상이 없습니다. 상태가 갱신되는 중입니다.";
    list.append(empty);
    modalContent.append(panel);
    return;
  }
  const buttons = [];
  let requestInFlight = false;
  victims.forEach((victim) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "robber-victim-card victim-button";
    const avatar = document.createElement("span");
    avatar.className = "robber-victim-avatar";
    avatar.textContent = String(victim.name || "?").trim().charAt(0) || "?";
    avatar.setAttribute("aria-hidden", "true");
    const body = document.createElement("span");
    body.className = "robber-victim-body";
    const name = document.createElement("strong");
    name.textContent = victim.name || "플레이어";
    const note = document.createElement("small");
    note.textContent = "무작위 자원 1장";
    body.append(name, note);
    const count = document.createElement("span");
    count.className = "robber-victim-count";
    count.textContent = `${victim.resourceCount}장`;
    button.append(avatar, body, count);
    button.addEventListener("click", async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      const expectedModalKind = onlineSession.modalKind;
      buttons.forEach((entry) => {
        entry.disabled = true;
      });
      try {
        await sendOnlineCommand("chooseRobberVictim", { victimSeatIndex: victim.seatIndex });
        if (onlineSession.modalKind === expectedModalKind) hideModal();
      } catch (error) {
        addLog(onlineErrorMessage(error));
        requestInFlight = false;
        buttons.forEach((entry) => {
          entry.disabled = false;
        });
      }
    });
    buttons.push(button);
    list.append(button);
  });
  modalContent.append(panel);
}

function showRobberResultModal(result) {
  if (!shouldShowRobberResultModal(result)) {
    rememberRobberResult(result);
    return;
  }
  if (hasSeenRobberResult(result)) return;
  rememberRobberResult(result);
  onlineSession.lastRobberResultId = result.id;
  const actor = game.players[result.actorSeatIndex]?.name || "플레이어";
  const victim = result.victimSeatIndex === null || result.victimSeatIndex === undefined ? null : game.players[result.victimSeatIndex]?.name;
  if (result.reason === "NO_VICTIM" || !victim) {
    setActionNotice("도둑 결과", "도둑이 이동했지만 빼앗을 수 있는 자원이 없습니다.", result.id);
  } else {
    const resource = canSeeRobberResultResource(result) && result.resource ? `${RESOURCES[result.resource]?.name || result.resource} 1장` : "자원 1장";
    const isActor = isOnlinePlaying() ? game.viewerSeatIndex === result.actorSeatIndex : game.active === result.actorSeatIndex;
    const text = isActor
      ? `${victim}에게서 ${resource}을 빼앗았습니다.`
      : `${actor}에게 ${resource}을 빼앗겼습니다.`;
    setActionNotice("도둑 결과", text, result.id);
  }
}

function canSeeRobberResultResource(result) {
  if (!result) return false;
  if (!isOnlinePlaying()) return true;
  return game.viewerSeatIndex === result.actorSeatIndex || game.viewerSeatIndex === result.victimSeatIndex;
}

function shouldShowRobberResultModal(result) {
  if (!result?.id) return false;
  if (!isOnlinePlaying()) return true;
  if (result.reason === "NO_VICTIM") return game.viewerSeatIndex === result.actorSeatIndex;
  return game.viewerSeatIndex === result.actorSeatIndex || game.viewerSeatIndex === result.victimSeatIndex;
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
    && !onlineSession.diceRollPending
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
  if (activePlayerIsBot()) return "봇 차례입니다. 봇이 행동을 처리하는 중입니다.";
  if (!isMyOnlineTurn()) return "지금은 내 차례가 아닙니다.";
  if (action === "roll" && game.rolled) return "이미 주사위를 굴렸습니다.";
  if (action === "endTurn" && !game.rolled) return "주사위를 굴린 뒤 턴을 넘길 수 있습니다.";
  if (action === "endTurn" && onlineSession.state?.pendingPlayerTrade) return "진행 중인 플레이어 교환을 먼저 취소하거나 확정하세요.";
  if (game.pendingActionView) return "진행 중인 강도/버리기 처리를 먼저 완료해야 합니다.";
  return "지금은 진행할 수 없습니다.";
}

function onlineBuildBlockedMessage(kind) {
  if (!isOnlinePlayPhase()) return "현재는 건설 단계가 아닙니다.";
  if (onlineSession.state?.status === "ended") return "종료된 방에서는 건설할 수 없습니다.";
  if (disconnectedOnlinePlayers().length) return "재접속 대기 중에는 건설할 수 없습니다.";
  if (activePlayerIsBot()) return "봇 차례입니다. 봇이 행동을 처리하는 중입니다.";
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
  if (activePlayerIsBot()) return "봇 차례입니다. 봇이 행동을 처리하는 중입니다.";
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
    completeDicePressForRoll();
    const clientHoldMs = takeRollHoldMs();
    onlineSession.diceRollPending = true;
    renderDice();
    renderControls();
    await sendOnlineCommand("rollDice", {
      clientHoldMs,
      clientEntropy: makeDiceSeedMaterial(clientHoldMs, "online-client"),
      clientStartedAt: rollHoldState.lastStartedAt || Date.now()
    });
  } catch (error) {
    rollHoldState.motionState = game.lastDice ? "settled" : "idle";
    addLog(onlineErrorMessage(error));
    render();
  } finally {
    onlineSession.diceRollPending = false;
    renderDice();
    renderControls();
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

function inferLogType(text = "") {
  if (/주사위|차례/.test(text)) return "turn";
  if (/건설|마을|도로|도시|업그레이드/.test(text)) return "build";
  if (/교환|거래/.test(text)) return "trade";
  if (/개발 카드|기사|풍년|독점/.test(text)) return "dev";
  if (/도둑|약탈|버림|버리기|가져왔/.test(text)) return "robber";
  if (/승리|점/.test(text)) return "score";
  if (/봇/.test(text)) return "bot";
  return "system";
}

function isImportantLogType(type) {
  return ["build", "trade", "dev", "robber", "score", "bot"].includes(type);
}

function addLog(text, type = "") {
  const logType = type || inferLogType(text);
  const item = document.createElement("li");
  item.className = `log-entry log-${logType}${isImportantLogType(logType) ? " is-important" : ""}`;
  item.dataset.type = logType;
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

function hideModalThenShowNextOnlineNotice() {
  hideModal();
  showNextOnlineNotice();
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

function victoryModalKey(winnerSeatIndex, revision = null) {
  return `${onlineSession.roomId || "offline"}:${revision ?? "local"}:${winnerSeatIndex}`;
}

function showVictoryModal(winnerSeatIndex, revision = null) {
  const winner = game.players[winnerSeatIndex];
  if (!winner) return;
  const key = victoryModalKey(winnerSeatIndex, revision);
  if (shownVictoryModalKey === key) return;
  shownVictoryModalKey = key;
  onlineSession.modalKind = "victory";

  const score = totalPoints(winner);
  const hiddenCount = Number(game.winnerSummary?.victoryDevCount ?? winner.victoryDevCount ?? hiddenVictoryPoints(winner) ?? 0);
  showModal(`${winner.name} 승리!`, `${score}점 달성${hiddenCount > 0 ? `, 승점 카드 ${hiddenCount}장 포함` : ""}`);

  const summary = document.createElement("div");
  summary.className = "victory-modal-summary";
  summary.innerHTML = [
    `<div><span>최종 점수</span><strong>${score}점</strong></div>`,
    `<div><span>최장 교역로</span><strong>${game.longestRoad === winnerSeatIndex ? "획득" : "-"}</strong></div>`,
    `<div><span>최다 기사력</span><strong>${game.largestArmy === winnerSeatIndex ? "획득" : "-"}</strong></div>`,
    `<div><span>승점 카드</span><strong>${hiddenCount}장</strong></div>`
  ].join("");
  modalContent.append(summary);

  addModalButton("결과 보기", hideModal, "secondary-button");
  if (!isOnlinePlaying()) addModalButton("새 게임", resetToSetup);
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

function canOpenFeelSettingsModal() {
  if (!onlineSession.modalKind) return true;
  return onlineSession.modalKind === "feel-settings";
}

function appendRadioGroup(parent, legendText, name, options, value, onChange) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "feel-setting-group";
  const legend = document.createElement("legend");
  legend.textContent = legendText;
  const row = document.createElement("div");
  row.className = "segmented-control";
  options.forEach((option) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = option.value;
    input.checked = option.value === value;
    input.addEventListener("change", () => {
      if (input.checked) onChange(option.value);
    });
    const text = document.createElement("span");
    text.textContent = option.label;
    label.append(input, text);
    row.append(label);
  });
  fieldset.append(legend, row);
  parent.append(fieldset);
}

function appendToggle(parent, labelText, checked, onChange) {
  const label = document.createElement("label");
  label.className = "feel-setting-toggle";
  const text = document.createElement("span");
  text.textContent = labelText;
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(checked);
  input.addEventListener("change", () => onChange(input.checked));
  label.append(text, input);
  parent.append(label);
  return input;
}

function appendVolumeControl(parent, value, onChange) {
  const label = document.createElement("label");
  label.className = "feel-setting-range";
  const title = document.createElement("span");
  title.textContent = "효과음 볼륨";
  const output = document.createElement("strong");
  output.textContent = `${value}`;
  const input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = "100";
  input.step = "1";
  input.value = String(value);
  input.setAttribute("aria-label", "효과음 볼륨");
  input.addEventListener("input", () => {
    output.textContent = input.value;
    onChange(Number(input.value));
  });
  label.append(title, input, output);
  parent.append(label);
}

function handleFeelSettingsKeydown(event, returnFocusTo) {
  if (onlineSession.modalKind !== "feel-settings") return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeFeelSettingsModal(returnFocusTo);
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...modalOverlay.querySelectorAll("button, input, select, textarea, [tabindex]:not([tabindex='-1'])")]
    .filter((element) => !element.disabled && element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function closeFeelSettingsModal(returnFocusTo = feelSettingsButton) {
  hideModal();
  returnFocusTo?.focus?.();
}

function showFeelSettingsModal() {
  if (!canOpenFeelSettingsModal()) return;
  const returnFocusTo = document.activeElement;
  onlineSession.modalKind = "feel-settings";
  showModal("효과 설정", "모션과 효과음 선호를 조정합니다.");
  onlineSession.modalKind = "feel-settings";

  const panel = document.createElement("div");
  panel.className = "feel-settings-panel";

  let draft = sanitizeFeelSettings(currentFeelSettings);
  function commit(next) {
    draft = saveFeelSettings({ ...draft, ...next });
    renderFeelSettingsSummary();
  }

  appendRadioGroup(panel, "모션 효과", "feel-motion-mode", [
    { value: "auto", label: "자동" },
    { value: "reduced", label: "줄이기" },
    { value: "on", label: "켜기" }
  ], draft.motionMode, (motionMode) => commit({ motionMode }));

  appendToggle(panel, "효과음", draft.soundEnabled, (soundEnabled) => {
    commit({ soundEnabled });
    if (soundEnabled) enableSoundEffects().then(renderFeelSettingsSummary);
  });
  appendVolumeControl(panel, draft.soundVolume, (soundVolume) => {
    setSoundVolume(soundVolume);
    draft = sanitizeFeelSettings({ ...draft, soundVolume });
    renderFeelSettingsSummary();
  });

  appendRadioGroup(panel, "내 차례 강조", "feel-turn-emphasis", [
    { value: "normal", label: "기본" },
    { value: "strong", label: "강하게" }
  ], draft.turnEmphasis, (turnEmphasis) => commit({ turnEmphasis }));

  appendToggle(panel, "중요 이벤트 강조", draft.importantEventEmphasis, (importantEventEmphasis) => commit({ importantEventEmphasis }));
  appendToggle(panel, "내 차례 효과음", draft.turnSoundEnabled, (turnSoundEnabled) => commit({ turnSoundEnabled }));
  appendToggle(panel, "중요 이벤트 효과음", draft.importantEventSoundEnabled, (importantEventSoundEnabled) => commit({ importantEventSoundEnabled }));

  const summary = document.createElement("p");
  summary.className = "feel-settings-summary";
  summary.setAttribute("role", "status");
  function renderFeelSettingsSummary() {
    const effective = getEffectiveFeelSettings(draft);
    const audio = getAudioRuntimeState();
    const soundStatus = effective.soundEnabled
      ? (audio.unlocked ? "켜기" : "켜기 대기")
      : "끄기";
    summary.textContent = `적용 모션: ${effective.effectiveMotion === "reduced" ? "줄이기" : "켜기"} / 효과음: ${soundStatus} / 볼륨 ${effective.soundVolume}`;
  }
  renderFeelSettingsSummary();
  panel.append(summary);

  modalContent.append(panel);
  const close = addModalButton("닫기", () => closeFeelSettingsModal(returnFocusTo));
  modalOverlay.addEventListener("keydown", function onKeydown(event) {
    if (onlineSession.modalKind !== "feel-settings") {
      modalOverlay.removeEventListener("keydown", onKeydown);
      return;
    }
    handleFeelSettingsKeydown(event, returnFocusTo);
  });
  requestAnimationFrame(() => {
    const first = modalContent.querySelector("input, button");
    (first || close).focus();
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isMobileViewport() {
  return window.matchMedia?.(MOBILE_VIEWPORT_QUERY).matches || (window.innerWidth <= 780 && window.innerHeight >= window.innerWidth);
}

function isLandscapePanelViewport() {
  return window.matchMedia?.(LANDSCAPE_PANEL_QUERY).matches || (window.innerWidth <= 1150 && window.innerWidth > window.innerHeight);
}

function shouldDockDiceInControlPanel() {
  return !isMobileViewport();
}

function rememberResponsiveHome(key, node) {
  if (!node || responsivePanelRuntime[key]) return;
  responsivePanelRuntime[key] = {
    parent: node.parentElement,
    nextSibling: node.nextSibling
  };
}

function restoreResponsiveNode(key, node) {
  const home = responsivePanelRuntime[key];
  if (!home?.parent || !node || node.parentElement === home.parent) return;
  home.parent.insertBefore(node, home.nextSibling);
}

function syncResponsivePanelPlacement() {
  const useLandscapePanel = isLandscapePanelViewport();
  const dockDiceInPanel = shouldDockDiceInControlPanel();
  appEl?.classList.toggle("is-landscape-panel-layout", useLandscapePanel);
  appEl?.classList.toggle("is-dice-panel-docked", dockDiceInPanel);
  playersPanel?.classList.toggle("is-landscape-hidden", useLandscapePanel);
  rememberResponsiveHome("playerStripHome", boardPlayerStrip);
  rememberResponsiveHome("dicePanelHome", dicePanel);

  if (useLandscapePanel) {
    if (boardPlayerStrip && landscapePlayerStripMount && boardPlayerStrip.parentElement !== landscapePlayerStripMount) {
      landscapePlayerStripMount.append(boardPlayerStrip);
    }
    responsivePanelRuntime.movedToLandscapePanel = true;
  } else if (responsivePanelRuntime.movedToLandscapePanel) {
    restoreResponsiveNode("playerStripHome", boardPlayerStrip);
    responsivePanelRuntime.movedToLandscapePanel = false;
  }

  if (dockDiceInPanel) {
    if (dicePanel && landscapeDiceMount && dicePanel.parentElement !== landscapeDiceMount) {
      clearFloatingPanelTransforms();
      landscapeDiceMount.append(dicePanel);
    }
  } else {
    restoreResponsiveNode("dicePanelHome", dicePanel);
  }
}

function clearFloatingPanelTransforms() {
  [dicePanel].forEach((panel) => {
    if (!panel) return;
    panel.classList.remove("dragging");
    panel.style.transform = "";
    delete panel.dataset.x;
    delete panel.dataset.y;
  });
}

function syncFloatingPanelsForViewport() {
  syncResponsivePanelPlacement();
  if (isMobileViewport() || shouldDockDiceInControlPanel()) clearFloatingPanelTransforms();
  else {
    restoreDicePanelPosition();
  }
}

function restoreCostCardPosition() {
  if (!costReferenceCard) return;
  costReferenceCard.classList.remove("dragging");
  costReferenceCard.style.transform = "";
  delete costReferenceCard.dataset.x;
  delete costReferenceCard.dataset.y;
  try {
    localStorage.removeItem("catanCostCardPosition");
  } catch {
    // Storage cleanup is best-effort.
  }
}

function initCostCardDrag() {
  if (!costReferenceCard || !costReferenceHandle) return;
  restoreCostCardPosition();
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
  const saved = localStorage.getItem("catanDicePanelPosition");
  if (!saved) return;
  try {
    const { x, y } = JSON.parse(saved);
    applyDicePanelPosition(x, y);
  } catch {
    localStorage.removeItem("catanDicePanelPosition");
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
    localStorage.setItem("catanDicePanelPosition", JSON.stringify({
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
  if (!canBuildSettlement(player.id, vertexId, setup)) return rejectLocalAction("마을을 지을 수 없는 위치입니다.", "buildSettlement", "INVALID_PLACEMENT", vertexId);
  if (!setup) {
    if (!canTakePostRollAction()) return rejectLocalAction("주사위를 굴린 뒤 건설할 수 있습니다.", "buildSettlement", "ROLL_REQUIRED", vertexId);
    if (player.settlements <= 0) return rejectLocalAction("남은 마을 말이 없습니다.", "buildSettlement", "NO_PIECES", vertexId);
    if (!hasResources(player, COSTS.settlement)) return rejectLocalAction("마을 비용이 부족합니다.", "buildSettlement", "NOT_ENOUGH_RESOURCES", vertexId);
    spend(player, COSTS.settlement);
  }
  vertices[vertexId].owner = player.id;
  vertices[vertexId].city = false;
  player.settlements -= 1;
  game.pendingSettlement = vertexId;
  addLog(`${player.name}: 마을 건설.`);
  emitBuildCompletedCue("settlement", vertexId, player.id);
  if (setup && game.phase === "setup2") grantInitialResources(player, vertexId);
  updateLongestRoad();
  if (!setup) checkWin();
  return true;
}

function buildRoad(player, edgeId, setup = false) {
  if (blockOnlineGameAction()) return false;
  if (!canBuildRoad(player.id, edgeId, setup)) return rejectLocalAction("도로를 지을 수 없는 위치입니다.", "buildRoad", "INVALID_PLACEMENT", edgeId);
  const freeRoad = selectedAction === "roadBuilding" && game.pendingFreeRoads > 0;
  if (!setup && !freeRoad) {
    if (!canTakePostRollAction()) return rejectLocalAction("주사위를 굴린 뒤 건설할 수 있습니다.", "buildRoad", "ROLL_REQUIRED", edgeId);
    if (player.roads <= 0) return rejectLocalAction("남은 도로 말이 없습니다.", "buildRoad", "NO_PIECES", edgeId);
    if (!hasResources(player, COSTS.road)) return rejectLocalAction("도로 비용이 부족합니다.", "buildRoad", "NOT_ENOUGH_RESOURCES", edgeId);
    spend(player, COSTS.road);
  }
  if (freeRoad && player.roads <= 0) return rejectLocalAction("남은 도로 말이 없습니다.", "buildRoad", "NO_PIECES", edgeId);
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
  emitBuildCompletedCue("road", edgeId, player.id);
  updateLongestRoad();
  checkWin();
  return true;
}

function buildCity(player, vertexId) {
  if (blockOnlineGameAction()) return false;
  if (!canTakePostRollAction()) return rejectLocalAction("주사위를 굴린 뒤 도시로 업그레이드할 수 있습니다.", "buildCity", "ROLL_REQUIRED", vertexId);
  const vertex = vertices[vertexId];
  if (vertex.owner !== player.id || vertex.city) return rejectLocalAction("내 마을만 도시로 올릴 수 있습니다.", "buildCity", "INVALID_PLACEMENT", vertexId);
  if (player.cities <= 0) return rejectLocalAction("남은 도시 말이 없습니다.", "buildCity", "NO_PIECES", vertexId);
  if (!hasResources(player, COSTS.city)) return rejectLocalAction("도시 비용이 부족합니다.", "buildCity", "NOT_ENOUGH_RESOURCES", vertexId);
  spend(player, COSTS.city);
  vertex.city = true;
  player.cities -= 1;
  player.settlements += 1;
  addLog(`${player.name}: 도시 업그레이드.`);
  emitBuildCompletedCue("city", vertexId, player.id);
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
  const total = die1 + die2;
  const animationSeed = makeDiceSeedMaterial(takeRollHoldMs(), "offline");
  return { die1, die2, total, animationSeed, rollId: `${makeCueScopeId()}-${game.round}-${game.active}-${die1}-${die2}` };
}

function renderDice() {
  const dice = game.lastDice;
  const rollKey = makeDiceRollKey(dice);
  if (dice) {
    const shouldEmitDiceCue = diceTotalRevealState.rollKey !== rollKey || !diceTotalRevealState.cueEmitted;
    rollHoldState.motionState = "settled";
    renderDieCube(dieOne, dice.die1, rollKey ? `${rollKey}:die1` : "");
    renderDieCube(dieTwo, dice.die2, rollKey ? `${rollKey}:die2` : "");
    updateDiceTotalReveal(dice, rollKey);
    syncDiceMotionClasses();
    if (shouldEmitDiceCue) {
      emitDiceAndProductionCues(dice);
      diceTotalRevealState.cueEmitted = true;
    }
    return;
  }

  if (rollHoldState.motionState === "holding" || rollHoldState.motionState === "resolving" || onlineSession.diceRollPending) {
    if (onlineSession.diceRollPending && rollHoldState.motionState === "idle") rollHoldState.motionState = "resolving";
    showDiceSpinningPreview();
    syncDiceMotionClasses();
    return;
  }

  rollHoldState.motionState = "idle";
  renderDieCube(dieOne, null, "");
  renderDieCube(dieTwo, null, "");
  resetDiceTotalReveal();
  syncDiceMotionClasses();
}

function clearDiceTotalRevealTimer() {
  if (!diceTotalRevealState.timer) return;
  window.clearTimeout(diceTotalRevealState.timer);
  diceTotalRevealState.timer = null;
}

function setDiceTotalVisible(dice, visible) {
  const wasVisible = diceTotalRevealState.visible;
  diceTotalRevealState.visible = visible;
  diceTotal.textContent = visible ? dice.total : "-";
  diceTotal.classList.toggle("dice-total-pending", !visible);
  diceTotal.setAttribute("aria-busy", visible ? "false" : "true");
  diceTotal.closest(".dice-readout")?.classList.toggle("dice-seven", visible && dice.total === 7);
  if (visible && !wasVisible && !diceTotalRevealState.settlePlayed) {
    diceTotalRevealState.settlePlayed = true;
    playDiceSettleSound();
  }
}

function updateDiceTotalReveal(dice, rollKey) {
  if (!dice) {
    resetDiceTotalReveal();
    return;
  }
  const reduced = getEffectiveFeelSettings().effectiveMotion === "reduced";
  if (diceTotalRevealState.rollKey !== rollKey) {
    clearDiceTotalRevealTimer();
    diceTotalRevealState.rollKey = rollKey;
    diceTotalRevealState.settlePlayed = false;
    setDiceTotalVisible(dice, reduced);
    if (!reduced) {
      diceTotalRevealState.timer = window.setTimeout(() => {
        diceTotalRevealState.timer = null;
        if (makeDiceRollKey(game.lastDice) !== rollKey) return;
        setDiceTotalVisible(game.lastDice, true);
      }, 760);
    }
    return;
  }

  setDiceTotalVisible(dice, diceTotalRevealState.visible || reduced);
}

function resetDiceTotalReveal() {
  clearDiceTotalRevealTimer();
  diceTotalRevealState.rollKey = "";
  diceTotalRevealState.visible = false;
  diceTotalRevealState.settlePlayed = false;
  diceTotalRevealState.cueEmitted = false;
  diceTotal.textContent = "-";
  diceTotal.classList.remove("dice-total-pending");
  diceTotal.setAttribute("aria-busy", "false");
  diceTotal.closest(".dice-readout")?.classList.remove("dice-seven");
}

function makeDiceRollKey(dice) {
  if (!dice) return "";
  return [dice.animationSeed || "", dice.rollId || "", dice.die1, dice.die2, dice.total].join(":");
}

function hashStringToUint32(seed) {
  const text = String(seed || "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRange(seed, min, max) {
  const normalized = hashStringToUint32(seed) / 0xffffffff;
  return min + (max - min) * normalized;
}

function makeDiceMotionStyle(value, rollKey = "") {
  const normalized = Number(value);
  if (!(normalized >= 1 && normalized <= 6)) return "";
  const seed = `${normalized}:${rollKey || "static"}`;
  const properties = {
    "--dice-roll-x-start": `${Math.round(seededRange(`${seed}:x-start`, 360, 1080))}deg`,
    "--dice-roll-y-start": `${Math.round(seededRange(`${seed}:y-start`, 360, 1080))}deg`,
    "--dice-roll-z-start": `${Math.round(seededRange(`${seed}:z-start`, -180, 180))}deg`,
    "--dice-roll-x-mid": `${Math.round(seededRange(`${seed}:x-mid`, -28, 28))}deg`,
    "--dice-roll-y-mid": `${Math.round(seededRange(`${seed}:y-mid`, -28, 28))}deg`,
    "--dice-roll-pop": seededRange(`${seed}:pop`, 1.03, 1.1).toFixed(3),
    "--dice-roll-duration": `${Math.round(seededRange(`${seed}:duration`, 420, 620))}ms`
  };
  return Object.entries(properties).map(([name, value]) => `${name}: ${value}`).join("; ");
}

function legacyRenderDieCube(element, value, rollKey = "") {
  if (!element) return;
  const normalized = Number(value);
  const display = normalized >= 1 && normalized <= 6 ? normalized : null;
  const nextKey = `${display || "none"}:${rollKey}`;
  if (element.dataset.renderKey === nextKey) return;
  element.dataset.renderKey = nextKey;
  element.dataset.value = display ? String(display) : "none";
  element.setAttribute("aria-label", display ? `주사위 ${display}` : "주사위 없음");
  ensureDieCubeStructure(element);
  renderDieCube(element, value, rollKey);
}

function legacyRenderPressingDieCube(element, rollKey = "", motionValue = 1) {
  if (!element) return;
  const nextKey = `pressing:${rollKey}`;
  if (element.dataset.renderKey === nextKey) return;
  element.dataset.renderKey = nextKey;
  element.dataset.value = "none";
  element.setAttribute("aria-label", "주사위 굴리는 중");
  ensureDieCubeStructure(element);
  renderDieCube(element, null, rollKey, motionValue);
}

function legacyShowDicePressingPreview() {
  if (!dicePanel || game.lastDice) return;
  const pressKey = [makeCueScopeId(), game.round, game.active, rollHoldState.lastStartedAt || performance.now(), "pressing"].join(":");
  renderPressingDieCube(dieOne, `${pressKey}:die1`, 1);
  renderPressingDieCube(dieTwo, `${pressKey}:die2`, 6);
  diceTotal.textContent = "-";
  diceTotal.closest(".dice-readout")?.classList.remove("dice-seven");
}

function syncDiceMotionClasses() {
  if (!dicePanel) return;
  dicePanel.classList.toggle("dice-holding", rollHoldState.motionState === "holding");
  dicePanel.classList.toggle("dice-resolving", rollHoldState.motionState === "resolving");
  dicePanel.classList.toggle("dice-settled", rollHoldState.motionState === "settled" && Boolean(game.lastDice));
  dicePanel.classList.toggle("dice-rolling", rollHoldState.motionState === "resolving" && !game.lastDice);
}

function ensureDieCubeStructure(element) {
  if (!element) return;
  if (element.querySelector(".dice-motion-shell") && element.querySelector(".die-fallback")) return;
  element.innerHTML = `<span class="dice-motion-shell" aria-hidden="true"><span class="dice-cube">${[1, 2, 3, 4, 5, 6].map((face) => `<span class="dice-side dice-side-${face}">${face}</span>`).join("")}</span></span><span class="die-fallback">-</span>`;
}

function renderDieCube(element, value, rollKey = "", motionValue = value) {
  if (!element) return;
  ensureDieCubeStructure(element);
  const normalized = Number(value);
  const display = normalized >= 1 && normalized <= 6 ? normalized : null;
  const motionNormalized = Number(motionValue);
  const motionDisplay = motionNormalized >= 1 && motionNormalized <= 6 ? motionNormalized : display;
  const nextKey = `${display || "none"}:${motionDisplay || "none"}:${rollKey}`;
  if (element.dataset.renderKey !== nextKey) {
    element.dataset.renderKey = nextKey;
    element.dataset.value = display ? String(display) : "none";
    element.setAttribute("aria-label", display ? `二쇱궗??${display}` : "二쇱궗???놁쓬");
    const fallback = element.querySelector(".die-fallback");
    if (fallback) fallback.textContent = display ? String(display) : "-";
  }
  const shell = element.querySelector(".dice-motion-shell");
  if (shell) shell.setAttribute("style", makeDiceMotionStyle(motionDisplay, rollKey));
}

function renderPressingDieCube(element, rollKey = "", motionValue = 1) {
  renderDieCube(element, null, `pressing:${rollKey}`, motionValue);
  element?.setAttribute("aria-label", "Rolling dice");
}

function showDiceSpinningPreview() {
  if (!dicePanel || game.lastDice) return;
  const pressKey = [makeCueScopeId(), game.round, game.active, rollHoldState.lastStartedAt || performance.now(), rollHoldState.motionState].join(":");
  renderPressingDieCube(dieOne, `${pressKey}:die1`, 1);
  renderPressingDieCube(dieTwo, `${pressKey}:die2`, 6);
  diceTotal.textContent = "-";
  diceTotal.closest(".dice-readout")?.classList.remove("dice-seven");
}

function clearDicePressCleanupTimer() {
  if (!rollHoldState.releaseCleanupTimer) return;
  window.clearTimeout(rollHoldState.releaseCleanupTimer);
  rollHoldState.releaseCleanupTimer = null;
}

function setDiceHoldGaugeState(state) {
  if (!diceHoldGauge) return;
  diceHoldGauge.classList.toggle("is-charging", state === "charging");
  diceHoldGauge.classList.toggle("is-draining", state === "draining");
  diceHoldGauge.classList.toggle("is-idle", state === "idle");
}

function startDiceHoldGauge() {
  if (!diceHoldGauge) return;
  setDiceHoldGaugeState("idle");
  void diceHoldGauge.offsetWidth;
  setDiceHoldGaugeState("charging");
}

function drainDiceHoldGauge() {
  if (!diceHoldGauge) return;
  setDiceHoldGaugeState("draining");
}

function captureDiceHoldMs() {
  if (!rollHoldState.startedAt) return;
  rollHoldState.lastHoldMs = clamp(performance.now() - rollHoldState.startedAt, 0, 3000);
}

function completeDicePressForRoll() {
  captureDiceHoldMs();
  clearDicePressCleanupTimer();
  rollHoldState.pointerId = null;
  rollHoldState.startedAt = 0;
  rollHoldState.awaitingClick = false;
  rollHoldState.motionState = "resolving";
  syncDiceMotionClasses();
  drainDiceHoldGauge();
}

function scheduleDicePressCleanup() {
  clearDicePressCleanupTimer();
  rollHoldState.releaseCleanupTimer = window.setTimeout(() => {
    rollHoldState.releaseCleanupTimer = null;
    if (rollHoldState.startedAt || game.lastDice) return;
    rollHoldState.awaitingClick = false;
    rollHoldState.motionState = "idle";
    setDiceHoldGaugeState("idle");
    renderDice();
  }, 900);
}

function startDicePress(event) {
  if (rollButton?.disabled) return;
  if (event.button !== undefined && event.button !== 0) return;
  if (rollHoldState.startedAt) return;
  clearDicePressCleanupTimer();
  rollHoldState.pointerId = event.pointerId ?? null;
  rollHoldState.startedAt = performance.now();
  rollHoldState.lastStartedAt = rollHoldState.startedAt;
  rollHoldState.awaitingClick = false;
  rollHoldState.motionState = "holding";
  startDiceHoldGauge();
  showDiceSpinningPreview();
  syncDiceMotionClasses();
}

function finishDicePress(event) {
  if (rollHoldState.pointerId !== null && event.pointerId !== rollHoldState.pointerId) return;
  captureDiceHoldMs();
  playDiceReleaseSound();
  rollHoldState.pointerId = null;
  rollHoldState.startedAt = 0;
  rollHoldState.awaitingClick = true;
  rollHoldState.motionState = "resolving";
  drainDiceHoldGauge();
  syncDiceMotionClasses();
  scheduleDicePressCleanup();
}

function cancelDicePress() {
  clearDicePressCleanupTimer();
  rollHoldState.pointerId = null;
  rollHoldState.startedAt = 0;
  rollHoldState.awaitingClick = false;
  rollHoldState.motionState = game.lastDice ? "settled" : "idle";
  drainDiceHoldGauge();
  if (!game.lastDice) renderDice();
  else syncDiceMotionClasses();
}

function startDiceKeyboardPress(event) {
  if (event.key !== " " && event.key !== "Enter") return;
  startDicePress(event);
}

function finishDiceKeyboardPress(event) {
  if (event.key !== " " && event.key !== "Enter") return;
  finishDicePress(event);
}

function takeRollHoldMs() {
  const holdMs = Math.round(clamp(rollHoldState.lastHoldMs || 0, 0, 3000));
  rollHoldState.lastHoldMs = 0;
  return holdMs;
}

function makeDiceSeedMaterial(holdMs = 0, source = "local") {
  const randomPart = window.crypto?.getRandomValues
    ? Array.from(window.crypto.getRandomValues(new Uint32Array(2))).join("-")
    : Math.random().toString(36).slice(2);
  return [makeCueScopeId(), source, game.round, game.active, holdMs, Math.round(performance.now()), randomPart].join(":");
}

function emitDiceAndProductionCues(dice) {
  const scopeId = makeCueScopeId();
  const revision = isOnlinePlaying() ? onlineSession.revision : (dice.rollId || `${game.round}-${game.active}-${dice.total}`);
  const diceCue = makeRawCueCandidate(dice.total === 7 ? "sevenRolled" : "diceRolled", {
    scopeId,
    revision,
    entityId: `seat-${game.active}`,
    detailKey: `${dice.die1}-${dice.die2}`,
    channels: { visual: true, sound: true },
    payload: { dice: { die1: dice.die1, die2: dice.die2 }, total: dice.total, animationSeed: dice.animationSeed || null }
  });
  const diceCueResult = emitGameCue(diceCue, { settings: currentFeelSettings });
  if (dice.total === 7 && diceCueResult.played) {
    playFeelVisualCue("motion-alert-cue", [dicePanel, turnStagePanel, guideTitle, guideText]);
  }

  (game.lastProduction || []).forEach((entry, index) => {
    emitGameCue(makeRawCueCandidate("resourcesProduced", {
      scopeId,
      revision,
      entityId: `seat-${entry.seatIndex}`,
      detailKey: `${entry.seatIndex}-${entry.resource || "generic"}-${index}`,
      channels: { visual: true, sound: true },
      payload: {
        seatIndex: entry.seatIndex,
        resourceType: entry.resource || entry.resourceType || null,
        amount: entry.amount,
        cardDelta: entry.amount
      }
    }), { settings: currentFeelSettings });
  });
}

function playFeelVisualCue(className, elements = [], duration = 560) {
  const targets = elements.filter(Boolean);
  if (!targets.length) return;
  const reduced = getEffectiveFeelSettings().effectiveMotion === "reduced";
  targets.forEach((element) => {
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    if (!reduced) {
      window.setTimeout(() => element.classList.remove(className), duration);
    }
  });
}

function pendingActionCueType(view = game.pendingActionView) {
  if (!view) return null;
  if (view.type === "discardForSeven") return "discardPendingStarted";
  if (view.type === "moveRobber") return "robberMovePendingStarted";
  if (view.type === "chooseRobberVictim") return "robberVictimPendingStarted";
  return null;
}

function pendingActionCueDetail(view = game.pendingActionView) {
  if (!view) return "none";
  return [
    view.type || "unknown",
    view.source || "unknown",
    view.role || "waiting",
    view.actorSeatIndex ?? "none",
    view.fromTileId ?? view.tileId ?? "none",
    view.remainingCount ?? "none"
  ].join("-");
}

function emitPendingActionCue(view = game.pendingActionView, revision = null) {
  const type = pendingActionCueType(view);
  if (!type) return { played: false, reason: "no-pending-cue" };
  const cue = makeRawCueCandidate(type, {
    scopeId: makeCueScopeId(),
    revision: revision ?? (isOnlinePlaying() ? onlineSession.revision : nextOfflineCueRevision()),
    entityId: `seat-${view.role === "discarder" ? game.viewerSeatIndex : (view.actorSeatIndex ?? game.active)}`,
    detailKey: pendingActionCueDetail(view),
    visibility: "public",
    channels: { visual: true, sound: view.role === "discarder" || view.role === "actor" },
    payload: {
      pendingType: view.type,
      role: view.role || "waiting",
      actorSeatIndex: view.actorSeatIndex ?? null,
      remainingCount: view.remainingCount ?? null,
      fromTileId: view.fromTileId ?? null,
      tileId: view.tileId ?? null
    }
  });
  const result = emitGameCue(cue, { settings: currentFeelSettings });
  if (result.played) playFeelVisualCue("motion-alert-cue", [turnStagePanel, guideTitle, guideText], 520);
  return result;
}

function emitRobberMovedCue({ actorSeatIndex = game.active, fromTileId = null, toTileId = robberTile, revision = null } = {}) {
  const cue = makeRawCueCandidate("robberMoved", {
    scopeId: makeCueScopeId(),
    revision: revision ?? (isOnlinePlaying() ? onlineSession.revision : nextOfflineCueRevision()),
    entityId: `tile-${toTileId}`,
    detailKey: `${actorSeatIndex}-${fromTileId ?? "unknown"}-${toTileId}`,
    visibility: "public",
    channels: { visual: true, sound: true },
    payload: { actorSeatIndex, fromTileId, toTileId }
  });
  const result = emitGameCue(cue, { settings: currentFeelSettings });
  if (result.played) playFeelVisualCue("motion-robber-move", [svg?.querySelector(`[data-tile-id="${toTileId}"]`), turnStagePanel], 620);
  return result;
}

function emitRobberResultCue(result, revision = null) {
  if (!result) return { played: false, reason: "no-result" };
  const cue = makeRawCueCandidate("robberResult", {
    scopeId: makeCueScopeId(),
    revision: revision ?? (isOnlinePlaying() ? onlineSession.revision : nextOfflineCueRevision()),
    entityId: `seat-${result.actorSeatIndex ?? game.active}`,
    detailKey: result.id || `${result.actorSeatIndex}-${result.victimSeatIndex ?? "none"}-${result.reason || "steal"}`,
    visibility: "public",
    channels: { visual: true, sound: true },
    payload: {
      actorSeatIndex: result.actorSeatIndex ?? game.active,
      victimSeatIndex: result.victimSeatIndex ?? null,
      resourceType: result.resource || result.resourceType || null,
      reason: result.reason || null,
      id: result.id || null
    }
  });
  const cueResult = emitGameCue(cue, { settings: currentFeelSettings });
  if (cueResult.played) playFeelVisualCue("motion-alert-cue", [turnStagePanel, guideTitle, guideText], 520);
  return cueResult;
}

function actionFeedbackKey(kind, id) {
  return `${kind}:${id ?? "none"}`;
}

function actionFeedbackSelector(kind, id) {
  const attribute = kind === "edge" ? "data-edge" : "data-vertex";
  return `[${attribute}="${String(id)}"]`;
}

function applyActionFeedbackDom(kind, id, className, enabled) {
  const element = svg?.querySelector(actionFeedbackSelector(kind, id));
  if (!element) return false;
  element.classList.toggle(className, enabled);
  return true;
}

function markActionFeedback(kind, id, className) {
  const key = actionFeedbackKey(kind, id);
  actionFeedbackRuntime.recent.set(key, { className, active: false });

  requestAnimationFrame(() => {
    const entry = actionFeedbackRuntime.recent.get(key);
    if (!entry) return;
    entry.active = true;
    applyActionFeedbackDom(kind, id, className, true);
  });

  window.setTimeout(() => {
    const entry = actionFeedbackRuntime.recent.get(key);
    if (!entry) return;
    applyActionFeedbackDom(kind, id, entry.className, false);
    actionFeedbackRuntime.recent.delete(key);
  }, actionFeedbackRuntime.ttlMs);
}

function actionFeedbackClass(kind, id) {
  const entry = actionFeedbackRuntime.recent.get(actionFeedbackKey(kind, id));
  return entry?.active ? entry.className : "";
}

function emitActionResultCue(type, data = {}) {
  const cue = makeRawCueCandidate(type, {
    scopeId: makeCueScopeId(),
    revision: data.revision ?? (isOnlinePlaying() ? onlineSession.revision : nextOfflineCueRevision()),
    entityId: data.entityId || `seat-${data.seatIndex ?? game.active}`,
    detailKey: data.detailKey || "default",
    visibility: "public",
    channels: { visual: true, sound: true, log: false, toast: false },
    payload: data.payload || {}
  });
  return emitGameCue(cue, { settings: currentFeelSettings });
}

function emitBuildCompletedCue(buildType, targetId, seatIndex = game.active, revision = null) {
  const result = emitActionResultCue("buildCompleted", {
    revision,
    entityId: `${buildType}-${targetId}`,
    detailKey: `${buildType}:${targetId}`,
    seatIndex,
    payload: { buildType, targetId, seatIndex }
  });
  if (result.played) {
    markActionFeedback(buildType === "road" ? "edge" : "vertex", targetId, buildType === "road" ? "motion-road-draw" : "motion-build-pop");
  }
  return result;
}

function emitTradeCompletedCue(type, data = {}) {
  const result = emitActionResultCue(type, {
    revision: data.revision,
    entityId: `seat-${data.seatIndex ?? game.active}`,
    detailKey: data.detailKey || `${data.seatIndex ?? game.active}:${data.give || "offer"}:${data.get || "request"}:${data.createdAt || "local"}`,
    seatIndex: data.seatIndex ?? game.active,
    payload: data
  });
  if (result.played) playFeelVisualCue("motion-trade-swap", [playersList, tradeBox, turnStagePanel], 620);
  return result;
}

function emitDevCardCue(type, data = {}) {
  const result = emitActionResultCue(type, {
    revision: data.revision,
    entityId: `seat-${data.seatIndex ?? game.active}`,
    detailKey: `${data.seatIndex ?? game.active}:${data.publicCardType || "generic"}:${data.createdAt || "local"}`,
    seatIndex: data.seatIndex ?? game.active,
    payload: {
      seatIndex: data.seatIndex ?? game.active,
      publicCardType: data.publicCardType || "generic",
      cardDelta: data.cardDelta ?? (type === "devCardBought" ? 1 : 0)
    }
  });
  if (result.played) playFeelVisualCue("motion-build-pop", [devCardPanel, turnStagePanel], 560);
  return result;
}

function emitWinnerDeclaredCue(winnerSeatIndex, revision = null) {
  const result = emitActionResultCue("winnerDeclared", {
    revision,
    entityId: `seat-${winnerSeatIndex}`,
    detailKey: `winner:${winnerSeatIndex}`,
    seatIndex: winnerSeatIndex,
    payload: { winnerSeatIndex, publicScore: winnerSeatIndex === null ? null : totalPoints(game.players[winnerSeatIndex]) }
  });
  if (result.played) playFeelVisualCue("motion-win-highlight", [document.querySelector(`#seat${winnerSeatIndex}`), currentPlayerLabel, modalOverlay], 780);
  return result;
}

function commandRejectedGroup(code = "") {
  if (["NOT_ENOUGH_RESOURCES", "BANK_RESOURCE_EMPTY", "NO_PIECES"].includes(code)) return "resources";
  if (["SOCKET_CLOSED", "SOCKET_ERROR", "REQUEST_TIMEOUT", "ROOM_NOT_FOUND", "ROOM_ENDED"].includes(code)) return "network";
  return "rules";
}

function emitCommandRejectedCue(error, commandName = "local", detail = "generic") {
  const code = error?.code || "LOCAL_REJECTED";
  const group = commandRejectedGroup(code);
  const result = emitActionResultCue("commandRejected", {
    revision: isOnlinePlaying() ? onlineSession.revision : nextOfflineCueRevision(),
    entityId: `command-${commandName}`,
    detailKey: `${commandName}:${code}:${detail || "generic"}`,
    payload: { commandName, code, group, message: error?.message || "" }
  });
  if (result.played) playFeelVisualCue("motion-command-rejected", [turnStagePanel, guideText, dicePanel], 520);
  return result;
}

function rejectLocalAction(message, commandName, code = "INVALID_ACTION", detail = "generic") {
  const error = new Error(message);
  error.code = code;
  emitCommandRejectedCue(error, commandName, detail);
  addLog(message);
  return false;
}

function produce(total) {
  const payouts = {};
  const production = [];
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
    entries.forEach((entry) => {
      grantResourceFromBank(game.players[entry.playerId], type, entry.amount);
      production.push({ seatIndex: entry.playerId, resource: type, amount: entry.amount });
    });
  });
  game.lastProduction = production;
  return production;
}

function roll() {
  if (game.winner !== null) return;
  if (isOnlinePlayPhase()) {
    rollOnlineDice();
    return;
  }
  if (blockOnlineGameAction()) return;
  if (game.phase !== "play" || game.rolled || isResolvingForcedAction() || isBusyWithCardAction() || game.winner !== null) return;
  completeDicePressForRoll();
  const dice = rollDice();
  game.lastDice = dice;
  renderDice();
  game.rolled = true;
  if (dice.total === 7) {
    game.lastProduction = [];
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
    emitPendingActionCue({
      type: "moveRobber",
      source: "offline-seven",
      actorSeatIndex: game.active,
      role: "actor",
      fromTileId: robberTile
    });
    hideModal();
    return;
  }

  selectedAction = "discard";
  addLog("7이 나왔습니다. 8장 이상 보유자는 버릴 자원을 직접 선택해야 합니다.");
  emitPendingActionCue({
    type: "discardForSeven",
    source: "offline-seven",
    actorSeatIndex: game.active,
    role: "discarder",
    needed: game.pendingDiscards[0]?.needed || 0,
    remainingCount: game.pendingDiscards.length
  });
  showDiscardModal();
}

function showDiscardModal() {
  const pending = game.pendingDiscards[0];
  if (!pending) {
    selectedAction = "robber";
    hideModal();
    addLog("카드 버리기 완료. 도둑을 옮기세요.");
    emitPendingActionCue({
      type: "moveRobber",
      source: "offline-seven",
      actorSeatIndex: game.active,
      role: "actor",
      fromTileId: robberTile
    });
    render();
    return;
  }

  const player = game.players[pending.playerId];
  const selectedCount = Object.values(pending.selected).reduce((sum, amount) => sum + amount, 0);
  showModal("7 규칙: 카드 버리기", `${player.name}: ${pending.needed}장을 선택해 버리세요. 현재 ${selectedCount}/${pending.needed}장 선택했습니다.`);

  const progressTrack = document.createElement("div");
  progressTrack.className = "discard-progress";
  progressTrack.setAttribute("role", "progressbar");
  progressTrack.setAttribute("aria-valuemin", "0");
  progressTrack.setAttribute("aria-valuemax", String(pending.needed));
  progressTrack.setAttribute("aria-valuenow", String(selectedCount));
  const progressBar = document.createElement("span");
  const progressPercent = pending.needed > 0 ? Math.min(100, Math.round(selectedCount / pending.needed * 100)) : 0;
  progressBar.style.width = `${progressPercent}%`;
  progressTrack.append(progressBar);

  const grid = document.createElement("div");
  grid.className = "discard-grid";
  Object.entries(RESOURCES).forEach(([type, info]) => {
    const row = document.createElement("div");
    row.className = "discard-row";

    const label = document.createElement("span");
    label.innerHTML = `${resourceIconToken(type)}<span>${escapeHtml(info.name)} 보유 ${player.resources[type]}장</span>`;

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

  modalContent.append(progressTrack, grid);
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
  const fromTileId = robberTile;
  robberTile = tileId;
  emitRobberMovedCue({ actorSeatIndex: currentPlayer().id, fromTileId, toTileId: tileId });
  const victims = [...new Set(tiles[tileId].vertexIds.map((id) => vertices[id].owner).filter((id) => id !== null && id !== currentPlayer().id && resourceCount(game.players[id]) > 0))];
  if (victims.length > 1) {
    game.pendingRobberVictims = victims;
    selectedAction = "robberVictim";
    emitPendingActionCue({
      type: "chooseRobberVictim",
      source: "offline-seven",
      actorSeatIndex: currentPlayer().id,
      role: "actor",
      tileId
    });
    showRobberVictimModal();
  } else {
    if (victims.length === 1) {
      const resource = stealRandom(currentPlayer(), game.players[victims[0]]);
      emitRobberResultCue({
        actorSeatIndex: currentPlayer().id,
        victimSeatIndex: victims[0],
        resource,
        id: `offline-${Date.now()}-${currentPlayer().id}-${victims[0]}`
      });
    } else {
      emitRobberResultCue({
        actorSeatIndex: currentPlayer().id,
        victimSeatIndex: null,
        reason: "NO_VICTIM",
        id: `offline-${Date.now()}-${currentPlayer().id}-none`
      });
    }
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
      const resource = stealRandom(currentPlayer(), victim);
      emitRobberResultCue({
        actorSeatIndex: currentPlayer().id,
        victimSeatIndex: victim.id,
        resource,
        id: `offline-${Date.now()}-${currentPlayer().id}-${victim.id}`
      });
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
  if (!pool.length) return null;
  const type = pool[Math.floor(Math.random() * pool.length)];
  victim.resources[type] -= 1;
  thief.resources[type] += 1;
  addLog(`${thief.name}: ${victim.name}에게서 자원 1장을 가져왔습니다.`);
  return type;
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
  emitDevCardCue("devCardBought", { seatIndex: player.id, cardDelta: 1 });
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
  emitDevCardCue("devCardPlayed", { seatIndex: player.id, publicCardType: "knight" });
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
  emitDevCardCue("devCardPlayed", { seatIndex: player.id, publicCardType: "roadBuilding" });
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
    button.innerHTML = `${resourceIconToken(type)}<span>${escapeHtml(info.name)} (${game.bank[type]}장)</span>`;
    button.setAttribute("aria-label", `${info.name} ${game.bank[type]}장`);
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
        emitDevCardCue("devCardPlayed", { seatIndex: player.id, publicCardType: "yearPlenty" });
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
  return type === "generic" ? "3:1" : `${RESOURCES[type].name} 2:1`;
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
    button.innerHTML = `${resourceIconToken(type)}<span>${escapeHtml(info.name)}</span>`;
    button.setAttribute("aria-label", info.name);
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
      emitDevCardCue("devCardPlayed", { seatIndex: player.id, publicCardType: "monopoly" });
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
  emitTradeCompletedCue("bankTradeCompleted", { seatIndex: player.id, give, get, ratio, createdAt: Date.now() });
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
    giveButton.innerHTML = `<span>${resourceIconToken(type)}${escapeHtml(info.name)}</span><small>보유 ${player.resources?.[type] || 0} / ${ratios[type]}:1</small>`;
    giveButton.setAttribute("aria-label", `${info.name} 주기, 보유 ${player.resources?.[type] || 0}장`);
    giveButton.addEventListener("click", () => {
      selectedGive = type;
      if (selectedGet === type) selectedGet = "";
      refresh();
    });
    giveColumn.append(giveButton);

    const getButton = document.createElement("button");
    getButton.type = "button";
    getButton.dataset.resource = type;
    getButton.innerHTML = `<span>${resourceIconToken(type)}${escapeHtml(info.name)}</span><small>은행 ${game.bank?.[type] || 0}</small>`;
    getButton.setAttribute("aria-label", `${info.name} 받기, 은행 ${game.bank?.[type] || 0}장`);
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

function overlappingTradeResources(offer = {}, request = {}) {
  return Object.keys(RESOURCES).filter((type) => (Number(offer[type]) || 0) > 0 && (Number(request[type]) || 0) > 0);
}

function resourceBundleText(bundle = {}) {
  const entries = Object.entries(bundle).filter(([, amount]) => Number(amount) > 0);
  if (!entries.length) return "없음";
  return entries.map(([type, amount]) => resourceAmountText(type, amount)).join(", ");
}

function resourceBundleCostHtml(bundle = {}) {
  const entries = Object.entries(bundle).filter(([, amount]) => Number(amount) > 0);
  if (!entries.length) return "없음";
  return entries.map(([type, amount]) => {
    const safeType = escapeHtml(type);
    const name = escapeHtml(resourceDisplayName(type));
    const count = Number(amount) || 0;
    const cards = Array.from({ length: count }, (_, index) => `
      <span class="cost-resource-card resource-${safeType}" title="${name}" aria-label="${name} 카드 ${index + 1}/${count}">
        ${resourceIconToken(type)}
      </span>
    `).join("");
    return `<span class="cost-card-stack" aria-label="${name} ${count}장">${cards}</span>`;
  }).join("");
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
  group.setAttribute("aria-label", title);

  Object.entries(RESOURCES).forEach(([type, info]) => {
    const row = document.createElement("div");
    row.className = "trade-resource-row";
    const label = document.createElement("span");
    const owned = owner?.resources?.[type] ?? null;
    label.innerHTML = owned === null
      ? `${resourceIconToken(type)}<span class="trade-resource-name">${escapeHtml(info.name)}</span>`
      : `${resourceIconToken(type)}<span class="trade-resource-name">${escapeHtml(info.name)}</span><small class="trade-resource-owned">보유 ${owned}</small>`;
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
  if (result.type === "completed") {
    setActionNotice(
      "거래 완료",
      `${onlinePlayerName(result.requesterPlayerId)}님과 ${onlinePlayerName(result.targetPlayerId)}님의 거래가 완료되었습니다. ${onlinePlayerName(result.requesterPlayerId)} 제공: ${resourceBundleText(result.offer)} / ${onlinePlayerName(result.targetPlayerId)} 제공: ${resourceBundleText(result.request)}`,
      `player-trade-result-${result.createdAt || Date.now()}`
    );
  } else if (result.type === "canceled") {
    setActionNotice("거래 취소", `${onlinePlayerName(result.requesterPlayerId)}님의 거래 요청이 취소되었습니다.`, `player-trade-result-${result.createdAt || Date.now()}`);
  } else {
    setActionNotice("거래 취소", "자원 상태가 바뀌어 거래가 완료되지 않았습니다.", `player-trade-result-${result.createdAt || Date.now()}`);
  }
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

  const offerTitle = document.createElement("strong");
  offerTitle.className = "player-trade-zone-title";
  offerTitle.textContent = "내가 줄 자원";
  const requestTitle = document.createElement("strong");
  requestTitle.className = "player-trade-zone-title";
  requestTitle.textContent = "받을 자원";

  const offerWarning = createTradeWarning();
  const requestWarning = createTradeWarning();
  const submit = document.createElement("button");
  submit.type = "button";
  submit.textContent = trade ? "재요청" : "요청";

  function refresh() {
    const offerEmpty = resourceBundleTotal(offer) <= 0;
    const requestEmpty = resourceBundleTotal(request) <= 0;
    const offerShort = !hasBundleResources(player, offer);
    const overlap = overlappingTradeResources(offer, request);
    const offerMessage = tradeWarningText([
      offerEmpty ? "줄 자원을 선택하세요" : "",
      offerShort ? "자원이 없습니다" : "",
      overlap.length ? `${overlap.map(resourceDisplayName).join(", ")}은 주고받기를 동시에 선택할 수 없습니다` : ""
    ]);
    const requestMessage = requestEmpty ? "받을 자원을 선택하세요" : "";
    const responders = onlineSession.state?.players?.filter((entry) => entry.id !== onlineSession.playerId && !entry.left) || [];
    submit.title = responders.length ? `대상: 모든 상대 ${responders.length}명` : "";
    setTradeWarning(offerWarning, offerMessage);
    setTradeWarning(requestWarning, requestMessage);
    submit.disabled = offerEmpty || requestEmpty || offerShort || overlap.length > 0;
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
  layout.append(offerZone, requestZone);
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
  offerPanel.innerHTML = `<strong class="player-trade-zone-title">내가 줄 자원</strong><div class="trade-review"><p>${resourceBundleText(trade.offer)}</p><p>대상: 모든 상대</p></div>`;

  const requestPanel = document.createElement("section");
  requestPanel.className = "player-trade-zone";
  requestPanel.innerHTML = `<strong class="player-trade-zone-title">받을 자원</strong><div class="trade-review"><p>${resourceBundleText(trade.request)}</p><p>성사 조건: 모든 응답 후 수락한 상대를 선택</p></div>`;

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
    const responseType = response ? response.type : "waiting";
    row.className = `trade-response-row trade-response-${responseType}`;
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
  review.innerHTML = `<p>내가 받음: ${resourceBundleText(trade.offer)}</p><p>내가 줌: ${resourceBundleText(trade.request)}</p><p>대상: 모든 상대</p><p>내 응답: ${trade.myResponse?.type || "대기"}</p>`;
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
  const offerWarning = createTradeWarning();
  const requestWarning = createTradeWarning();
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
    setTradeWarning(offerWarning, offerMessage);
    setTradeWarning(requestWarning, requestMessage);
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
  layout.append(offerZone, requestZone);
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
    button.innerHTML = `${resourceIconToken(type)}<span>${escapeHtml(info.name)} (${game.bank[type]}장)</span>`;
    button.setAttribute("aria-label", `${info.name} ${game.bank[type]}장`);
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
    button.innerHTML = `${resourceIconToken(type)}<span>${escapeHtml(info.name)}</span>`;
    button.setAttribute("aria-label", info.name);
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
      label.innerHTML = `${resourceIconToken(type)}<span>${escapeHtml(info.name)} (보유 ${owner.resources[type]})</span>`;
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
    emitWinnerDeclaredCue(player.id);
    showVictoryModal(player.id);
  }
}

function startGame() {
  resetOfflineCueScope();
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
  shownVictoryModalKey = null;
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
  resetOfflineCueScope();
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
  shownVictoryModalKey = null;
  selectedAction = "road";
  renderDice();
  hideModal();
  logEl.replaceChildren();
  setupBoard();
  render();
}

function guideFor() {
  const notice = currentActionNotice();
  if (notice) return notice;
  const ux = currentTurnUxState();
  return [ux.guideTitle, ux.guideText];
}

function canTargetRobberTile(tile) {
  if (!tile || tile.id === robberTile) return false;
  if (selectedAction === "robber") return true;
  return isOnlinePlayPhase()
    && game.pendingActionView?.type === "moveRobber"
    && game.pendingActionView.role === "actor";
}

function isRobberMoveWaitingTile(tile) {
  return Boolean(
    tile
    && tile.id !== robberTile
    && isOnlinePlayPhase()
    && game.pendingActionView?.type === "moveRobber"
    && game.pendingActionView.role !== "actor"
  );
}

function drawTile(tile) {
  const group = createSvg("g");
  const isRolledTile = game.lastDice?.total !== 7 && tile.number === game.lastDice?.total;
  const isBlockedRoll = isRolledTile && tile.id === robberTile;
  const hasRobber = tile.id === robberTile;
  const isRobberTarget = canTargetRobberTile(tile);
  const isRobberDisabledTarget = isRobberMoveWaitingTile(tile);
  const className = [
    `hex`,
    tile.type,
    hasRobber ? "robber-occupied is-robber-current" : "",
    isRolledTile ? "rolled" : "",
    isBlockedRoll ? "blocked-roll" : "",
    isRobberTarget ? "robber-target is-robber-target" : "",
    isRobberDisabledTarget ? "is-robber-disabled-target" : ""
  ].filter(Boolean).join(" ");
  const poly = createSvg("polygon", { class: className, "data-tile-id": tile.id, points: tile.corners.map((p) => `${p.x},${p.y}`).join(" ") });
  poly.addEventListener("click", () => {
    if (canTargetRobberTile(tile)) moveRobber(tile.id);
  });
  group.append(poly);
  group.append(drawTileTexture(tile));
  if (hasRobber) group.append(drawRobberOverlay(tile));
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
  const group = createSvg("g", { class: className, transform: `translate(${tile.x} ${tile.y})` });
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
  group.append(createSvg("circle", { class: "robber-overlay-ring", cx: tile.x, cy: tile.y, r: 34 }));
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
    class: ["road-token", actionFeedbackClass("edge", edge.id)].filter(Boolean).join(" "),
    transform: `translate(${midX} ${midY}) rotate(${angle})`
  });
  group.dataset.edge = edge.id;
  const motionGroup = createSvg("g", { class: "road-token-motion" });
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
  motionGroup.append(shadow, body, shine);
  group.append(motionGroup);
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
    class: [`vertex building ${vertex.city ? "city-piece" : "settlement-piece"}`, actionFeedbackClass("vertex", vertex.id)].filter(Boolean).join(" "),
    transform: `translate(${vertex.x} ${vertex.y})`
  });
  group.dataset.vertex = vertex.id;
  const motionGroup = createSvg("g", { class: "building-motion" });

  if (vertex.city) {
    const badge = createSvg("circle", { class: "building-badge city-badge", cx: 0, cy: 0, r: 24, fill: ownerColor });
    const face = createSvg("circle", { class: "building-face", cx: 0, cy: 0, r: 18 });
    const icon = drawModernCityIcon(ownerColor);
    const shine = createSvg("path", { class: "building-badge-shine", d: "M-10,-16 C-4,-20 6,-20 12,-14" });
    motionGroup.append(badge, face, icon, shine);
  } else {
    const badge = createSvg("circle", { class: "building-badge settlement-badge", cx: 0, cy: 0, r: 19, fill: ownerColor });
    const face = createSvg("circle", { class: "building-face", cx: 0, cy: 0, r: 14 });
    const icon = drawModernSettlementIcon(ownerColor);
    const shine = createSvg("path", { class: "building-badge-shine", d: "M-8,-12 C-3,-15 5,-15 10,-10" });
    motionGroup.append(badge, face, icon, shine);
  }

  group.append(motionGroup);
  return group;
}

function drawModernSettlementIcon(color) {
  return drawBoardTablerIcon("home", color, "settlement-icon", "translate(-12 -12)");
}

function drawModernCityIcon(color) {
  return drawBoardTablerIcon("building-community", color, "city-icon", "translate(-15 -15) scale(1.25)");
}

function drawBoardTablerIcon(iconKey, color, className, transform) {
  const group = createSvg("g", {
    class: `building-icon ${className}`,
    transform,
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });
  group.style.color = color;
  group.innerHTML = TABLER_ICON_PATHS[iconKey] || "";
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
    .map(([key, info]) => `<div class="mini-card resource-mini-card" title="${escapeHtml(info.name)}" aria-label="${escapeHtml(`${info.name} ${player.resources[key]}장`)}">${resourceIconToken(key)}<strong>${player.resources[key]}</strong></div>`)
    .join("");
}

function renderResourceSummary(player) {
  return `<div class="mini-card summary" title="자원" aria-label="자원 ${resourceCount(player)}장">${resourceIconToken("generic")}<strong>${resourceCount(player)}</strong></div>`;
}

function renderDevSummary(player) {
  const count = Array.isArray(player.dev) ? player.dev.length : Number(player.devCount || 0);
  return `<div class="mini-card summary" title="개발 카드" aria-label="개발 카드 ${count}장">${actionIconToken("devCard")}<strong>${count}</strong></div>`;
}

function handViewerPlayer() {
  if (!game.players?.length) return null;
  if (!onlineSession.enabled) return currentPlayer() || null;
  if (!isOnlinePlaying()) return null;
  if (Number.isInteger(game.viewerSeatIndex) && game.players[game.viewerSeatIndex]) {
    return game.players[game.viewerSeatIndex];
  }
  const onlinePlayerId = onlineSession.playerId;
  if (!onlinePlayerId) return null;
  const publicPlayer = onlineSession.state?.players?.find((entry) => entry.id === onlinePlayerId);
  const seatIndex = publicPlayer?.seatIndex ?? publicPlayer?.seat ?? publicPlayer?.gameSeatIndex;
  if (Number.isInteger(seatIndex) && game.players[seatIndex]) return game.players[seatIndex];
  return game.players.find((player) => player.onlinePlayerId === onlinePlayerId || player.playerId === onlinePlayerId) || null;
}

function resourceHandCardHtml(type, amount) {
  const resource = RESOURCES[type] || { name: type };
  const safeName = escapeHtml(resource.name);
  const count = Math.max(0, Number(amount) || 0);
  return `
    <article class="hand-resource-card resource-${type}" role="listitem" aria-label="${safeName} ${count}장">
      <span class="hand-card-icon" aria-hidden="true">${resourceIconToken(type)}</span>
      <span class="hand-card-name">${safeName}</span>
      <strong class="hand-card-count">${count}</strong>
    </article>
  `;
}

function renderResourceHandCards(player) {
  if (!player?.resources) return "";
  return Object.keys(RESOURCES)
    .map((type) => resourceHandCardHtml(type, player.resources[type]))
    .join("");
}

function devHandCardHtml(type, amount, usable = false) {
  const safeName = escapeHtml(devCardName(type));
  const count = Math.max(0, Number(amount) || 0);
  const stateText = usable ? "사용 가능" : "대기";
  return `
    <article class="hand-resource-card hand-dev-card dev-${type} ${usable ? "is-usable" : "is-waiting"}" role="listitem" aria-label="${safeName} ${count}장, ${stateText}">
      <span class="hand-card-icon" aria-hidden="true">${devCardIconToken(type)}</span>
      <span class="hand-card-name">${safeName}</span>
      <strong class="hand-card-count">${count}</strong>
    </article>
  `;
}

function renderDevHandCards(player) {
  if (!Array.isArray(player?.dev) || !player.dev.length) return "";
  const usableTypes = new Set(usableDevCards(player).map((card) => card.type));
  const counts = player.dev.reduce((acc, card) => {
    acc[card.type] = (acc[card.type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([type, count]) => devHandCardHtml(type, count, usableTypes.has(type)))
    .join("");
}

function renderPlayerHandDock() {
  if (!playerHandDock || !playerResourceHand) return;
  const player = handViewerPlayer();
  if (!player?.resources) {
    playerResourceHand.replaceChildren();
    playerHandDock.classList.add("hidden");
    playerHandDock.classList.remove("is-expanded");
    playerHandDock.removeAttribute("data-player-id");
    playerHandToggle?.setAttribute("aria-expanded", "false");
    return;
  }
  playerHandDock.classList.remove("hidden");
  const effectiveExpanded = playerHandExpanded || isMobileViewport();
  playerHandDock.classList.toggle("is-expanded", effectiveExpanded);
  playerHandDock.dataset.playerId = String(player.id);
  playerHandToggle?.setAttribute("aria-expanded", effectiveExpanded ? "true" : "false");
  if (playerHandToggle) {
    playerHandToggle.textContent = effectiveExpanded ? "접기" : "펼치기";
  }
  if (playerHandOwner) {
    playerHandOwner.textContent = playerDisplayName(player);
  }
  playerResourceHand.innerHTML = `${renderResourceHandCards(player)}${renderDevHandCards(player)}`;
}

function playerHasRecentProduction(playerId) {
  return Boolean(game.lastProduction?.some((entry) => entry.seatIndex === playerId && Number(entry.amount) > 0));
}

function renderSeats() {
  const ux = currentTurnUxState();
  const focusId = ux.currentFocusPlayer?.id;
  const pendingIds = new Set(ux.pendingActors.map((player) => player.id));
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
    seat.classList.toggle("is-current-turn", player.id === focusId);
    seat.classList.toggle("is-my-turn", ux.online && player.id === ux.viewerSeatIndex && ux.kind === "my-turn");
    seat.classList.toggle("is-pending-actor", pendingIds.has(player.id));
    seat.classList.toggle("is-bot-turn", player.isBot && player.id === focusId);
    seat.classList.toggle("is-waiting-turn", player.id !== focusId && !pendingIds.has(player.id));
    seat.classList.toggle("motion-resource-bump", playerHasRecentProduction(player.id));
    seat.style.setProperty("--player-color", player.color);
    const isViewer = !isOnlinePlaying() || player.id === game.viewerSeatIndex;
    seat.innerHTML = `
      <div class="seat-main">
        <div class="seat-identity">
          <span class="dot score-dot ${String(activeScoreTooltipPlayerId) === String(player.id) ? "is-score-tooltip-open" : ""}" style="background:${player.color}" ${scoreBadgeAttributes(player, isViewer)}>${pointBadgeNumber(player, isViewer)}</span>
          <span class="seat-name">${player.name}${botBadgeHtml(player)}</span>
        </div>
      </div>
      <div class="seat-stats">
        <div class="hand">
          ${renderResourceSummary(player)}
          ${renderDevSummary(player)}
        </div>
      </div>
    `;
  }
}

function renderPlayers() {
  playersList.replaceChildren();
  const ux = currentTurnUxState();
  const focusId = ux.currentFocusPlayer?.id;
  const pendingIds = new Set(ux.pendingActors.map((player) => player.id));
  game.players.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = [
      "player-row",
      index === game.active ? "active" : "",
      player.id === focusId ? "is-current-turn" : "",
      ux.online && player.id === ux.viewerSeatIndex && ux.kind === "my-turn" ? "is-my-turn" : "",
      pendingIds.has(player.id) ? "is-pending-actor" : "",
      player.isBot && player.id === focusId ? "is-bot-turn" : "",
      player.id !== focusId && !pendingIds.has(player.id) ? "is-waiting-turn" : "",
      playerHasRecentProduction(player.id) ? "motion-resource-bump" : ""
    ].filter(Boolean).join(" ");
    row.dataset.playerId = String(player.id);
    const revealHidden = !isOnlinePlaying() ? index === game.active : player.id === game.viewerSeatIndex;
    row.innerHTML = `
      <span class="dot score-dot ${String(activeScoreTooltipPlayerId) === String(player.id) ? "is-score-tooltip-open" : ""}" style="background:${player.color}" ${scoreBadgeAttributes(player, revealHidden)}>${pointBadgeNumber(player, revealHidden)}</span>
      <span>${player.name}${botBadgeHtml(player)}</span>
      <b>카드 ${resourceCount(player)}장</b>
    `;
    const status = document.createElement("small");
    status.className = "player-state-label";
    status.innerHTML = playerStatusHtml(player, ux);
    row.append(status);
    playersList.append(row);
  });
}

function makeTurnFeedbackCue(ux) {
  const focusPlayer = ux.currentFocusPlayer;
  if (!focusPlayer || ux.blocking) return null;
  const pendingIds = ux.pendingActors.map((player) => player.id).sort((a, b) => a - b).join("-");
  const eventType = pendingIds ? "pendingStarted" : "turnChanged";
  const scopeId = makeCueScopeId();
  const revision = isOnlinePlaying()
    ? onlineSession.revision
    : `${game.round}-${game.active}-${game.phase}-${game.rolled ? "rolled" : "waiting"}-${pendingIds || "none"}`;
  return makeRawCueCandidate(eventType, {
    scopeId,
    revision,
    eventType,
    entityId: `seat-${focusPlayer.id}`,
    detailKey: `${ux.kind}-${pendingIds || "active"}`,
    visibility: "public",
    source: "stateDelta",
    channels: {
      visual: true,
      sound: eventType === "turnChanged" && ux.kind === "my-turn",
      log: false,
      toast: false
    },
    payload: {
      seatIndex: focusPlayer.id,
      state: ux.kind,
      pendingActorSeatIndexes: pendingIds
    }
  });
}

function pulseTurnFeedback(ux) {
  const cue = makeTurnFeedbackCue(ux);
  if (!cue) return;
  const result = emitGameCue(cue, { settings: currentFeelSettings });
  if (!result.played) return;
  if (getEffectiveFeelSettings().effectiveMotion === "reduced") return;
  const focusId = ux.currentFocusPlayer?.id;
  const targets = [
    document.querySelector(`#seat${focusId}`),
    playersList.querySelector(`.player-row[data-player-id="${focusId}"]`),
    currentPlayerLabel,
    dicePanel
  ].filter(Boolean);
  targets.forEach((element) => {
    element.classList.remove("motion-turn-pulse");
    void element.offsetWidth;
    element.classList.add("motion-turn-pulse");
    window.setTimeout(() => element.classList.remove("motion-turn-pulse"), 520);
  });
}

function playerStatusLabel(player, ux = currentTurnUxState()) {
  if (!player) return "대기";
  if (ux.blocking) return player.id === ux.currentFocusPlayer?.id ? "확인 필요" : "대기";
  if (ux.pendingActors.some((entry) => entry.id === player.id)) {
    if (ux.online && player.id === ux.viewerSeatIndex) return "행동 필요";
    if (player.isBot) return "봇 진행 중";
    return "진행 중";
  }
  if (player.id === ux.currentFocusPlayer?.id) {
    if (player.isBot) return "봇 진행 중";
    if (ux.online && player.id === ux.viewerSeatIndex && ux.kind === "my-turn") return "내 차례";
    return "진행 중";
  }
  return "대기";
}

function playerStatusTokenKey(player, ux = currentTurnUxState()) {
  if (!player) return "waiting";
  if (ux.blocking && player.id === ux.currentFocusPlayer?.id) return "error";
  if (ux.pendingActors.some((entry) => entry.id === player.id)) return player.isBot ? "bot" : "pending";
  if (player.id === ux.currentFocusPlayer?.id) {
    if (player.isBot) return "bot";
    if (ux.online && player.id === ux.viewerSeatIndex && ux.kind === "my-turn") return "myTurn";
    return "pending";
  }
  return "waiting";
}

function playerStatusHtml(player, ux = currentTurnUxState()) {
  const label = playerStatusLabel(player, ux);
  return `${statusIconToken(playerStatusTokenKey(player, ux))}<span>${escapeHtml(label)}</span>`;
}

function infoChip(label, value, wide = false, token = "") {
  return `<div class="info-chip ${wide ? "wide" : ""}"><span class="info-chip-label">${token}${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderTurnStage() {
  if (!turnStagePanel) return;
  turnStagePanel.innerHTML = infoChip("현재 라운드", game.round || "-", true);
}

function renderBankStock() {
  if (!bankStockPanel) return;
  const devDeckCount = isOnlinePlaying()
    ? Number(onlineSession.state?.matchState?.devDeckCount || 0)
    : devDeck.length;
  bankStockPanel.innerHTML = [
    ...Object.entries(RESOURCES)
      .map(([type, info]) => infoChip(info.name, `${game.bank[type]}장`, false, resourceIconToken(type))),
    infoChip("개발 카드", `${devDeckCount}장`, false, actionIconToken("devCard"))
  ].join("");
}

function renderCostReference() {
  if (!costReferencePanel) return;
  const rows = [
    ["도로", COSTS.road, "road"],
    ["마을", COSTS.settlement, "settlement"],
    ["도시", COSTS.city, "city"],
    ["개발", COSTS.dev, "devCard"]
  ];
  costReferencePanel.innerHTML = rows.map(([label, cost, actionToken]) => {
    const text = resourceBundleCostHtml(cost);
    return `<div class="cost-row"><strong>${actionIconToken(actionToken)}<span>${label}</span></strong><span>${text}</span></div>`;
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

function applyActionButtonIconTokens() {
  if (rollButton && rollButton.dataset.iconReady !== "true") {
    rollButton.innerHTML = actionIconToken("dice", { className: "roll-button-icon" });
    rollButton.setAttribute("aria-label", "주사위 굴리기");
    rollButton.dataset.iconReady = "true";
  }
  buildButtons.forEach((button) => {
    if (button.dataset.iconReady === "true") return;
    const action = button.dataset.action;
    const token = ACTION_ICON_BY_BUTTON[action];
    const label = ACTION_LABEL_BY_BUTTON[action] || button.textContent.trim();
    button.innerHTML = `${actionIconToken(token)}<span class="action-button-label">${escapeHtml(label)}</span>`;
    button.setAttribute("aria-label", label);
    button.dataset.iconReady = "true";
  });
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
  window.matchMedia?.(LANDSCAPE_PANEL_QUERY).addEventListener?.("change", syncFloatingPanelsForViewport);
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

function clearPrimaryActionHints() {
  [rollButton, endTurnButton, ...buildButtons].forEach((button) => {
    if (!button) return;
    button.classList.remove("is-primary-action", "is-primary-action-soft");
    delete button.dataset.primaryAction;
  });
}

function markPrimaryAction(button, strength = "primary") {
  if (!button || button.disabled) return;
  button.setAttribute("data-primary-action", strength);
  button.classList.add(strength === "soft" ? "is-primary-action-soft" : "is-primary-action");
}

function updatePrimaryActionHints(ux = currentTurnUxState()) {
  clearPrimaryActionHints();
  if (ux.blocking || ux.kind === "bot-turn" || ux.kind === "waiting" || ux.kind === "pending-wait") return;
  if (game.pendingActionView || isResolvingForcedAction() || isBusyWithCardAction()) return;
  if (isOnlinePlayPhase() && !isMyOnlineTurn()) return;
  if (game.phase !== "play" || game.winner !== null) return;

  if (!game.rolled) {
    markPrimaryAction(rollButton);
    return;
  }

  const selectedButton = buildButtons.find((button) => button.dataset.action === selectedAction && !button.disabled);
  if (selectedButton && ["road", "settlement", "city", "trade", "playerTrade", "dev", "playDev"].includes(selectedButton.dataset.action)) {
    markPrimaryAction(selectedButton);
  }
  markPrimaryAction(endTurnButton, "soft");
}

function shouldHighlightDicePanel(ux = currentTurnUxState()) {
  return ux.kind === "my-turn" && !ux.blocking && !game.pendingActionView && !isResolvingForcedAction() && !isBusyWithCardAction() && game.phase === "play" && game.winner === null;
}

function shouldPulseDicePanel(ux = currentTurnUxState()) {
  return shouldHighlightDicePanel(ux) && !game.rolled && !rollButton?.disabled;
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
  rollButton.title = rollButton.disabled && isOnlinePlayPhase() ? onlineTurnBlockedMessage("roll") : "";
  endTurnButton.disabled = isOnlinePlayPhase()
    ? !canEndOnlineTurn()
    : onlineLocked || game.phase !== "play" || !game.rolled || isResolvingForcedAction() || isBusyWithCardAction() || game.winner !== null;
  endTurnButton.title = endTurnButton.disabled && isOnlinePlayPhase() ? onlineTurnBlockedMessage("endTurn") : "";
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
  updatePrimaryActionHints();
  renderBoardZoomButton();
}

function renderTradeOptions() {
  if (!tradeGive || !tradeGet) return;
  const options = Object.keys(RESOURCES).map((key) => `<option value="${key}">${escapeHtml(resourceDisplayName(key))}</option>`).join("");
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
  window.__catanFeelTest = {
    makeCueKey,
    makeCueScopeId,
    nextOfflineCueRevision,
    resetPlayedCueKeys,
    hasPlayedCue,
    markCuePlayed,
    makeRawCueCandidate,
    sanitizeCueForViewer,
    shouldPlayCue,
    emitGameCue,
    dispatchGameCue,
    sanitizeFeelSettings,
    loadFeelSettings,
    saveFeelSettings,
    getEffectiveFeelSettings,
    applyFeelSettings,
    enableSoundEffects,
    playSoundCue,
    setSoundVolume,
    getAudioRuntimeState,
    mapCueToSound,
    getSoundEventMap: () => ({ ...SOUND_EVENT_MAP }),
    getSoundAssetKeys: () => [...SOUND_ASSET_KEYS],
    preloadSoundAssets,
    stopAllSounds,
    suppressHydrateCueScope,
    isHydrateCueSuppressed,
    getPlayedCueKeys: () => [...feelCueRuntime.playedCueKeys.keys()],
    getDefaultSettings: () => ({ ...DEFAULT_FEEL_SETTINGS }),
    getCurrentSettings: () => ({ ...currentFeelSettings }),
    hashStringToUint32,
    seededRange,
    makeDiceMotionStyle
  };
  if (params.get("test") !== "1") return;

  window.__catanTest = {
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
    forceRoll(die1, die2, animationSeed = "test-dice-motion") {
      if (game.phase !== "play" || game.rolled || game.winner !== null) return false;
      const dice = {
        die1: Number(die1),
        die2: Number(die2),
        total: Number(die1) + Number(die2),
        animationSeed: String(animationSeed),
        rollId: `test-${animationSeed}-${die1}-${die2}`
      };
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
  const ux = currentTurnUxState();
  syncResponsivePanelPlacement();
  updateTurnVisualHooks(ux);
  renderBoard();
  updatePlayerHandCardMetrics();
  renderSeats();
  renderPlayers();
  renderPlayerHandDock();
  renderTurnStage();
  renderDice();
  renderBankStock();
  renderCostReference();
  renderCurrentPlayerHarbors();
  renderControls();
  const [title, text] = guideFor();
  actionNoticePanel?.classList.toggle("has-action-notice", Boolean(currentActionNotice()));
  renderActionNoticeControls();
  guideTitle.textContent = title;
  guideText.textContent = text;
  if (currentPlayerLabel) {
    currentPlayerLabel.textContent = ux.headline;
    currentPlayerLabel.dataset.state = ux.kind;
  }
  dicePanel?.setAttribute("data-turn-state", ux.kind);
  dicePanel?.setAttribute("data-my-turn", shouldHighlightDicePanel(ux) ? "true" : "false");
  dicePanel?.setAttribute("data-roll-needed", shouldPulseDicePanel(ux) ? "true" : "false");
  dicePanel?.setAttribute("data-seven-alert", game.lastDice?.total === 7 ? "true" : "false");
  turnStagePanel?.setAttribute("data-pending-action", game.pendingActionView?.type || (isResolvingForcedAction() ? selectedAction : "none"));
  pulseTurnFeedback(ux);
  updateTradeRatioLabel();
}

function updatePlayerHandCardMetrics() {
  if (!tabletop || !svg) return;
  const sampleTile = svg.querySelector(".hex.forest, .hex.field, .hex.pasture, .hex.hill, .hex.mountain, .hex");
  const tileRect = sampleTile?.getBoundingClientRect();
  const tileWidth = Number(tileRect?.width);
  if (!Number.isFinite(tileWidth) || tileWidth <= 0) return;
  const cardWidth = Math.round(clamp(tileWidth, 42, 125));
  const cardHeight = Math.round(cardWidth / 0.72);
  const stackWidth = Math.round(cardWidth * 2.12);
  const stackHeight = Math.round(cardHeight + cardWidth * 0.32);
  const stackRight = Math.round(cardWidth * 0.16);
  const stackBottom = Math.round(cardWidth * 0.13);
  const cardPadding = Math.round(clamp(cardWidth * 0.08, 5, 10));
  tabletop.style.setProperty("--hand-card-width", `${cardWidth}px`);
  tabletop.style.setProperty("--hand-card-height", `${cardHeight}px`);
  tabletop.style.setProperty("--hand-card-stack-width", `${stackWidth}px`);
  tabletop.style.setProperty("--hand-card-stack-height", `${stackHeight}px`);
  tabletop.style.setProperty("--hand-card-stack-right", `${stackRight}px`);
  tabletop.style.setProperty("--hand-card-stack-bottom", `${stackBottom}px`);
  tabletop.style.setProperty("--hand-card-padding", `${cardPadding}px`);
}

function schedulePlayerHandCardMetricsUpdate() {
  if (playerHandMetricFrame !== null) cancelAnimationFrame(playerHandMetricFrame);
  playerHandMetricFrame = requestAnimationFrame(() => {
    playerHandMetricFrame = null;
    updatePlayerHandCardMetrics();
    renderPlayerHandDock();
  });
}

function updateTurnVisualHooks(ux = currentTurnUxState()) {
  const focusColor = ux.blocking ? "#ff9f9f" : (ux.currentFocusPlayer?.color || "#f4c460");
  [appEl, tabletop].forEach((element) => {
    if (!element) return;
    element.setAttribute("data-focus-state", ux.kind);
    element.style.setProperty("--focus-player-color", focusColor);
  });
  if (boardArea) {
    boardArea.setAttribute("data-focus-state", ux.kind);
    boardArea.style.setProperty("--focus-player-color", focusColor);
  }
}

function toggleScoreTooltip(target) {
  const badge = target?.closest?.(".score-dot[data-score-player-id]");
  if (!badge) return false;
  const playerId = badge.dataset.scorePlayerId;
  activeScoreTooltipPlayerId = String(activeScoreTooltipPlayerId) === String(playerId) ? null : playerId;
  render();
  return true;
}

document.addEventListener("click", (event) => {
  if (toggleScoreTooltip(event.target)) {
    event.stopPropagation();
    return;
  }
  if (activeScoreTooltipPlayerId !== null) {
    activeScoreTooltipPlayerId = null;
    render();
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target?.closest?.(".score-dot[data-score-player-id]")) {
    event.preventDefault();
    toggleScoreTooltip(event.target);
    return;
  }
  if (event.key === "Escape" && activeScoreTooltipPlayerId !== null) {
    activeScoreTooltipPlayerId = null;
    render();
  }
});

playerHandToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (isMobileViewport()) return;
  playerHandExpanded = !playerHandExpanded;
  renderPlayerHandDock();
});

playerHandDock?.addEventListener("click", () => {
  if (isMobileViewport()) return;
  if (playerHandExpanded) return;
  playerHandExpanded = true;
  renderPlayerHandDock();
});

playerResourceHand?.addEventListener("click", (event) => {
  if (isMobileViewport()) return;
  if (!playerHandExpanded || !event.target.closest(".hand-resource-card")) return;
  event.stopPropagation();
  playerHandExpanded = false;
  renderPlayerHandDock();
});

window.addEventListener("resize", () => {
  syncFloatingPanelsForViewport();
  schedulePlayerHandCardMetricsUpdate();
});
actionNoticePrev?.addEventListener("click", showPreviousActionNotice);
actionNoticeNext?.addEventListener("click", showNextActionNotice);

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
rollButton.addEventListener("pointerdown", startDicePress);
rollButton.addEventListener("pointerup", finishDicePress);
rollButton.addEventListener("pointercancel", cancelDicePress);
rollButton.addEventListener("mousedown", startDicePress);
rollButton.addEventListener("mouseup", finishDicePress);
rollButton.addEventListener("mouseleave", cancelDicePress);
rollButton.addEventListener("touchstart", startDicePress, { passive: true });
rollButton.addEventListener("touchend", finishDicePress);
rollButton.addEventListener("touchcancel", cancelDicePress);
rollButton.addEventListener("keydown", startDiceKeyboardPress);
rollButton.addEventListener("keyup", finishDiceKeyboardPress);
rollButton.addEventListener("blur", cancelDicePress);
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
feelSettingsButton?.addEventListener("click", showFeelSettingsModal);
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
lobbyAddBotButton?.addEventListener("click", addOnlineBot);
lobbyPlayersList?.addEventListener("click", (event) => {
  const button = event.target.closest(".lobby-remove-bot-button");
  if (!button) return;
  removeOnlineBot(button.dataset.botPlayerId);
});
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
applyActionButtonIconTokens();
renderTradeOptions();
initCostCardDrag();
initDicePanelDrag();
initBoardZoom();
syncFloatingPanelsForViewport();
installTestHelpers();
window.matchMedia?.("(prefers-reduced-motion: reduce)").addEventListener?.("change", () => applyFeelSettings(currentFeelSettings));
setupBoard();
showJoinFromUrlIfNeeded();
render();
