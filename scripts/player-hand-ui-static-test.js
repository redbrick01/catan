const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const index = read("index.html");
const script = read("script.js");
const styles = read("styles.css");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function functionBody(name) {
  const start = script.indexOf(`function ${name}(`);
  assert(start >= 0, `Missing function ${name}`);
  const brace = script.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < script.length; i += 1) {
    if (script[i] === "{") depth += 1;
    if (script[i] === "}") depth -= 1;
    if (depth === 0) return script.slice(brace + 1, i);
  }
  throw new Error(`Could not parse function ${name}`);
}

assert(index.includes('id="playerHandDock"'), "playerHandDock DOM node is missing");
assert(index.includes('id="playerResourceHand"'), "playerResourceHand DOM node is missing");
assert(index.includes('id="playerHandToggle"'), "playerHandToggle DOM node is missing");
assert(!index.includes("playerDevHand"), "development cards should share the existing hand dock row");

[
  "handViewerPlayer",
  "renderPlayerHandDock",
  "renderResourceHandCards",
  "resourceHandCardHtml",
  "renderDevHandCards",
  "devHandCardHtml"
].forEach((name) => assert(script.includes(`function ${name}(`), `${name} helper is missing`));

const viewerBody = functionBody("handViewerPlayer");
assert(viewerBody.includes("isOnlinePlaying()"), "handViewerPlayer must branch online/offline");
assert(viewerBody.includes("game.viewerSeatIndex"), "handViewerPlayer must prefer game.viewerSeatIndex online");
assert(viewerBody.includes("onlineSession.playerId"), "handViewerPlayer should only fall back through online identity");
assert(viewerBody.includes("return null"), "handViewerPlayer must hide the dock when viewer is uncertain");

const handRenderBody = functionBody("renderPlayerHandDock");
assert(handRenderBody.includes("playerHandDock.classList.add(\"hidden\")"), "hand dock must hide when viewer/resources are unavailable");
assert(handRenderBody.includes("playerResourceHand.replaceChildren()"), "hand dock must clear stale cards when hidden");
assert(handRenderBody.includes("renderResourceHandCards(player)"), "hand dock must render viewer resource cards");
assert(handRenderBody.includes("renderDevHandCards(player)"), "hand dock must render viewer development cards");
assert(handRenderBody.includes("playerHandExpanded"), "hand dock must render expanded/collapsed state");
assert(handRenderBody.includes("isMobileViewport()"), "mobile hand dock must stay expanded");

const seatBody = functionBody("renderSeats");
assert(!seatBody.includes("renderResourceBreakdown("), "seat cards must not expose detailed resource breakdown");
assert(seatBody.includes("renderResourceSummary(player)"), "seat cards must keep public resource summary");
assert(script.includes("renderPlayerHandDock();"), "render flow must update player hand dock");
assert(script.includes("updatePlayerHandCardMetrics();"), "render flow must sync hand card size with board tile size");
assert(script.includes("playerHandToggle?.addEventListener(\"click\""), "hand dock toggle click handler is missing");
assert(script.includes("playerResourceHand?.addEventListener(\"click\""), "expanded hand cards must collapse the hand dock on click");
assert(script.includes("if (isMobileViewport()) return"), "mobile hand dock interactions must not collapse the always-expanded row");
assert(script.includes("schedulePlayerHandCardMetricsUpdate();"), "hand card metrics must update on resize");
assert(script.includes("syncResponsivePanelPlacement"), "responsive panel placement helper is missing");
assert(script.includes("LANDSCAPE_PANEL_QUERY"), "landscape panel query is missing");

assert(script.includes("resourceIconToken(type)"), "hand cards must reuse Tabler resource icon tokens");
assert(script.includes("function resourceBundleCostHtml"), "cost reference should support resource card rendering");
assert(script.includes("cost-card-stack"), "cost reference should render resource cards by quantity");
assert(!script.includes("assets/icons/"), "PLAYER-HAND-UI-1 must not add icon asset paths");
assert(functionBody("renderDevHandCards").includes("Array.isArray(player?.dev)"), "development card types must render only from viewer private dev cards");
assert(!functionBody("renderSeats").includes("renderDevHandCards"), "seat cards must not expose development card types");
assert(!functionBody("renderPlayers").includes("renderDevHandCards"), "player rows must not expose development card types");

assert(styles.includes(".player-hand-dock"), "player hand dock CSS is missing");
assert(styles.includes(".hand-card-row"), "hand card row CSS is missing");
assert(styles.includes(".hand-resource-card"), "hand resource card CSS is missing");
assert(styles.includes(".hand-dev-card"), "hand development card CSS is missing");
assert(styles.includes("--hand-card-width"), "hand cards must use dynamic sizing variables");
assert(styles.includes(".cost-resource-card.resource-forest"), "cost resource cards should be color coded");
assert(styles.includes(".player-hand-dock.is-expanded"), "hand dock expanded style is missing");
assert(styles.includes(".player-hand-dock.is-expanded .player-hand-head"), "expanded hand dock must hide the collapse header");
assert(styles.includes(".player-hand-dock:not(.is-expanded) .hand-resource-card:nth-child(1)"), "collapsed stack card style is missing");
assert(styles.includes("overflow-x: auto"), "mobile/compact hand row must support horizontal scrolling");
assert(styles.includes("@media (max-width: 780px)"), "mobile guardrail media query is missing");
assert(styles.includes("scroll-snap-type: x proximity"), "mobile hand row scroll guardrail is missing");
assert(styles.includes(".player-hand-dock:not(.is-expanded) .hand-resource-card:nth-child(n+6)") && styles.includes("display: grid"), "mobile hand dock must show all cards in expanded row");
assert(styles.includes("html[data-effective-motion=\"reduced\"]") && styles.includes(".hand-resource-card"), "reduced motion guardrail must include hand cards");
assert(styles.includes("grid-row: 2") && styles.includes("grid-column: 1 / -1"), "hand dock must occupy a non-overlapping bottom grid row");

console.log("PLAYER-HAND-UI static checks passed");
