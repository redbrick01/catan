const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function includes(source, needle, label) {
  assert(source.includes(needle), label || `Missing ${needle}`);
}

includes(script, "function emitActionResultCue", "action result cues should share a cue helper");
includes(script, "function emitBuildCompletedCue", "build success cue helper should exist");
includes(script, "buildCompleted", "build success cue type should exist");
includes(script, "bankTradeCompleted", "bank trade success cue type should exist");
includes(script, "playerTradeCompleted", "player trade success cue type should exist");
includes(script, "devCardBought", "development card purchase cue type should exist");
includes(script, "devCardPlayed", "development card play cue type should exist");
includes(script, "winnerDeclared", "winner cue type should exist");
includes(script, "commandRejected", "command rejection cue type should exist");
includes(script, "delete cue.payload.cardType", "development card purchase sanitizer should hide card type");
includes(script, "publicCardType", "played development cards should use public/generic card labels");
includes(script, "previousState.matchState?.edges", "online build cues should come from state delta");
includes(script, "previousState.matchState?.vertices", "online settlement/city cues should come from state delta");
includes(script, "state.lastPlayerTradeResult", "player trade result cue should come from state state");
includes(script, "pending.commandName", "online command rejection should keep command context");
includes(script, "rejectLocalAction", "local validation failures should emit rejection cues");
includes(script, "motion-road-draw", "road target motion class should be used");
includes(script, "motion-build-pop", "building/dev motion class should be used");
includes(script, "motion-trade-swap", "trade motion class should be used");
includes(script, "motion-win-highlight", "winner motion class should be used");
includes(script, "motion-command-rejected", "rejection motion class should be used");

includes(styles, ".motion-road-draw", "road draw style should exist");
includes(styles, ".motion-build-pop", "build pop style should exist");
includes(styles, ".motion-trade-swap", "trade swap style should exist");
includes(styles, ".motion-win-highlight", "win highlight style should exist");
includes(styles, ".motion-command-rejected", "command rejected style should exist");
includes(styles, "html[data-effective-motion=\"reduced\"] .motion-road-draw", "reduced motion should suppress action result animation");

console.log("game-feel action result static checks passed");
