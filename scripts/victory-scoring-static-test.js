const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

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

const offlinePublicPoints = bodyOf(script, "publicPoints");
assert(offlinePublicPoints.includes("v.city ? 2 : 1"), "offline score counts city as 2 and settlement as 1");
assert(offlinePublicPoints.includes("game.largestArmy === player.id"), "offline score includes largest army");
assert(offlinePublicPoints.includes("game.longestRoad === player.id"), "offline score includes longest road");

const offlineHiddenPoints = bodyOf(script, "hiddenVictoryPoints");
assert(offlineHiddenPoints.includes('card.type === "victory"'), "offline hidden score counts victory development cards");

const offlineTotalPoints = bodyOf(script, "totalPoints");
assert(
  offlineTotalPoints.includes("publicPoints(player) + hiddenVictoryPoints(player)"),
  "offline total score combines public and hidden points"
);

const offlineCheckWin = bodyOf(script, "checkWin");
assert(offlineCheckWin.includes("totalPoints(player) >= 10"), "offline victory threshold allows scores above 10");
assert(offlineCheckWin.includes('game.phase === "play"'), "offline victory only triggers during play");
assert(offlineCheckWin.includes("game.winner = player.id"), "offline victory records current player");

const serverPublicPoints = bodyOf(server, "publicBuildingPoints");
assert(serverPublicPoints.includes("vertex.city ? 2 : 1"), "server score counts city as 2 and settlement as 1");

const serverVictoryPoints = bodyOf(server, "victoryPointsForSeat");
assert(
  serverVictoryPoints.includes("publicBuildingPoints(matchState, seatIndex) + countHiddenVictoryPoints(player.dev)"),
  "server total score combines public and hidden points"
);
assert(serverVictoryPoints.includes("game.largestArmy === seatIndex"), "server score includes largest army");
assert(serverVictoryPoints.includes("game.longestRoad === seatIndex"), "server score includes longest road");

const serverUpdateWinner = bodyOf(server, "updateWinnerForSeat");
assert(
  serverUpdateWinner.includes("matchState.game.winner !== null") && serverUpdateWinner.indexOf("return;") < serverUpdateWinner.indexOf("victoryPointsForSeat"),
  "server does not overwrite an existing winner"
);
assert(serverUpdateWinner.includes("victoryPointsForSeat(matchState, seatIndex) >= 10"), "server victory threshold allows scores above 10");
assert(serverUpdateWinner.includes("matchState.game.winner = seatIndex"), "server victory records winning seat");

const serverView = bodyOf(server, "makeWinnerSummary");
assert(serverView.includes("victoryDevCount: countHiddenVictoryPoints(winner.dev)"), "winner summary reveals hidden victory count after win");

console.log("victory-scoring-static-test passed");
