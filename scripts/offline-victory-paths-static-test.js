const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

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

function assertOrder(body, first, second, label) {
  assert(body.includes(first), `${label}: ${first} exists`);
  assert(body.includes(second), `${label}: ${second} exists`);
  assert(body.indexOf(first) < body.indexOf(second), `${label}: ${first} happens before ${second}`);
}

const buildSettlement = bodyOf(script, "buildSettlement");
assert(buildSettlement.includes("if (!setup) checkWin();"), "settlement build checks win outside setup");
assertOrder(buildSettlement, "vertices[vertexId].owner = player.id;", "if (!setup) checkWin();", "settlement victory path");
assertOrder(buildSettlement, "vertices[vertexId].city = false;", "if (!setup) checkWin();", "settlement city flag path");

const buildCity = bodyOf(script, "buildCity");
assertOrder(buildCity, "vertex.city = true;", "checkWin();", "city victory path");
assertOrder(buildCity, "player.cities -= 1;", "checkWin();", "city piece count path");
assertOrder(buildCity, "player.settlements += 1;", "checkWin();", "city settlement return path");

const buildRoad = bodyOf(script, "buildRoad");
assertOrder(buildRoad, "edges[edgeId].owner = player.id;", "updateLongestRoad();", "road ownership path");
assertOrder(buildRoad, "updateLongestRoad();", "checkWin();", "longest road victory path");

const buyDevCard = bodyOf(script, "buyDevCard");
assertOrder(buyDevCard, "player.dev.push(card);", "checkWin();", "victory development card purchase path");

const playKnight = bodyOf(script, "playKnight");
assertOrder(playKnight, "player.knights += 1;", "updateLargestArmy();", "knight count path");
assertOrder(playKnight, "updateLargestArmy();", "checkWin();", "largest army victory path");
assert(playKnight.includes("if (game.winner !== null)"), "knight winner path clears robber follow-up when the knight wins");

const updateLongestRoad = bodyOf(script, "updateLongestRoad");
assert(updateLongestRoad.includes("item.length >= 5"), "longest road requires at least five roads");
assert(updateLongestRoad.includes("leaders.length === 1"), "longest road handles ties without arbitrary transfer");

const updateLargestArmy = bodyOf(script, "updateLargestArmy");
assert(updateLargestArmy.includes("p.knights >= 3"), "largest army requires at least three knights");
assert(updateLargestArmy.includes("leader.knights > game.players[game.largestArmy].knights"), "largest army transfer requires strictly more knights");

console.log("offline-victory-paths-static-test passed");
