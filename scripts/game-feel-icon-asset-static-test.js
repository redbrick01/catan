const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const manifestPath = path.join(root, "docs", "assets_manifest.md");

function includes(source, needle, label) {
  assert(source.includes(needle), label || `Missing ${needle}`);
}

[
  "forest",
  "field",
  "pasture",
  "hill",
  "mountain",
  "road",
  "settlement",
  "city",
  "devCard",
  "trade",
  "dice",
  "robber",
  "myTurn",
  "pending",
  "connection",
  "error",
  "victory"
].forEach((token) => includes(script, token, `icon token ${token} should be declared`));

includes(script, "const ICON_TOKENS", "canonical icon taxonomy should be declared");
includes(script, "const TABLER_ICON_PATHS", "Tabler inline SVG paths should be declared locally");
includes(script, "tabler-icon", "icon tokens should render inline Tabler SVG markup");
includes(script, "function drawBoardTablerIcon", "board settlement/city pieces should reuse the Tabler icon set");
includes(script, "drawBoardTablerIcon(\"home\"", "board settlements should reuse the Tabler home icon");
includes(script, "drawBoardTablerIcon(\"building-community\"", "board cities should reuse the Tabler building-community icon");
includes(script, "forest: { icon: \"wood\"", "forest should use the Tabler wood icon");
includes(script, "field: { icon: \"wheat\"", "field should use the Tabler wheat icon");
includes(script, "pasture: { icon: \"paw\"", "pasture should use the Tabler paw icon");
includes(script, "hill: { icon: \"wall\"", "hill should use the Tabler wall icon");
includes(script, "mountain: { icon: \"pick\"", "mountain should use the Tabler pick icon");
includes(script, "generic: { icon: \"package\"", "generic resources should use the Tabler package icon");
includes(script, "road: { icon: \"route\"", "road should use the Tabler route icon");
includes(script, "settlement: { icon: \"home\"", "settlement should use the Tabler home icon");
includes(script, "city: { icon: \"building-community\"", "city should use the Tabler building-community icon");
includes(script, "devCard: { icon: \"play-card\"", "development cards should use the Tabler play-card icon");
includes(script, "trade: { icon: \"exchange\"", "trade should use the Tabler exchange icon");
includes(script, "dice: { icon: \"dice\"", "dice should use the Tabler dice icon");
includes(script, "robber: { icon: \"mask\"", "robber should use the Tabler mask icon");
includes(script, "myTurn: { icon: \"user-check\"", "my turn should use the Tabler user-check icon");
includes(script, "pending: { icon: \"urgent\"", "pending should use the Tabler urgent icon");
includes(script, "connection: { icon: \"refresh-alert\"", "connection should use the Tabler refresh-alert icon");
includes(script, "error: { icon: \"alert-triangle\"", "errors should use the Tabler alert-triangle icon");
includes(script, "victory: { icon: \"trophy\"", "victory should use the Tabler trophy icon");
includes(script, "waiting: { icon: \"clock\"", "waiting should use the Tabler clock icon");
includes(script, "bot: { icon: \"robot-face\"", "bot should use the Tabler robot-face icon");
includes(script, "function resourceIconToken", "resource icons should go through a helper");
includes(script, "function actionIconToken", "action icons should go through a helper");
includes(script, "function statusIconToken", "status icons should go through a helper");
includes(script, "aria-hidden=\"true\"", "decorative icon tokens should be hidden from screen readers");
includes(script, "setAttribute(\"aria-label\"", "icon-enhanced controls should keep accessible names");
includes(script, "applyActionButtonIconTokens", "action buttons should receive consistent action tokens");
includes(script, "playerStatusHtml", "status badges should combine icon and text");
includes(script, "resourceIconToken(\"generic\")", "non-viewer resource summaries should stay generic");
includes(script, "delete cue.payload.cardType", "development card purchase cues should not expose card type");
includes(script, "delete cue.payload.resourceType", "robber observer cues should not expose resource type");

includes(styles, ".icon-token", "icon tokens should have a stable base style");
includes(styles, ".icon-token svg", "inline SVG icons should have stable sizing");
includes(styles, ".building-icon path", "board inline SVG icons should have stable path styling");
includes(styles, ".action-button-label", "action buttons should keep text labels");
includes(styles, ".player-state-label .icon-token", "status icon layout should be fixed");
includes(styles, "@media (max-width: 780px)", "mobile layout constraints should remain present");
includes(styles, "overflow-wrap: anywhere", "mobile/resource rows should protect against overlap");
includes(styles, ".visually-hidden", "visually hidden labels should be available when icon-only controls are introduced");

assert(!/lucide|fontawesome|bootstrap-icons|heroicons/i.test(index + script), "FEEL-005 should not add an external icon library");
assert(!/[🪵🌾🐑🧱⛏]/u.test(script), "resource icons should not rely on platform emoji rendering");
assert(!/assets\/icons\//.test(index + script + styles), "No file icon assets should be referenced without manifest-backed assets");
assert(!fs.existsSync(manifestPath), "No assets manifest is required when FEEL-005 adds no file assets");

console.log("game-feel icon asset static checks passed");
