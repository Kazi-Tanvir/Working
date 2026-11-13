// scripts/test-search-api-source.ts
import assert from "node:assert";
import dns from "node:dns";
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}
import { searchMedia } from "../src/utils/apiHelpers";

async function runTests() {
  console.log("=== Testing Search API Source Verification ===");

  // Test 1: Anime search returns items from AniList with apiSource
  console.log("\n[Test 1] Anime search (Steins)...");
  const animeResults = await searchMedia("Steins", "anime");
  assert(animeResults.length > 0, "Steins search should return results");
  for (const item of animeResults) {
    assert.strictEqual(item.type, "anime", "Type must be anime");
    assert.strictEqual(item.apiSource, "AniList", "Anime item apiSource must be AniList");
    assert(Boolean(item.coverImage && item.coverImage.length > 0), "Must have coverImage");
  }
  console.log(`Passed: ${animeResults.length} items from AniList with valid apiSource.`);

  // Test 2: Search for 'Yani Neko' - must NOT return fake unverified DB entry
  console.log("\n[Test 2] Yani Neko search (verifying fake DB entry cmvc40u6w00ixulk06r3upzxz is excluded)...");
  const yaniResults = await searchMedia("Yani Neko", "all");
  assert(yaniResults.length > 0, "Yani Neko should return results from official APIs");
  for (const item of yaniResults) {
    assert(item.id !== "cmvc40u6w00ixulk06r3upzxz", "Must NOT return the unverified legacy DB row");
    assert(Boolean(item.apiSource), `Result ${item.title} must have an apiSource`);
    assert(["AniList", "TMDB", "RAWG", "Jikan"].includes(item.apiSource), `apiSource must be official API (was ${item.apiSource})`);
    assert(Boolean(item.coverImage && item.coverImage.length > 0), `Cover image must not be empty for ${item.title}`);
  }
  console.log(`Passed: Fake DB entry excluded; all ${yaniResults.length} items verified from APIs.`);

  // Test 3: Movie search returns items with TMDB source
  console.log("\n[Test 3] Movie search (Inception)...");
  const movieResults = await searchMedia("Inception", "movie");
  assert(movieResults.length > 0, "Inception search should return results");
  for (const item of movieResults) {
    assert.strictEqual(item.type, "movie", "Type must be movie");
    assert.strictEqual(item.apiSource, "TMDB", "Movie item apiSource must be TMDB");
    assert(Boolean(item.coverImage && item.coverImage.length > 0), "Must have coverImage");
  }
  console.log(`Passed: ${movieResults.length} movie items verified from TMDB.`);

  console.log("\n=== ALL SEARCH API SOURCE TESTS PASSED ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

