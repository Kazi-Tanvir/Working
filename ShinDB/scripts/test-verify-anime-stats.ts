import assert from "node:assert";
import { getAnimeDuration, isAnimeMovie, KNOWN_ANIME_DURATIONS } from "../src/utils/animeHelpers";

console.log("=== TDD VERIFICATION: ANIME STATS & DURATION FIXES ===");

// 1. Verify Shorts
console.log("\n[VERIFY 1] Short anime duration resolution");
const ahoGirl = getAnimeDuration({ title: "AHO-GIRL", totalEpisodes: 12 });
assert.strictEqual(ahoGirl.durationPerEp, 12, "AHO-GIRL must be 12 mins per ep");
assert.strictEqual(ahoGirl.isMovie, false, "AHO-GIRL is not a movie");

const saiki = getAnimeDuration({ title: "The Disastrous Life of Saiki K", totalEpisodes: 120 });
assert.strictEqual(saiki.durationPerEp, 5, "Saiki K short must be 5 mins per ep");
console.log("✓ Shorts correctly resolve their specific short runtimes!");

// 2. Verify Feature Movies
console.log("\n[VERIFY 2] Anime feature movies resolution");
const yourName = getAnimeDuration({ title: "Your Name.", totalEpisodes: 1 });
assert.strictEqual(yourName.durationPerEp, 107, "Your Name must be 107 mins");
assert.strictEqual(yourName.isMovie, true, "Your Name must be detected as movie");

const spiritedAway = getAnimeDuration({ title: "Spirited Away", totalEpisodes: 1 });
assert.strictEqual(spiritedAway.durationPerEp, 125, "Spirited Away must be 125 mins");
assert.strictEqual(spiritedAway.isMovie, true, "Spirited Away must be detected as movie");

const dumpsterBattle = getAnimeDuration({ title: "HAIKYU!! The Dumpster Battle", totalEpisodes: 1 });
assert.strictEqual(dumpsterBattle.durationPerEp, 85, "Dumpster battle must be 85 mins");
assert.strictEqual(dumpsterBattle.isMovie, true, "Dumpster battle must be movie");

const graveOfFireflies = getAnimeDuration({ title: "Grave of the Fireflies", totalEpisodes: 1 });
assert.strictEqual(graveOfFireflies.durationPerEp, 88, "Grave of the fireflies must be 88 mins");
assert.strictEqual(graveOfFireflies.isMovie, true, "Grave of the Fireflies must be movie");
console.log("✓ Anime movies correctly resolve exact movie durations and movie flag!");

// 3. Verify Specials and OVAs
console.log("\n[VERIFY 3] Anime specials and OVAs");
const aotSpecial = getAnimeDuration({ title: "Attack on Titan Final Season THE FINAL CHAPTERS Special 1", totalEpisodes: 1 });
assert.strictEqual(aotSpecial.durationPerEp, 61, "AoT Special 1 must be 61 mins");
assert.strictEqual(aotSpecial.isMovie, false, "AoT Special is a TV special");

const goldenBoy = getAnimeDuration({ title: "Golden Boy", totalEpisodes: 6 });
assert.strictEqual(goldenBoy.durationPerEp, 30, "Golden Boy OVA must be 30 mins per ep");

const hyoukaSpecial = getAnimeDuration({ title: "Hyouka: What Should Be Had", totalEpisodes: 1 });
assert.strictEqual(hyoukaSpecial.durationPerEp, 25, "Hyouka OVA must be 25 mins");
assert.strictEqual(hyoukaSpecial.isMovie, false);
console.log("✓ Anime specials and OVAs resolve their proper runtimes!");

// 4. Verify Generic unlisted movie detection
console.log("\n[VERIFY 4] Generic unlisted anime movie detection");
const unlistedMovie = getAnimeDuration({ title: "Some Unknown Anime: The Movie", totalEpisodes: 1 });
assert.strictEqual(unlistedMovie.isMovie, true, "Title with 'The Movie' must be detected as movie");
assert.strictEqual(unlistedMovie.durationPerEp, 100, "Generic anime movie defaults to 100 mins");
console.log("✓ Generic unlisted movies default to 100 mins and flag isMovie!");

// 5. Verify Standard TV Anime
console.log("\n[VERIFY 5] Standard television anime");
const bleach = getAnimeDuration({ title: "Bleach", totalEpisodes: 366 });
assert.strictEqual(bleach.durationPerEp, 23.5, "Standard TV anime defaults to 23.5 mins");
assert.strictEqual(bleach.isMovie, false);
console.log("✓ Standard TV anime defaults to 23.5 mins!");

// 6. Verify CategoryStats integration calculation
console.log("\n[VERIFY 6] CategoryStats integration calculation");
const testList = [
  { title: "Your Name.", status: "Completed", progressCurrent: 1, progressTotal: 1 },
  { title: "AHO-GIRL", status: "Completed", progressCurrent: 12, progressTotal: 12 },
  { title: "Attack on Titan Final Season THE FINAL CHAPTERS Special 1", status: "Completed", progressCurrent: 1, progressTotal: 1 },
  { title: "Bleach", status: "Watching", progressCurrent: 10, progressTotal: 366 },
  { title: "Spirited Away", status: "Plan to Watch", progressCurrent: 0, progressTotal: 1 },
];

let totalMins = 0;
let moviesCount = 0;
let seriesEpsCount = 0;

for (const item of testList) {
  const s = item.status.toLowerCase();
  if (s === "plan to watch" || s === "plan_to_consume") continue;
  const watched = item.progressCurrent || 0;
  const { durationPerEp, isMovie } = getAnimeDuration(item);
  const itemMins = watched * durationPerEp;
  totalMins += itemMins;
  if (isMovie) {
    moviesCount += 1;
  } else {
    seriesEpsCount += watched;
  }
}

// Expected total:
// Your Name: 1 * 107 = 107
// Aho-Girl: 12 * 12 = 144
// AoT Special: 1 * 61 = 61
// Bleach: 10 * 23.5 = 235
// Spirited Away (Plan to Watch): 0
// Total: 107 + 144 + 61 + 235 = 547 mins
assert.strictEqual(totalMins, 547, "Total minutes must match sum of all custom runtimes");
assert.strictEqual(moviesCount, 1, "Exactly 1 movie counted");
assert.strictEqual(seriesEpsCount, 23, "12 (Aho) + 1 (AoT) + 10 (Bleach) = 23 episodes");
console.log("✓ CategoryStats anime loop calculates accurate time across all formats!");

console.log("\n✓ ALL VERIFICATION TESTS PASSED!");
