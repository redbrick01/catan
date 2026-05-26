const fs = require("fs");
const assert = require("assert");

const script = fs.readFileSync("script.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");

[
  "function currentTurnUxState",
  "activePlayer",
  "actingPlayer",
  "pendingActors",
  "viewerPlayer",
  "currentFocusPlayer",
  "내 차례입니다",
  "내가 행동할 차례입니다",
  "data-focus-state",
  "--focus-player-color",
  "data-primary-action",
  "대상: 모든 상대",
  "overlappingTradeResources",
  "REQUEST_TIMEOUT",
  "SOCKET_CLOSED",
  "function inferLogType"
].forEach((needle) => assert(script.includes(needle), `missing script marker: ${needle}`));

[
  ".is-current-turn",
  ".is-my-turn",
  ".is-waiting-turn",
  ".is-bot-turn",
  ".is-pending-actor",
  ".is-primary-action",
  "prefers-reduced-motion",
  "--focus-player-color",
  ".log-entry",
  ".log-robber",
  ".trade-response-accept"
].forEach((needle) => assert(styles.includes(needle), `missing style marker: ${needle}`));

console.log("stage-3 UX static checks passed");
