const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const scriptPath = path.join(root, "script.js");
const source = fs.readFileSync(scriptPath, "utf8");

const start = source.indexOf("const DEFAULT_FEEL_SETTINGS");
const end = source.indexOf("function ensureButton", start);
assert(start >= 0 && end > start, "FEEL-000 helper section is present");

const helperSource = `function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
${source.slice(start, end)}
globalThis.__feel = {
  makeCueKey,
  resetPlayedCueKeys,
  hasPlayedCue,
  markCuePlayed,
  makeRawCueCandidate,
  sanitizeCueForViewer,
  shouldPlayCue,
  emitGameCue,
  suppressHydrateCueScope,
  isHydrateCueSuppressed,
  DEFAULT_FEEL_SETTINGS
};`;

const context = {
  console,
  Date,
  Math,
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  window: {
    matchMedia: () => ({ matches: false })
  },
  document: {
    documentElement: {
      dataset: {},
      classList: { toggle: () => {} }
    }
  },
  onlineSession: { roomId: "room-a", revision: 4 },
  game: { viewerSeatIndex: 0 },
  addLog: () => {}
};
vm.createContext(context);
vm.runInContext(helperSource, context);

const feel = context.__feel;
const key = feel.makeCueKey("room-a", 12, "diceRolled", "seat-0", "roll");
assert.strictEqual(key, "room-a:12:diceRolled:seat-0:roll", "cue key uses scope/revision/type/entity/detail");

assert.strictEqual(feel.hasPlayedCue(key), false, "new cue key is not played");
feel.markCuePlayed(key, { visual: "played" });
assert.strictEqual(feel.hasPlayedCue(key), true, "played cue key is recorded");
assert.strictEqual(
  feel.shouldPlayCue({ key, scopeId: "room-a", revision: 12, channels: { visual: true } }, feel.DEFAULT_FEEL_SETTINGS),
  false,
  "duplicate cue is suppressed"
);

const distinctKey = feel.makeCueKey("room-a", 12, "diceRolled", "seat-0", "settle");
assert.notStrictEqual(distinctKey, key, "detailKey separates cues within the same revision");

feel.suppressHydrateCueScope("room-a", 12);
assert.strictEqual(feel.isHydrateCueSuppressed("room-a", 12), true, "hydrate revision is suppressed");
assert.strictEqual(feel.isHydrateCueSuppressed("room-a", 13), false, "future revision is not suppressed");

const opponentProduction = feel.sanitizeCueForViewer(
  feel.makeRawCueCandidate("resourcesProduced", {
    revision: 13,
    entityId: "seat-1",
    payload: { seatIndex: 1, resourceType: "forest", amount: 2 }
  }),
  { viewerSeatIndex: 0 }
);
assert.strictEqual(opponentProduction.payload.resourceType, undefined, "opponent resource type is removed");
assert.strictEqual(opponentProduction.payload.cardDelta, 2, "opponent production keeps generic card delta");

const ownProduction = feel.sanitizeCueForViewer(
  feel.makeRawCueCandidate("resourcesProduced", {
    revision: 13,
    entityId: "seat-0",
    payload: { seatIndex: 0, resourceType: "forest", amount: 2 }
  }),
  { viewerSeatIndex: 0 }
);
assert.strictEqual(ownProduction.payload.resourceType, "forest", "viewer resource type remains visible");

const observerRobber = feel.sanitizeCueForViewer(
  feel.makeRawCueCandidate("robberResult", {
    revision: 14,
    payload: { actorSeatIndex: 1, victimSeatIndex: 2, resourceType: "hill" }
  }),
  { viewerSeatIndex: 0 }
);
assert.strictEqual(observerRobber.payload.resourceType, undefined, "observer robber resource type is removed");
assert.strictEqual(observerRobber.viewerRole, "observer", "observer role is assigned");

const devBuy = feel.sanitizeCueForViewer(
  feel.makeRawCueCandidate("devCardBought", {
    revision: 15,
    payload: { seatIndex: 0, cardType: "victoryPoint", cardDelta: 1 }
  }),
  { viewerSeatIndex: 0 }
);
assert.strictEqual(devBuy.payload.cardType, undefined, "dev card purchase type is removed");
assert.strictEqual(devBuy.payload.cardDelta, 1, "dev card purchase keeps generic delta");

console.log("game-feel-cue-dedupe-static-test passed");
