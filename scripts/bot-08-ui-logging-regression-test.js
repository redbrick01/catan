const fs = require("node:fs");

const script = fs.readFileSync("script.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");
const index = fs.readFileSync("index.html", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(script.includes("function botBadgeHtml"), "script.js is missing bot badge helper");
assert(script.includes("player.isBot"), "script.js does not branch on player.isBot");
assert(script.includes("봇 차례") || script.includes("봇 처리 중"), "script.js is missing bot turn copy");
assert(script.includes("viewerMustAnswerPending"), "script.js is missing human pending priority helper");
assert(script.includes("viewerMustAnswerTrade"), "script.js is missing human trade priority helper");
assert(script.includes("logOnlineStateDelta"), "script.js is missing public bot action log delta helper");
assert(script.includes("pendingPlayerTrade") && script.includes("game.pendingActionView"), "script.js is missing pending/trade UI branches");
assert(!script.includes("botRunner") && !script.includes("setupPlacement"), "script.js references internal bot state");

assert(styles.includes(".bot-badge"), "styles.css is missing bot badge styles");
assert(styles.includes(".bot-turn-status"), "styles.css is missing bot turn status styles");
assert(styles.includes("@media (max-width: 780px)"), "styles.css is missing mobile lobby/player rules");
assert(styles.includes("overflow-wrap: anywhere"), "styles.css is missing long-name wrapping protection");

assert(index.includes("lobbyAddBotButton"), "index.html is missing lobby add bot button");
assert(index.includes("lobbyBotControls"), "index.html is missing lobby bot controls container");

console.log("bot-08 UI/logging static regression checks passed");
