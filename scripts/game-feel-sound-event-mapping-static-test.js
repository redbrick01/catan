const fs = require("fs");
const path = require("path");
const assert = require("assert");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const manifestPath = path.join(root, "docs", "assets_manifest.md");

function includes(source, needle, label) {
  assert(source.includes(needle), label || `Missing ${needle}`);
}

[
  "turnChanged",
  "diceRolled",
  "resourcesProduced",
  "blockedProduction",
  "buildCompleted",
  "bankTradeCompleted",
  "playerTradeCompleted",
  "devCardBought",
  "devCardPlayed",
  "sevenRolled",
  "discardPendingStarted",
  "robberMovePendingStarted",
  "robberVictimPendingStarted",
  "robberMoved",
  "robberResult",
  "winnerDeclared",
  "commandRejected"
].forEach((eventType) => includes(script, eventType, `sound event mapping should include ${eventType}`));

[
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
].forEach((assetKey) => includes(script, assetKey, `sound asset key ${assetKey} should be known`));

includes(script, "const SOUND_EVENT_MAP", "sound event map should be a canonical table");
includes(script, "const SOUND_ASSET_KEYS", "sound asset key list should be explicit");
includes(script, "const SOUND_ASSET_MANIFEST", "sound asset manifest should map bundled audio files");
assert(!script.includes("\"dice-hold\""), "holding the dice should not play a looping sound");
assert(!script.includes("function playDiceHoldSound"), "hold sound helper should be removed");
includes(script, "assets/audio/dice/dice-11.wav", "dice release sound should use bundled OpenGameArt audio");
includes(script, "assets/audio/dice/dice-4.wav", "dice settle sound should use bundled OpenGameArt audio");
includes(script, "function soundPrivacyForCue", "sound privacy resolver should exist");
includes(script, "function soundAssetForCue", "sound asset resolver should exist");
includes(script, "cue?.type === \"resourcesProduced\" && !cue.payload?.resourceType", "observer production should use generic card-gain");
includes(script, "cue.type === \"robberResult\"", "robber result privacy should be explicit");
includes(script, "cue.payload?.resourceType ? \"viewer-resource\" : \"generic-robber\"", "robber observers should use generic sound privacy");
includes(script, "cue.type === \"devCardBought\") return \"generic-card\"", "development card purchase sound should stay generic");
includes(script, "settings?.[definition.setting] === false", "turn/important sound category toggles should be honored");
includes(script, "if (soundCue.disabled) return \"skipped-disabled\"", "disabled sound categories should skip safely");
includes(script, "if (!audioRuntime.loadedAssets[soundCue.asset]) return \"skipped-no-asset\"", "missing assets should skip safely");
includes(script, "function playSoundAsset", "sound assets should have a playback helper");
includes(script, "function playDiceReleaseSound", "dice release sound should be distinct");
includes(script, "function playDiceSettleSound", "dice settle sound should be distinct");
includes(script, "getSoundEventMap", "test helpers should expose sound mapping for browser smoke");
includes(script, "getSoundAssetKeys", "test helpers should expose sound asset keys");
includes(script, "if (options.suppressCues && state.roomId) suppressHydrateCueScope", "hydrate snapshots should suppress cue replay before sound dispatch");

assert(!fs.existsSync(manifestPath), "FEEL-006B should not create an asset manifest when no sound files are added");

const start = script.indexOf("const FEEL_SETTINGS_STORAGE_KEY");
const end = script.indexOf("function ensureButton", start);
assert(start >= 0 && end > start, "FEEL helper section is present");

const helperSource = `function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
${script.slice(start, end)}
globalThis.__soundEvent = {
  DEFAULT_FEEL_SETTINGS,
  SOUND_EVENT_MAP,
  SOUND_ASSET_KEYS,
  sanitizeFeelSettings,
  mapCueToSound,
  playSoundCue,
  makeRawCueCandidate,
  sanitizeCueForViewer,
  suppressHydrateCueScope,
  isHydrateCueSuppressed,
  preloadSoundAssets
};`;

const context = {
  console,
  Date,
  Math,
  localStorage: { getItem: () => null, setItem: () => {} },
  window: { matchMedia: () => ({ matches: false }) },
  document: {
    documentElement: {
      dataset: {},
      classList: { toggle: () => {} }
    }
  },
  onlineSession: { roomId: "room-a", revision: 5 },
  game: { viewerSeatIndex: 0 },
  addLog: () => {}
};

vm.createContext(context);
vm.runInContext(helperSource, context);

