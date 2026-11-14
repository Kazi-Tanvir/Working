import assert from "node:assert";

console.log("=== TDD REPRODUCTION: ANIME DURATION & STATS BUGS ===");

// Simulating current CategoryStats calculation logic
function currentCategoryStatsAnimeCalc(animeList: any[]) {
  const parseProgressNum = (p: string) => {
    const parentheticalMatch = (p || "").match(/\((\d+)\/\d+\s*(?:Total|EP)\)/i);
    if (parentheticalMatch) return parseInt(parentheticalMatch[1], 10) || 0;
    const se = (p || "").match(/S(\d+)E(\d+)/i);
    if (se) return (parseInt(se[1], 10) - 1) * 10 + parseInt(se[2], 10);
    return parseInt((p || "").split("/")[0], 10) || 0;
  };

  let animeSeriesEps = 0;
  let animeMovieMins = 0;
  let completedAnimeMovies = 0;

  for (const item of animeList) {
    const isMovie = item.progressUnit === "mins" || item.progress.toLowerCase().includes("min");
    const num = parseProgressNum(item.progress);
    if (isMovie) {
      animeMovieMins += num;
      if (item.status.toLowerCase() === "completed" || num > 0) {
        completedAnimeMovies += 1;
      }
    } else {
      animeSeriesEps += num;
    }
  }

  const totalAnimeMinutes = (animeSeriesEps * 23) + animeMovieMins;
  return {
    totalAnimeMinutes,
    animeSeriesEps,
    animeMovieMins,
    completedAnimeMovies,
  };
}

// BUG 1: Anime Movie (e.g. Your Name., Spirited Away)
console.log("\n[TEST 1] Anime Movie calculation (Your Name., 107 mins)");
const movieItem = {
  title: "Your Name.",
  status: "Completed",
  progress: "1/1 EP",
  progressUnit: "ep",
  progressCurrent: 1,
  progressTotal: 1,
  genres: ["Drama", "Romance", "Supernatural"],
};
const res1 = currentCategoryStatsAnimeCalc([movieItem]);
console.log("Calculated minutes for 'Your Name.':", res1.totalAnimeMinutes, "mins (Expected: ~107 mins)");
console.log("Is counted as movie:", res1.completedAnimeMovies === 1);
assert.strictEqual(res1.totalAnimeMinutes, 23, "Demonstrates bug: Movie is counted as 23 minutes instead of ~107 minutes!");
assert.strictEqual(res1.completedAnimeMovies, 0, "Demonstrates bug: Anime movie is not counted as completedAnimeMovies!");

// BUG 2: Anime Short (e.g. Aho Girl: 12 episodes x 12 mins = 144 mins)
console.log("\n[TEST 2] Short anime calculation (AHO-GIRL, 12 eps x 12 mins = 144 mins)");
const shortItem = {
  title: "AHO-GIRL",
  status: "Completed",
  progress: "12/12 EP",
  progressUnit: "ep",
  progressCurrent: 12,
  progressTotal: 12,
  genres: ["Comedy", "Romance"],
};
const res2 = currentCategoryStatsAnimeCalc([shortItem]);
console.log("Calculated minutes for 'AHO-GIRL':", res2.totalAnimeMinutes, "mins (Expected: 144 mins)");
assert.strictEqual(res2.totalAnimeMinutes, 12 * 23, "Demonstrates bug: 12-min short is inflated to 23 mins per episode!");

// BUG 3: Anime Special / Long Episode (e.g. Attack on Titan Special 1: 61 mins)
console.log("\n[TEST 3] Long Special calculation (Attack on Titan Special 1: 61 mins)");
const specialItem = {
  title: "Attack on Titan Final Season THE FINAL CHAPTERS Special 1",
  status: "Completed",
  progress: "1/1 EP",
  progressUnit: "ep",
  progressCurrent: 1,
  progressTotal: 1,
  genres: ["Action", "Drama", "Fantasy"],
};
const res3 = currentCategoryStatsAnimeCalc([specialItem]);
console.log("Calculated minutes for Special:", res3.totalAnimeMinutes, "mins (Expected: 61 mins)");
assert.strictEqual(res3.totalAnimeMinutes, 23, "Demonstrates bug: 61-min special is counted as only 23 minutes!");

console.log("\n✓ All 3 reproduction tests confirmed the bugs!");
