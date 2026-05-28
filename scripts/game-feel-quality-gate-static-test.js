const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

function includes(source, needle, label) {
  assert(source.includes(needle), label || `Missing ${needle}`);
}

[
  "000-feedback-foundation",
  "001-turn-feedback",
  "002-dice-production-feedback",
  "003-action-result-feedback",
  "004-robber-pending-feedback",
  "005-icon-asset-system",
  "006a-sound-foundation",
  "006b-event-sound"
].forEach((name) => {
  includes(
    fs.readdirSync(path.join(root, "docs", "reports")).join("\n"),
    `2026-05-27_game-feel-${name}-final-report.md`,
    `${name} final report should exist`
  );
});

includes(script, "function sanitizeCueForViewer", "private cue sanitizer should exist");
includes(script, "delete cue.payload.resourceType", "private resource details should be removed from observer cues");
includes(script, "delete cue.payload.cardType", "development card purchase type should be removed");
includes(script, "if (viewerState.isHydrating || isHydrateCueSuppressed", "hydrate should suppress cue playback");
includes(script, "if (options.suppressCues && state.roomId) suppressHydrateCueScope", "online hydrate should register suppression");
includes(script, "resetPlayedCueKeys(state.roomId)", "online room scope reset should clear stale cue keys");
includes(script, "modalOverlay.addEventListener(\"keydown\"", "settings modal should handle keyboard containment");
includes(script, "soundVolume <= 0", "volume 0 should mute sound playback");
includes(script, "soundEnabled: false", "sound should default off");
includes(script, "turnSoundEnabled", "turn sound category should exist");
includes(script, "importantEventSoundEnabled", "important sound category should exist");

[
  ".motion-turn-pulse",
  ".motion-alert-cue",
  ".motion-robber-move",
  ".motion-road-draw",
  ".motion-build-pop",
  ".motion-trade-swap",
  ".motion-win-highlight",
  ".motion-command-rejected",
  ".motion-resource-bump"
].forEach((className) => {
  includes(styles, className, `${className} style should exist`);
});

includes(styles, "html[data-effective-motion=\"reduced\"]", "reduced motion override should exist");
includes(styles, "@media (prefers-reduced-motion: reduce)", "OS reduced motion media query should exist");
includes(styles, "@media (max-width: 780px)", "mobile layout breakpoint should exist");
includes(styles, "max-height: calc(100vh - 36px)", "modals should fit within viewport height");
includes(styles, "overflow-wrap: anywhere", "long text should wrap in compact layouts");
includes(styles, ".modal-actions", "modal action layout should be styled");
includes(index, "aria-modal=\"true\"", "modal should expose dialog semantics");
includes(index, "role=\"dialog\"", "modal should have dialog role");

const helperStart = script.indexOf("const FEEL_SETTINGS_STORAGE_KEY");
const helperEnd = script.indexOf("function ensureButton", helperStart);
assert(helperStart >= 0 && helperEnd > helperStart, "FEEL helper section is present");

const helperSource = `function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
${script.slice(helperStart, helperEnd)}
globalThis.__gate = {
  DEFAULT_FEEL_SETTINGS,
  sanitizeFeelSettings,
  getEffectiveFeelSettings,
  applyFeelSettings,
  makeCueKey,
  markCuePlayed,
  shouldPlayCue,
  makeRawCueCandidate,
  sanitizeCueForViewer,
  suppressHydrateCueScope,
  isHydrateCueSuppressed,
  mapCueToSound,
  playSoundCue
};`;

const classList = new Set();
const context = {
  console,
  Date,
  Math,
  localStorage: { getItem: () => null, setItem: () => {} },
  window: { matchMedia: () => ({ matches: true }) },
  document: {
    documentElement: {
      dataset: {},
      classList: {
        toggle(name, enabled) {
          if (enabled) classList.add(name);
          else classList.delete(name);
        }
      }
    }
  },
  onlineSession: { roomId: "room-a", revision: 10 },
  game: { viewerSeatIndex: 0 },
  addLog: () => {}
};

