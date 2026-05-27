const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "script.js"), "utf8");
const start = source.indexOf("const FEEL_SETTINGS_STORAGE_KEY");
const end = source.indexOf("function ensureButton", start);
assert(start >= 0 && end > start, "FEEL settings helper section is present");

const storage = new Map();
const classList = new Set();
const documentElement = {
  dataset: {},
  classList: {
    toggle(name, enabled) {
      if (enabled) classList.add(name);
      else classList.delete(name);
    }
  }
};

const helperSource = `function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
${source.slice(start, end)}
globalThis.__settings = {
  DEFAULT_FEEL_SETTINGS,
  sanitizeFeelSettings,
  loadFeelSettings,
  saveFeelSettings,
  getEffectiveFeelSettings,
  applyFeelSettings,
  getCurrent: () => currentFeelSettings
};`;

const context = {
  console,
  Date,
  Math,
  localStorage: {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value))
  },
  window: {
    matchMedia: () => ({ matches: true })
  },
  document: { documentElement },
  onlineSession: { roomId: null, revision: 0 },
  game: { viewerSeatIndex: null },
  addLog: () => {}
};

vm.createContext(context);
vm.runInContext(helperSource, context);

const settings = context.__settings;

assert.deepStrictEqual(settings.DEFAULT_FEEL_SETTINGS.schemaVersion, 1, "schema version is 1");
assert.strictEqual(settings.DEFAULT_FEEL_SETTINGS.soundEnabled, false, "sound defaults off");

const sanitized = settings.sanitizeFeelSettings({
  schemaVersion: 99,
  motionMode: "wild",
  soundEnabled: 1,
  soundVolume: 999,
  turnEmphasis: "loud"
});
assert.strictEqual(sanitized.schemaVersion, 1, "schema is normalized");
assert.strictEqual(sanitized.motionMode, "auto", "invalid motion falls back");
assert.strictEqual(sanitized.soundEnabled, true, "boolean fields are coerced");
assert.strictEqual(sanitized.soundVolume, 100, "volume is clamped");
assert.strictEqual(sanitized.turnEmphasis, "normal", "invalid emphasis falls back");

const reduced = settings.getEffectiveFeelSettings({ ...settings.DEFAULT_FEEL_SETTINGS, motionMode: "auto" });
assert.strictEqual(reduced.effectiveMotion, "reduced", "auto follows OS reduced motion");

const forced = settings.getEffectiveFeelSettings({ ...settings.DEFAULT_FEEL_SETTINGS, motionMode: "on" });
assert.strictEqual(forced.effectiveMotion, "on", "explicit on overrides OS reduced motion");

settings.saveFeelSettings({
  ...settings.DEFAULT_FEEL_SETTINGS,
  motionMode: "reduced",
  soundEnabled: true,
  soundVolume: 23,
  turnEmphasis: "strong",
  importantEventEmphasis: false
});
assert(storage.has("katanFeelSettings"), "settings are persisted");
assert.strictEqual(documentElement.dataset.motionMode, "reduced", "motion mode is reflected on DOM");
assert.strictEqual(documentElement.dataset.effectiveMotion, "reduced", "effective motion is reflected on DOM");
assert.strictEqual(documentElement.dataset.sound, "on", "sound state is reflected on DOM");
assert.strictEqual(documentElement.dataset.turnEmphasis, "strong", "turn emphasis is reflected on DOM");
assert.strictEqual(documentElement.dataset.eventEmphasis, "off", "event emphasis is reflected on DOM");
assert(classList.has("is-reduced-motion"), "reduced motion class is applied");

storage.set("katanFeelSettings", "{bad json");
assert.strictEqual(settings.loadFeelSettings().soundVolume, 60, "broken storage falls back to defaults");

console.log("game-feel-settings-static-test passed");