const sound = context.__soundEvent;
assert.strictEqual(sound.mapCueToSound({ type: "turnChanged", payload: {} }).asset, "turn-bell", "turnChanged maps to turn-bell");
assert.strictEqual(sound.mapCueToSound({ type: "diceRolled", payload: {} }).asset, "dice-roll", "diceRolled maps to dice-roll");
assert.strictEqual(sound.mapCueToSound({ type: "buildCompleted", payload: {} }).asset, "build-success", "buildCompleted maps to build-success");
assert.strictEqual(sound.mapCueToSound({ type: "bankTradeCompleted", payload: {} }).asset, "trade-success", "bank trade maps to trade-success");
assert.strictEqual(sound.mapCueToSound({ type: "playerTradeCompleted", payload: {} }).asset, "trade-success", "player trade maps to trade-success");
assert.strictEqual(sound.mapCueToSound({ type: "devCardBought", payload: { cardType: "knight" } }).privacy, "generic-card", "dev card buy stays generic");
assert.strictEqual(sound.mapCueToSound({ type: "devCardPlayed", payload: { publicCardType: "knight" } }).privacy, "public-card", "dev card play can use public-card privacy");
assert.strictEqual(sound.mapCueToSound({ type: "sevenRolled", payload: {} }).asset, "robber-alert", "sevenRolled maps to robber-alert");
assert.strictEqual(sound.mapCueToSound({ type: "robberMoved", payload: {} }).asset, "robber-move", "robberMoved maps to robber-move");
assert.strictEqual(sound.mapCueToSound({ type: "winnerDeclared", payload: {} }).asset, "win-fanfare", "winnerDeclared maps to win-fanfare");
assert.strictEqual(sound.mapCueToSound({ type: "commandRejected", payload: {} }).asset, "error-soft", "commandRejected maps to error-soft");

const ownProduction = sound.sanitizeCueForViewer(sound.makeRawCueCandidate("resourcesProduced", {
  scopeId: "room-a",
  revision: 6,
  entityId: "seat-0",
  payload: { seatIndex: 0, resourceType: "forest", amount: 1 }
}), { viewerSeatIndex: 0 });
assert.strictEqual(sound.mapCueToSound(ownProduction).asset, "resource-gain", "own production can use resource-gain");
assert.strictEqual(sound.mapCueToSound(ownProduction).privacy, "viewer-resource", "own production is viewer-resource");

const opponentProduction = sound.sanitizeCueForViewer(sound.makeRawCueCandidate("resourcesProduced", {
  scopeId: "room-a",
  revision: 6,
  entityId: "seat-1",
  payload: { seatIndex: 1, resourceType: "forest", amount: 1 }
}), { viewerSeatIndex: 0 });
assert.strictEqual(opponentProduction.payload.resourceType, undefined, "opponent production resource type is sanitized");
assert.strictEqual(sound.mapCueToSound(opponentProduction).asset, "card-gain", "opponent production uses generic card-gain");

const observerRobber = sound.sanitizeCueForViewer(sound.makeRawCueCandidate("robberResult", {
  scopeId: "room-a",
  revision: 7,
  entityId: "seat-1",
  payload: { actorSeatIndex: 1, victimSeatIndex: 2, resourceType: "field" }
}), { viewerSeatIndex: 0 });
assert.strictEqual(observerRobber.payload.resourceType, undefined, "observer robber resource type is sanitized");
assert.strictEqual(sound.mapCueToSound(observerRobber).privacy, "generic-robber", "observer robber result is generic");

const disabledTurn = sound.mapCueToSound({ type: "turnChanged", payload: {} }, {
  ...sound.DEFAULT_FEEL_SETTINGS,
  turnSoundEnabled: false
});
assert.strictEqual(disabledTurn.disabled, true, "turn sound category toggle disables turn sound");

sound.suppressHydrateCueScope("room-a", 9);
assert.strictEqual(sound.isHydrateCueSuppressed("room-a", 8), true, "older hydrate revision is suppressed");
assert.strictEqual(sound.playSoundCue({ type: "diceRolled", payload: {} }, {
  ...sound.DEFAULT_FEEL_SETTINGS,
  soundEnabled: false
}), "skipped-disabled", "sound off skips");
assert.strictEqual(sound.playSoundCue({ type: "diceRolled", payload: {} }, {
  ...sound.DEFAULT_FEEL_SETTINGS,
  soundEnabled: true,
  soundVolume: 0
}), "skipped-muted", "volume zero mutes");

console.log("game-feel sound event mapping static checks passed");
