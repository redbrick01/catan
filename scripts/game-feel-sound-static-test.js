const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "script.js"), "utf8");
const start = source.indexOf("const FEEL_SETTINGS_STORAGE_KEY");
const end = source.indexOf("function ensureButton", start);
assert(start >= 0 && end > start, "FEEL helper section is present");

const storage = new Map();
const helperSource = `function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
${source.slice(start, end)}
globalThis.__sound = {
  DEFAULT_FEEL_SETTINGS,
  sanitizeFeelSettings,
  saveFeelSettings,
  getEffectiveFeelSettings,
  enableSoundEffects,
  playSoundCue,
  setSoundVolume,
  getAudioRuntimeState,
  mapCueToSound,
  preloadSoundAssets,
  emitGameCue,
  makeRawCueCandidate,
  resetPlayedCueKeys
};`;

class FakeAudioContext {
  constructor() {
    this.state = "suspended";
  }

  async resume() {
    this.state = "running";
  }
}

const context = {
  console,
  Date,
  Math,
  localStorage: {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value))
  },
  window: {
    AudioContext: FakeAudioContext,
    matchMedia: () => ({ matches: false })
  },
  document: {
    documentElement: {
      dataset: {},
      classList: { toggle: () => {} }
    }
  },
  onlineSession: { roomId: "room-a", revision: 1 },
  game: { viewerSeatIndex: 0 },
  addLog: () => {}
};

vm.createContext(context);
vm.runInContext(helperSource, context);

const sound = context.__sound;

const diceCue = sound.makeRawCueCandidate("diceRolled", {
  scopeId: "room-a",
  revision: 2,
  entityId: "seat-0",
  detailKey: "roll",
  channels: { visual: true, sound: true },
  payload: { dice: { die1: 3, die2: 4 }, total: 7 }
});

assert.strictEqual(sound.playSoundCue(diceCue), "skipped-disabled", "sound off skips playback");

sound.saveFeelSettings({ ...sound.DEFAULT_FEEL_SETTINGS, soundEnabled: true, soundVolume: 0 });
assert.strictEqual(sound.playSoundCue(diceCue), "skipped-muted", "volume 0 skips playback");

sound.saveFeelSettings({ ...sound.DEFAULT_FEEL_SETTINGS, soundEnabled: true, soundVolume: 60 });
assert.strictEqual(sound.playSoundCue(diceCue), "skipped-locked", "locked runtime skips playback");

sound.enableSoundEffects().then((result) => {
  assert.strictEqual(result.status, "unlocked", "user gesture unlocks fake AudioContext");
  assert.strictEqual(sound.playSoundCue(diceCue), "skipped-no-asset", "missing asset is a safe skip");
  assert.strictEqual(sound.mapCueToSound(diceCue).asset, "dice-roll", "dice cue maps to dice-roll sound");

  sound.resetPlayedCueKeys();
  const emitted = sound.emitGameCue(diceCue);
  assert.strictEqual(emitted.played, true, "sound channel skip still marks cue as handled");
  assert.strictEqual(emitted.result.sound, "skipped-no-asset", "sound channel result is recorded");
  console.log("game-feel-sound-static-test passed");
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
