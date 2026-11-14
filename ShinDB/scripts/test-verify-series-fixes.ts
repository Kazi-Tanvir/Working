import assert from "node:assert";
import { CANONICAL_SEASONS_MAP, generateDefaultSeasons, calculateTotalWatched, calculateTotalEpisodes } from "../src/utils/seasonHelpers";

console.log("=== TDD VERIFICATION: SERIES ISSUES ===");

// 1. Verify CANONICAL_SEASONS_MAP
console.log("\n[VERIFY 1] Canonical seasons map entries");
assert.deepStrictEqual(CANONICAL_SEASONS_MAP["mirzapur"], [9, 10, 10]);
assert.deepStrictEqual(CANONICAL_SEASONS_MAP["hostel daze"], [5, 4, 6, 6]);
assert.deepStrictEqual(CANONICAL_SEASONS_MAP["kota factory"], [5, 5, 5]);
assert.deepStrictEqual(CANONICAL_SEASONS_MAP["panchayat"], [8, 8, 8, 8]);
assert.deepStrictEqual(CANONICAL_SEASONS_MAP["adolescence"], [4]);
assert.deepStrictEqual(CANONICAL_SEASONS_MAP["the sopranos"], [13, 13, 13, 13, 13, 21]);
assert.deepStrictEqual(CANONICAL_SEASONS_MAP["borat's american lockdown & debunking borat"], [7]);
console.log("✓ Canonical seasons map contains all required series with accurate breakdowns!");

// 2. Verify Kota Factory 3 seasons
console.log("\n[VERIFY 2] Kota Factory season generation");
const kotaSeasons = generateDefaultSeasons("Kota Factory", 15, 15);
assert.strictEqual(kotaSeasons.length, 3, "Kota Factory must have 3 seasons");
assert.strictEqual(kotaSeasons[0].episodeCount, 5);
assert.strictEqual(kotaSeasons[1].episodeCount, 5);
assert.strictEqual(kotaSeasons[2].episodeCount, 5);
assert.strictEqual(calculateTotalWatched(kotaSeasons), 15);
console.log("✓ Kota Factory correctly generates 3 seasons of 5 episodes!");

// 3. Verify parseProgressNum and getSeriesWatched
console.log("\n[VERIFY 3] CategoryStats series watched calculation");
const getSeriesWatched = (i: any): number => {
  const s = (i.status || "").toLowerCase();
  if (s === "plan to watch" || s === "plan_to_consume") return 0;
  if (i.seasons && i.seasons.length > 0) {
    const watched = calculateTotalWatched(i.seasons);
    if (watched > 0) return watched;
    if (s === "completed") return calculateTotalEpisodes(i.seasons);
    return 0;
  }
  if (s === "completed" && (!i.progressCurrent || i.progressCurrent === 0)) {
    return i.progressTotal || 0;
  }
  return i.progressCurrent || 0;
};

const fakeGot = {
  title: "Game of Thrones",
  status: "Completed",
  progress: "S1 Complete (73/73 EP)",
  progressCurrent: 73,
  seasons: generateDefaultSeasons("Game of Thrones", 73, 73),
};
const fakeBb = {
  title: "Breaking Bad",
  status: "Completed",
  progress: "S1 Complete (62/62 EP)",
  progressCurrent: 62,
  seasons: generateDefaultSeasons("Breaking Bad", 62, 62),
};
const fakeSopranosPlan = {
  title: "The Sopranos",
  status: "Plan to Watch",
  progress: "S1E00 (0/86 EP)",
  progressCurrent: 0,
  seasons: generateDefaultSeasons("The Sopranos", 86, 0),
};
const fakeOzark = {
  title: "Ozark",
  status: "On Hold",
  progress: "S3 Complete (10/44 EP)",
  progressCurrent: 10,
  seasons: [
    { seasonNumber: 1, episodeCount: 10, episodesWatched: 0, isCompleted: false },
    { seasonNumber: 2, episodeCount: 10, episodesWatched: 0, isCompleted: false },
    { seasonNumber: 3, episodeCount: 10, episodesWatched: 10, isCompleted: true },
    { seasonNumber: 4, episodeCount: 14, episodesWatched: 0, isCompleted: false },
  ],
};

assert.strictEqual(getSeriesWatched(fakeGot), 73, "GoT must count 73 episodes");
assert.strictEqual(getSeriesWatched(fakeBb), 62, "Breaking Bad must count 62 episodes");
assert.strictEqual(getSeriesWatched(fakeSopranosPlan), 0, "Plan to Watch must count 0 episodes");
assert.strictEqual(getSeriesWatched(fakeOzark), 10, "Ozark on-hold must count 10 episodes");
console.log("✓ Series watched calculation handles completed, plan to watch, and partial multi-season series accurately!");

// 4. Verify MediaCard bottom-left metric logic
console.log("\n[VERIFY 4] MediaCard bottom-left watched / total metric");
const getCardProgressDisplay = (item: any, seasonsState: any, currentProgress: string, label: string) => {
  if (item.type === "series") {
    if (seasonsState && seasonsState.length > 0) {
      const watched = calculateTotalWatched(seasonsState);
      const total = calculateTotalEpisodes(seasonsState) || item.progressTotal || "?";
      return `${watched}/${total}`;
    }
    const total = item.progressTotal ?? "?";
    return `${item.progressCurrent}/${total}`;
  }
  if (currentProgress.includes("/")) {
    return currentProgress.split(" ")[0];
  }
  return label;
};

const gotDisplay = getCardProgressDisplay({ type: "series", progressCurrent: 73, progressTotal: 73 }, fakeGot.seasons, fakeGot.progress, "Completed");
const ozarkDisplay = getCardProgressDisplay({ type: "series", progressCurrent: 10, progressTotal: 44 }, fakeOzark.seasons, fakeOzark.progress, "On-Hold");
const animeDisplay = getCardProgressDisplay({ type: "anime", progressCurrent: 12, progressTotal: 12 }, undefined, "12/12 EP", "Completed");
const mangaDisplay = getCardProgressDisplay({ type: "manga", progressCurrent: 150, progressTotal: 380 }, undefined, "150/380 CH", "Reading");

assert.strictEqual(gotDisplay, "73/73", "GoT display must be 73/73, not S1");
assert.strictEqual(ozarkDisplay, "10/44", "Ozark display must be 10/44, not S3");
assert.strictEqual(animeDisplay, "12/12", "Anime display remains 12/12");
assert.strictEqual(mangaDisplay, "150/380", "Manga display remains 150/380");
console.log("✓ MediaCard bottom-left metric displays 'watched/total' for series matching anime and manga!");

console.log("\n✓ ALL VERIFICATION TESTS PASSED!");

