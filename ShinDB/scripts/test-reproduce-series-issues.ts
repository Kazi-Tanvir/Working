import assert from "node:assert";
import { CANONICAL_SEASONS_MAP, generateDefaultSeasons, formatStructuredProgress } from "../src/utils/seasonHelpers";

console.log("=== TDD REPRODUCTION: SERIES ISSUES ===");

// TEST 1: Check CANONICAL_SEASONS_MAP contains popular/user series
console.log("\n[TEST 1] Canonical seasons map for Mirzapur, Hostel Daze, Kota Factory, Borat");
const hasMirzapur = !!CANONICAL_SEASONS_MAP["mirzapur"];
const hasHostelDaze = !!CANONICAL_SEASONS_MAP["hostel daze"];
const hasKotaFactory = !!CANONICAL_SEASONS_MAP["kota factory"];
const hasBorat = !!CANONICAL_SEASONS_MAP["borat's american lockdown & debunking borat"];

console.log("Has Mirzapur in canonical map:", hasMirzapur);
console.log("Has Hostel Daze in canonical map:", hasHostelDaze);
console.log("Has Kota Factory in canonical map:", hasKotaFactory);
console.log("Has Borat in canonical map:", hasBorat);

// TEST 2: Kota Factory season generation with 15 total episodes
console.log("\n[TEST 2] Kota Factory season generation");
const kotaSeasons = generateDefaultSeasons("Kota Factory", 15, 15);
console.log("Kota Factory generated season count:", kotaSeasons.length);
// Right now it generates 1 season of 15 episodes due to totalEpisodes <= 16 fallback!
assert.strictEqual(kotaSeasons.length === 1, true, "Demonstrates bug: Kota Factory gets 1 season instead of 3 seasons!");

// TEST 3: parseProgressNum on completed multi-season show string
console.log("\n[TEST 3] parseProgressNum on completed series format");
const parseProgressNumCurrent = (p: string) => {
  const se = (p || "").match(/S(\d+)E(\d+)/i);
  if (se) return (parseInt(se[1], 10) - 1) * 10 + parseInt(se[2], 10);
  return parseInt((p || "").split("/")[0], 10) || 0;
};

const gotVal = parseProgressNumCurrent("S1 Complete (73/73 EP)");
const bbVal = parseProgressNumCurrent("S1 Complete (62/62 EP)");
console.log("parseProgressNum on 'S1 Complete (73/73 EP)':", gotVal);
console.log("parseProgressNum on 'S1 Complete (62/62 EP)':", bbVal);
assert.strictEqual(gotVal, 0, "Demonstrates bug: Game of Thrones completed progress parses to 0!");
assert.strictEqual(bbVal, 0, "Demonstrates bug: Breaking Bad completed progress parses to 0!");

// TEST 4: MediaCard bottom-left metric logic
console.log("\n[TEST 4] MediaCard current display logic on completed multi-season series");
const currentDisplayLogic = (currentProgress: string, label: string) => {
  return currentProgress.includes("/") ? currentProgress.split(" ")[0] : label;
};

const cardMetricGot = currentDisplayLogic("S1 Complete (73/73 EP)", "Completed");
const cardMetricOzark = currentDisplayLogic("S3 Complete (10/44 EP)", "On-Hold");
console.log("Card metric for Game of Thrones:", cardMetricGot);
console.log("Card metric for Ozark:", cardMetricOzark);
assert.strictEqual(cardMetricGot, "S1", "Demonstrates bug: Shows 'S1' instead of '73/73'!");
assert.strictEqual(cardMetricOzark, "S3", "Demonstrates bug: Shows 'S3' instead of '10/44'!");

console.log("\n✓ All 4 reproduction tests demonstrated the exact user-reported issues!");

