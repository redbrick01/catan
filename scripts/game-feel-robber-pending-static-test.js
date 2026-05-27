const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

function includes(source, needle, label) {
  assert(source.includes(needle), label || `Missing ${needle}`);
}

includes(script, "function emitPendingActionCue", "pending action cues should use the FEEL cue bus");
includes(script, "discardPendingStarted", "discard pending event type should be distinct");
includes(script, "robberMovePendingStarted", "robber move pending event type should be distinct");
includes(script, "robberVictimPendingStarted", "victim selection pending event type should be distinct");
includes(script, "function emitRobberMovedCue", "robber movement completion cue should exist");
includes(script, "function emitRobberResultCue", "robber result cue should exist");
includes(script, "resourceType: result.resource || result.resourceType || null", "result cue should pass through sanitizer-owned resource visibility");
includes(script, "if (!canSeeResource)", "robber result sanitizer should hide observer resource types");
includes(script, "delete cue.payload.resourceType", "observer robber cues should remove concrete resource type");
includes(script, "sessionStorage.setItem(robberResultStorageKey(result)", "robber result modal should dedupe across reconnect/hydrate");
includes(script, "function shouldShowRobberResultModal", "robber result modal visibility should be participant-gated");
includes(script, "game.viewerSeatIndex === result.actorSeatIndex || game.viewerSeatIndex === result.victimSeatIndex", "robber result modal should only show for actor/victim online");
includes(script, "function canSeeRobberResultResource", "robber result resource text should be separately privacy-gated");
includes(script, "if (options.suppressCues && state.roomId) suppressHydrateCueScope", "hydrate snapshots should suppress cue replay");
includes(script, "canTargetRobberTile", "robber target helper should separate actor target state");
includes(script, "is-robber-current", "current robber tile class should be emitted");
includes(script, "is-robber-target", "target robber tile class should be emitted");
includes(script, "is-robber-disabled-target", "waiting viewers should get non-actionable tile state");
includes(script, "setAttribute(\"role\", \"progressbar\")", "discard progress should expose progressbar semantics");
includes(script, "data-seven-alert", "dice panel should expose seven alert state");
includes(script, "data-pending-action", "guide panel should expose pending action state");

includes(styles, ".motion-alert-cue", "alert cue animation/static style should exist");
includes(styles, ".motion-robber-move", "robber movement cue style should exist");
includes(styles, ".hex.is-robber-current", "current robber tile should have a distinct style");
includes(styles, ".hex.is-robber-target", "robber target tile should have a distinct style");
includes(styles, ".victim-button:focus-visible", "victim picker should be clear on keyboard focus");
includes(styles, "html[data-effective-motion=\"reduced\"] .motion-alert-cue", "reduced motion should suppress alert animation");

includes(server, "function makePendingActionView", "server should provide pendingActionView role matrix");
includes(server, "role: own && !own.discarded ? \"discarder\" : \"waiting\"", "discard actor/waiting roles should be viewer-specific");
includes(server, "role: pending.actorSeatIndex === viewerSeatIndex ? \"actor\" : \"waiting\"", "robber actor/waiting roles should be viewer-specific");
includes(server, "victims: isActor ? pending.victimSeatIndexes.map", "only actor should receive victim candidates");
includes(server, "resource: canSeeResource ? result.resource : null", "observer robber result should hide concrete resource");

console.log("game-feel robber pending static checks passed");
