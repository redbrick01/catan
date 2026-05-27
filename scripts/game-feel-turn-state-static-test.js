const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

assert(script.includes("function makeTurnFeedbackCue"), "turn feedback cue builder exists");
assert(script.includes("function pulseTurnFeedback"), "turn pulse dispatcher exists");
assert(script.includes("emitGameCue(cue"), "turn feedback uses FEEL-000 cue dispatcher");
assert(script.includes("eventType = pendingIds ? \"pendingStarted\" : \"turnChanged\""), "turn and pending events are separated");
assert(script.includes("data-player-id"), "player rows carry stable player ids for motion targeting");
assert(script.includes("ux.kind === \"my-turn\""), "my-turn state is distinguished");
assert(script.includes("is-pending-actor"), "pending actor state class is applied");
assert(script.includes("is-bot-turn"), "bot turn state class is applied");

assert(styles.includes(".motion-turn-pulse"), "turn pulse motion class exists");
assert(styles.includes("@keyframes motion-turn-pulse"), "turn pulse keyframes exist");
assert(styles.includes('html[data-effective-motion="reduced"] .motion-turn-pulse'), "reduced-motion disables turn pulse");
assert(styles.includes(".seat.is-current-turn"), "seat current-turn styling exists");
assert(styles.includes(".player-row.is-current-turn"), "player-row current-turn styling exists");

console.log("game-feel-turn-state-static-test passed");
