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
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  assert.fail(`${name} body is closed`);
}

const publicPoints = bodyOf(script, "publicPoints");
assert(publicPoints.includes("v.city ? 2 : 1"), "offline public score counts cities as 2 and settlements as 1");
assert(publicPoints.includes("game.largestArmy === player.id"), "offline public score includes largest army");
assert(publicPoints.includes("game.longestRoad === player.id"), "offline public score includes longest road");

const totalPoints = bodyOf(script, "totalPoints");
assert(totalPoints.includes("publicPoints(player) + hiddenVictoryPoints(player)"), "offline total score includes hidden victory points");

const buildCity = bodyOf(script, "buildCity");
assert(buildCity.includes("if (!canTakePostRollAction())"), "offline city upgrade respects normal post-roll action gating");
assert(buildCity.includes("vertex.city = true;"), "offline city upgrade marks the vertex as a city");
assert(buildCity.includes("checkWin();"), "offline city upgrade checks for victory");
assert(
  buildCity.indexOf("vertex.city = true;") < buildCity.indexOf("checkWin();"),
  "offline city upgrade applies the city before victory check"
);

const checkWin = bodyOf(script, "checkWin");
assert(checkWin.includes("totalPoints(player) >= 10"), "offline victory uses total points threshold");
assert(checkWin.includes('game.phase === "play"'), "offline victory is only declared during play phase");
assert(checkWin.includes("game.winner = player.id"), "offline victory records the winning player");

const publicBuildingPoints = bodyOf(server, "publicBuildingPoints");
assert(publicBuildingPoints.includes("vertex.city ? 2 : 1"), "server public score counts cities as 2 and settlements as 1");

const victoryPointsForSeat = bodyOf(server, "victoryPointsForSeat");
assert(
  victoryPointsForSeat.includes("publicBuildingPoints(matchState, seatIndex) + countHiddenVictoryPoints(player.dev)"),
  "server total score includes building and hidden victory points"
);
assert(victoryPointsForSeat.includes("game.largestArmy === seatIndex"), "server total score includes largest army");
assert(victoryPointsForSeat.includes("game.longestRoad === seatIndex"), "server total score includes longest road");

const updateWinnerForSeat = bodyOf(server, "updateWinnerForSeat");
assert(updateWinnerForSeat.includes("victoryPointsForSeat(matchState, seatIndex) >= 10"), "server victory uses total points threshold");
assert(updateWinnerForSeat.includes("matchState.game.winner = seatIndex"), "server victory records the winning seat");

const handleBuildCity = bodyOf(server, "handleBuildCity");
assert(handleBuildCity.includes("vertex.city = true;"), "server city upgrade marks the vertex as a city");
assert(handleBuildCity.includes("updateWinnerForSeat(matchState, seatIndex);"), "server city upgrade checks for victory");
assert(
  handleBuildCity.indexOf("vertex.city = true;") < handleBuildCity.indexOf("updateWinnerForSeat(matchState, seatIndex);"),
  "server city upgrade applies the city before victory check"
);
assert(
  handleBuildCity.indexOf("updateWinnerForSeat(matchState, seatIndex);") < handleBuildCity.indexOf("finishBuildCommand"),
  "server winner is updated before broadcasting the build result"
);

console.log("city-victory-upgrade-static-test passed");
