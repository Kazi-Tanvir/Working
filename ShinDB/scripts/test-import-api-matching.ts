import { resolveTitle, findOrCreateMedia } from "../src/lib/import";
import { cleanTitleForComparison } from "../src/lib/import";
import assert from "node:assert";

async function runTests() {
  console.log("--- RUNNING IMPORT & API MATCHING TESTS ---");

  // 1. Title comparison cleaner
  console.log("1. Testing title comparison cleaner...");
  assert.strictEqual(cleanTitleForComparison("Attack on Titan: Final"), "attack on titan final");
  assert.strictEqual(cleanTitleForComparison("Steins;Gate"), "steinsgate");
  assert.strictEqual(cleanTitleForComparison("進撃の巨人"), "進撃の巨人");
  console.log("✓ cleanTitleForComparison works");

  // 2. Anime multi-language title search (English -> Romaji -> Japanese)
  console.log("2. Testing anime title search fallback...");
  const enMatch = await resolveTitle("Attack on Titan", "anime");
  assert.strictEqual(enMatch.matched, true, "English title should match");

  const romajiMatch = await resolveTitle("Shingeki no Kyojin", "anime");
  assert.strictEqual(romajiMatch.matched, true, "Romaji title should match");

  const jaMatch = await resolveTitle("進撃の巨人", "anime");
  assert.strictEqual(jaMatch.matched, true, "Japanese title should match");
  console.log("✓ Anime English/Romaji/Japanese fallback matches");

  // 3. Multi-source extraction (Game -> RAWG, Series -> TMDB, Anime -> AniList)
  console.log("3. Testing multi-source extraction...");
  const gameMatch = await resolveTitle("The Witcher 3: Wild Hunt", "game");
  assert.strictEqual(gameMatch.matched, true, "Game should match from RAWG");
  assert.strictEqual(gameMatch.externalSource, "rawg", "Game source should be RAWG");

  const seriesMatch = await resolveTitle("Stranger Things", "series");
  assert.strictEqual(seriesMatch.matched, true, "Series should match from TMDB");
  assert.strictEqual(seriesMatch.externalSource, "tmdb", "Series source should be TMDB");
  console.log("✓ Multi-source extraction works");

  // 4. Failed match on unmatchable title (MUST NOT match or create custom entry)
  console.log("4. Testing unmatchable titles return matched: false...");
  const fakeAnime = await resolveTitle("TotallyFakeAnimeTitleX999Z999", "anime");
  assert.strictEqual(fakeAnime.matched, false, "Fake anime should not match");

  const fakeGame = await resolveTitle("TotallyFakeGameTitleX999Z999", "game");
  assert.strictEqual(fakeGame.matched, false, "Fake game should not match");

  const fakeSeries = await resolveTitle("TotallyFakeSeriesTitleX999Z999", "series");
  assert.strictEqual(fakeSeries.matched, false, "Fake series should not match");
  console.log("✓ Unmatched titles return matched: false");

  console.log("\nALL TESTS PASSED!");
}

runTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});

