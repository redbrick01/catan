const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function bodyOf(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert(start >= 0, `${name} exists`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  assert.fail(`${name} body is closed`);
}

assert(script.includes("let shownVictoryModalKey = null"), "victory modal has one-shot state");
assert(script.includes("function showVictoryModal"), "victory modal helper exists");

const showVictoryModal = bodyOf(script, "showVictoryModal");
assert(showVictoryModal.includes('onlineSession.modalKind = "victory"'), "victory modal marks modal kind");
assert(showVictoryModal.includes("showModal(`${winner.name} 승리!`"), "victory modal opens with winner title");
assert(showVictoryModal.includes("victory-modal-summary"), "victory modal renders a result summary");
assert(showVictoryModal.includes("addModalButton(\"결과 보기\", hideModal"), "victory modal has close/result button");
assert(showVictoryModal.includes("addModalButton(\"새 게임\", resetToSetup"), "offline victory modal can start a new game");

const checkWin = bodyOf(script, "checkWin");
assert(checkWin.includes("showVictoryModal(player.id)"), "offline win opens victory modal");
assert(checkWin.indexOf("game.winner = player.id") < checkWin.indexOf("showVictoryModal(player.id)"), "offline modal opens after winner is stored");

const logOnlineStateDelta = bodyOf(script, "logOnlineStateDelta");
assert(logOnlineStateDelta.includes("showVictoryModal(nextGame.winner, state.revision)"), "online win opens victory modal on winner transition");
assert(
  logOnlineStateDelta.indexOf("emitWinnerDeclaredCue(nextGame.winner, state.revision)") < logOnlineStateDelta.indexOf("showVictoryModal(nextGame.winner, state.revision)"),
  "online modal opens after winner cue dispatch"
);

assert(styles.includes(".victory-modal-summary"), "victory modal summary styles exist");

console.log("victory-modal-static-test passed");
