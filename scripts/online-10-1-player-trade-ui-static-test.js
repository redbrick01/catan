const fs = require("node:fs");

const script = fs.readFileSync("script.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");
const server = fs.readFileSync("server.js", "utf8");

function assertIncludes(label, source, needle) {
  if (!source.includes(needle)) {
    throw new Error(`${label}: missing ${needle}`);
  }
  console.log(`ok - ${label}`);
}

function assertNotIncludes(label, source, needle) {
  if (source.includes(needle)) {
    throw new Error(`${label}: unexpected ${needle}`);
  }
  console.log(`ok - ${label}`);
}

assertIncludes("resource shortfall helper exists", script, "function resourceBundleShortfall");
assertIncludes("bundle resource helper exists", script, "function hasBundleResources");
assertIncludes("viewer player helper exists", script, "function onlineViewerGamePlayer");
assertIncludes("requester offer zone label exists", script, "내가 줄 자원");
assertIncludes("requester request zone label exists", script, "받을 자원");
assertIncludes("response zone label exists", script, "응답");
assertIncludes("resource shortage text exists", script, "자원이 없습니다");
assertIncludes("counter apply wording exists", script, "흥정 조건 반영");
assertIncludes("counter uses composer flow", script, "showOnlinePlayerTradeComposer({ trade, counter: response })");
assertIncludes("accept button uses canAccept", script, "accept.disabled = hasResponded || !canAccept");
assertIncludes("counter apply checks counterRequest", script, "hasBundleResources(viewer, response.counterRequest)");
assertIncludes("counter submit checks counterOffer", script, "hasBundleResources(player, counterOffer)");
assertIncludes("three zone composer css exists", styles, ".player-trade-composer");
assertIncludes("three zone requester css exists", styles, ".player-trade-requester-grid");
assertIncludes("trade warning css exists", styles, ".trade-warning");
assertIncludes("mobile one-column css includes composer", styles, ".player-trade-composer,");
assertNotIncludes("no new acceptCounter command", server, "acceptCounterPlayerTrade");

console.log("online-10-1 player trade UI static tests passed");