vm.createContext(context);
vm.runInContext(helperSource, context);

const gate = context.__gate;

assert.strictEqual(gate.DEFAULT_FEEL_SETTINGS.soundEnabled, false, "sound is off by default");
assert.strictEqual(gate.sanitizeFeelSettings({ soundVolume: -10 }).soundVolume, 0, "sound volume clamps low");
assert.strictEqual(gate.sanitizeFeelSettings({ soundVolume: 999 }).soundVolume, 100, "sound volume clamps high");
assert.strictEqual(gate.getEffectiveFeelSettings({ ...gate.DEFAULT_FEEL_SETTINGS, motionMode: "auto" }).effectiveMotion, "reduced", "auto follows reduced motion preference");
gate.applyFeelSettings({ ...gate.DEFAULT_FEEL_SETTINGS, motionMode: "reduced", soundEnabled: false });
assert.strictEqual(context.document.documentElement.dataset.effectiveMotion, "reduced", "reduced motion is reflected on DOM");
assert(classList.has("is-reduced-motion"), "reduced motion class is applied");

const cueKey = gate.makeCueKey("room-a", 10, "diceRolled", "seat-0", "roll");
gate.markCuePlayed(cueKey, { visual: "played", sound: "skipped-no-asset" });
assert.strictEqual(gate.shouldPlayCue({ key: cueKey, scopeId: "room-a", revision: 10 }), false, "duplicate cue key is suppressed");
gate.suppressHydrateCueScope("room-a", 12);
assert.strictEqual(gate.isHydrateCueSuppressed("room-a", 12), true, "hydrate revision is suppressed");
assert.strictEqual(gate.shouldPlayCue({ key: "room-a:12:test", scopeId: "room-a", revision: 12 }), false, "hydrate-suppressed cue does not play");

const opponentProduction = gate.sanitizeCueForViewer(gate.makeRawCueCandidate("resourcesProduced", {
  scopeId: "room-a",
  revision: 13,
  entityId: "seat-1",
  payload: { seatIndex: 1, resourceType: "field", amount: 2 }
}), { viewerSeatIndex: 0 });
assert.strictEqual(opponentProduction.payload.resourceType, undefined, "opponent production hides resource type");
assert.strictEqual(gate.mapCueToSound(opponentProduction).asset, "card-gain", "opponent production sound is generic");

const observerRobber = gate.sanitizeCueForViewer(gate.makeRawCueCandidate("robberResult", {
  scopeId: "room-a",
  revision: 14,
  entityId: "seat-1",
  payload: { actorSeatIndex: 1, victimSeatIndex: 2, resourceType: "hill" }
}), { viewerSeatIndex: 0 });
assert.strictEqual(observerRobber.payload.resourceType, undefined, "observer robber hides stolen resource");
assert.strictEqual(gate.mapCueToSound(observerRobber).privacy, "generic-robber", "observer robber sound is generic");

const devBuy = gate.sanitizeCueForViewer(gate.makeRawCueCandidate("devCardBought", {
  scopeId: "room-a",
  revision: 15,
  entityId: "seat-0",
  payload: { seatIndex: 0, cardType: "victoryPoint", devCardType: "victoryPoint" }
}), { viewerSeatIndex: 0 });
assert.strictEqual(devBuy.payload.cardType, undefined, "dev card buy hides card type");
assert.strictEqual(devBuy.payload.devCardType, undefined, "dev card buy hides alternate card type");
assert.strictEqual(gate.mapCueToSound(devBuy).privacy, "generic-card", "dev card buy sound is generic");

assert.strictEqual(gate.playSoundCue({ type: "diceRolled", payload: {} }, gate.DEFAULT_FEEL_SETTINGS), "skipped-disabled", "sound off skips playback");
assert.strictEqual(gate.playSoundCue({ type: "diceRolled", payload: {} }, { ...gate.DEFAULT_FEEL_SETTINGS, soundEnabled: true, soundVolume: 0 }), "skipped-muted", "volume zero skips playback");

console.log("game-feel-quality-gate-static-test passed");
