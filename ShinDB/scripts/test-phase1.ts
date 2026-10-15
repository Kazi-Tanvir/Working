// scripts/test-phase1.ts
/**
 * ShinDB — Phase 1 Comprehensive Automated Test Suite
 * 
 * Tests:
 * 1. Unit Tests for seasonHelpers (season generation, episode calculations, progress formatting, rating mapping)
 * 2. API Integration Tests (GET, POST, PUT, DELETE /api/track, /api/search, /api/track/sync)
 * 3. Error handling & constraint verification (duplicates, 400s, 404s)
 */

import {
  generateDefaultSeasons,
  calculateTotalWatched,
  calculateTotalEpisodes,
  getActiveSeasonNumber,
  formatStructuredProgress,
  getCanonicalExternalRating,
  syncSeasonsWithTotalWatched,
  SeasonData,
} from "../src/utils/seasonHelpers";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => void | Promise<void>) {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round(performance.now() - start);
    results.push({ suite, name, passed: true, durationMs });
    console.log(`  \x1b[32m✔\x1b[0m [${suite}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - start);
    const errorMsg = err?.message || String(err);
    results.push({ suite, name, passed: false, durationMs, error: errorMsg });
    console.error(`  \x1b[31m✖\x1b[0m [${suite}] ${name} (${durationMs}ms)`);
    console.error(`    \x1b[31mError:\x1b[0m ${errorMsg}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed for ${message}: expected "${expected}", received "${actual}"`);
  }
}

// ==========================================
// 1. UNIT TESTS: seasonHelpers
// ==========================================
async function runUnitTests() {
  console.log("\n\x1b[1m\x1b[36m=== SUITE 1: UNIT TESTS (seasonHelpers & Logic) ===\x1b[0m");

  await runTest("seasonHelpers", "generateDefaultSeasons: canonical multi-season TV series (The Witcher)", () => {
    const seasons = generateDefaultSeasons("The Witcher", 32, 16);
    assert(seasons.length === 4, `Expected 4 seasons, got ${seasons.length}`);
    assertEqual(seasons[0].episodeCount, 8, "Season 1 episode count");
    assertEqual(seasons[1].episodeCount, 8, "Season 2 episode count");
    assertEqual(seasons[0].episodesWatched, 8, "Season 1 watched (full)");
    assertEqual(seasons[1].episodesWatched, 8, "Season 2 watched (full)");
    assert(seasons[0].isCompleted === true, "Season 1 completed");
    assert(seasons[1].isCompleted === true, "Season 2 completed");
    assertEqual(seasons[2].episodesWatched, 0, "Season 3 watched (0)");
  });

  await runTest("seasonHelpers", "generateDefaultSeasons: non-canonical single season anime", () => {
    const seasons = generateDefaultSeasons("A Custom New Anime", 12, 6);
    assert(seasons.length === 1, `Expected 1 season, got ${seasons.length}`);
    assertEqual(seasons[0].episodeCount, 12, "Season 1 episode count");
    assertEqual(seasons[0].episodesWatched, 6, "Season 1 watched");
    assert(seasons[0].isCompleted === false, "Season 1 not completed");
  });

  await runTest("seasonHelpers", "calculateTotalWatched & calculateTotalEpisodes", () => {
    const mockSeasons: SeasonData[] = [
      { seasonNumber: 1, episodeCount: 12, episodesWatched: 12, isCompleted: true },
      { seasonNumber: 2, episodeCount: 13, episodesWatched: 7, isCompleted: false },
      { seasonNumber: 3, episodeCount: 12, episodesWatched: 0, isCompleted: false },
    ];
    assertEqual(calculateTotalWatched(mockSeasons), 19, "Total watched calculation");
    assertEqual(calculateTotalEpisodes(mockSeasons), 37, "Total episodes calculation");
  });

  await runTest("seasonHelpers", "getActiveSeasonNumber: auto-detection and overrides", () => {
    const mockSeasons: SeasonData[] = [
      { seasonNumber: 1, episodeCount: 10, episodesWatched: 10, isCompleted: true },
      { seasonNumber: 2, episodeCount: 10, episodesWatched: 4, isCompleted: false },
      { seasonNumber: 3, episodeCount: 10, episodesWatched: 0, isCompleted: false },
    ];
    assertEqual(getActiveSeasonNumber(mockSeasons), 2, "Active season is Season 2 (first incomplete)");
    assertEqual(getActiveSeasonNumber(mockSeasons, 1), 1, "Explicit override selects Season 1");

    const allDoneSeasons: SeasonData[] = [
      { seasonNumber: 1, episodeCount: 10, episodesWatched: 10, isCompleted: true },
      { seasonNumber: 2, episodeCount: 10, episodesWatched: 10, isCompleted: true },
    ];
    assertEqual(getActiveSeasonNumber(allDoneSeasons), 2, "Caps at last season when all completed");
  });

  await runTest("seasonHelpers", "syncSeasonsWithTotalWatched", () => {
    const baseSeasons: SeasonData[] = [
      { seasonNumber: 1, episodeCount: 10, episodesWatched: 0, isCompleted: false },
      { seasonNumber: 2, episodeCount: 10, episodesWatched: 0, isCompleted: false },
    ];
    const synced = syncSeasonsWithTotalWatched(baseSeasons, 14);
    assertEqual(synced[0].episodesWatched, 10, "S1 watched 10");
    assert(synced[0].isCompleted === true, "S1 completed");
    assertEqual(synced[1].episodesWatched, 4, "S2 watched 4");
    assert(synced[1].isCompleted === false, "S2 in progress");
  });

  await runTest("seasonHelpers", "formatStructuredProgress: multi-season anime/series", () => {
    const mockSeasons: SeasonData[] = [
      { seasonNumber: 1, episodeCount: 12, episodesWatched: 12, isCompleted: true },
      { seasonNumber: 2, episodeCount: 12, episodesWatched: 4, isCompleted: false },
    ];
    const formatted = formatStructuredProgress(mockSeasons, 2, 16, 24, "EP");
    assertEqual(formatted, "S2E04 (16/24 EP)", "Formatted multi-season progress");
  });

  await runTest("seasonHelpers", "formatStructuredProgress: games (hrs) and manga (ch)", () => {
    const gameFormatted = formatStructuredProgress(null, 1, 55, 100, "hrs");
    assertEqual(gameFormatted, "55/100 HRS", "Game progress formatted in hours");

    const mangaFormatted = formatStructuredProgress(null, 1, 120, null, "ch");
    assertEqual(mangaFormatted, "120/? CH", "Manga progress with unknown total chapters");
  });

  await runTest("seasonHelpers", "getCanonicalExternalRating: known titles vs unknown", () => {
    assertEqual(getCanonicalExternalRating("Breaking Bad"), 9.5, "Breaking Bad rating is 9.5");
    assertEqual(getCanonicalExternalRating("Dark"), 8.7, "Dark rating is 8.7");
    assertEqual(getCanonicalExternalRating("Death Note"), 8.7, "Death Note rating is 8.7");
    assertEqual(getCanonicalExternalRating("Completely Unknown Indie Show 9999"), null, "Unknown title returns null");
  });
}

// ==========================================
// 2. INTEGRATION TESTS: Live REST Endpoints
// ==========================================
async function runIntegrationTests() {
  console.log("\n\x1b[1m\x1b[36m=== SUITE 2: REST API INTEGRATION TESTS (ShinDB Server) ===\x1b[0m");

  const testTitle = `__PHASE1_TEST_${Date.now()}__`;
  let createdEntryId = "";

  // 1. GET /api/track - Full list
  await runTest("api/track", "GET /api/track returns 200 with media items array", async () => {
    const res = await fetch(`${BASE_URL}/api/track`);
    assertEqual(res.status, 200, "HTTP Status 200");
    const json = await res.json();
    assert(json.success === true, "Response success flag is true");
    assert(Array.isArray(json.items), "Response items is an array");
    assert(json.items.length > 0, "Database contains seeded/tracked items");

    // Verify item schema shape
    const first = json.items[0];
    assert(typeof first.id === "string", "Item id is string");
    assert(typeof first.title === "string", "Item title is string");
    assert(typeof first.type === "string", "Item type is string");
    assert(typeof first.status === "string", "Item status is string");
    assert(typeof first.progress === "string", "Item progress is formatted string");
  });

  // 2. GET /api/track with type filters
  await runTest("api/track", "GET /api/track?type=anime filters correctly", async () => {
    const res = await fetch(`${BASE_URL}/api/track?type=anime`);
    assertEqual(res.status, 200, "HTTP Status 200");
    const json = await res.json();
    assert(json.success === true, "Response success");
    assert(json.items.every((it: any) => it.type === "anime"), "All items are anime");
  });

  await runTest("api/track", "GET /api/track?type=game filters correctly", async () => {
    const res = await fetch(`${BASE_URL}/api/track?type=game`);
    assertEqual(res.status, 200, "HTTP Status 200");
    const json = await res.json();
    assert(json.success === true, "Response success");
    assert(json.items.every((it: any) => it.type === "game"), "All items are game");
  });

  // 3. GET /api/track invalid type returns 400
  await runTest("api/track", "GET /api/track?type=invalid_type returns 400 Bad Request", async () => {
    const res = await fetch(`${BASE_URL}/api/track?type=invalid_type`);
    assertEqual(res.status, 400, "HTTP Status 400");
    const json = await res.json();
    assert(json.success === false, "Response success is false");
    assert(json.error.includes("Invalid type parameter"), "Error message specifies invalid type");
  });

  // 4. POST /api/track - Create new entry
  await runTest("api/track", "POST /api/track creates a new tracking entry", async () => {
    const payload = {
      title: testTitle,
      type: "anime",
      status: "watching",
      progress: "S1: 4/12",
      rating: "8.5",
      releaseYear: 2026,
      genres: ["Action", "Sci-Fi", "Cyberpunk"],
    };

    const res = await fetch(`${BASE_URL}/api/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assertEqual(res.status, 200, "HTTP Status 200 on creation");
    const json = await res.json();
    assert(json.success === true, "Creation successful");
    assert(Boolean(json.entry?.id), "Created entry has an id");
    assertEqual(json.entry.title, testTitle, "Title matches test title");
    assertEqual(json.entry.type, "anime", "Type matches anime");
    assertEqual(json.entry.rating, "8.5/10", "Rating is formatted as 8.5/10");
    createdEntryId = json.entry.id;
  });

  // 5. POST /api/track - Duplicate rejection (409 Conflict)
  await runTest("api/track", "POST /api/track rejects duplicate title+type with 409 Conflict", async () => {
    const payload = {
      title: testTitle,
      type: "anime",
      status: "plan_to_consume",
    };

    const res = await fetch(`${BASE_URL}/api/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assertEqual(res.status, 409, "HTTP Status 409 on duplicate");
    const json = await res.json();
    assert(json.success === false, "Success is false on duplicate");
    assert(json.error.includes("already exists"), "Error message mentions already exists");
  });

  // 6. PUT /api/track - Update progress, rating, status, notes
  await runTest("api/track", "PUT /api/track updates progress, status, rating, and notes", async () => {
    assert(Boolean(createdEntryId), "createdEntryId must exist for PUT test");

    const updatePayload = {
      id: createdEntryId,
      progressCurrent: 12,
      progress: "12/12",
      status: "completed",
      rating: "9.5",
      notes: "Phase 1 automated verification test passed successfully.",
      isFavorite: true,
      seasons: [
        { seasonNumber: 1, title: "Season 1", episodeCount: 12, episodesWatched: 12, isCompleted: true },
      ],
    };

    const res = await fetch(`${BASE_URL}/api/track`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload),
    });

    assertEqual(res.status, 200, "HTTP Status 200 on update");
    const json = await res.json();
    assert(json.success === true, "Update successful");
    assertEqual(json.entry.status, "Completed", "Status converted to Completed");
    assertEqual(json.entry.rating, "9.5/10", "Rating updated to 9.5/10");
    assert(json.entry.isFavorite === true, "isFavorite is true");
  });

  // 7. POST /api/track/sync - Sync single and batch
  await runTest("api/track/sync", "POST /api/track/sync checks batch synchronization", async () => {
    const res = await fetch(`${BASE_URL}/api/track/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "anime" }),
    });

    assertEqual(res.status, 200, "HTTP Status 200 on sync");
    const json = await res.json();
    assert(json.success === true, "Sync route success");
    assert(typeof json.checkedCount === "number", "Checked count returned");
    assert(typeof json.updatedCount === "number", "Updated count returned");
  });

  // 8. GET /api/search - Multi-provider search discovery
  await runTest("api/search", "GET /api/search with query returns normalized search results", async () => {
    const res = await fetch(`${BASE_URL}/api/search?q=Steins&type=anime`);
    assertEqual(res.status, 200, "HTTP Status 200 on search");
    const json = await res.json();
    assert(json.success === true, "Search success flag");
    assert(Array.isArray(json.results), "Results is array");
    assert(json.results.length > 0, "Returns search results for Steins");
    
    const firstResult = json.results[0];
    assert(Boolean(firstResult.title), "Result has title");
    assert(Boolean(firstResult.type), "Result has type");
    assert(Boolean(firstResult.coverImage), "Result has coverImage");
  });

  await runTest("api/search", "GET /api/search with empty query returns empty results array", async () => {
    const res = await fetch(`${BASE_URL}/api/search?q=&type=all`);
    assertEqual(res.status, 200, "HTTP Status 200");
    const json = await res.json();
    assert(json.success === true, "Search success flag");
    assertEqual(json.results.length, 0, "Empty query returns 0 results");
  });

  // 9. DELETE /api/track - Clean up test entry
  await runTest("api/track", "DELETE /api/track deletes the created entry", async () => {
    assert(Boolean(createdEntryId), "createdEntryId must exist for DELETE test");

    const res = await fetch(`${BASE_URL}/api/track?id=${createdEntryId}`, {
      method: "DELETE",
    });

    assertEqual(res.status, 200, "HTTP Status 200 on delete");
    const json = await res.json();
    assert(json.success === true, "Deletion successful");
  });

  // 10. DELETE non-existent item returns 404
  await runTest("api/track", "DELETE /api/track non-existent item returns 404", async () => {
    const res = await fetch(`${BASE_URL}/api/track?id=non_existent_id_999999`, {
      method: "DELETE",
    });

    assertEqual(res.status, 404, "HTTP Status 404 on non-existent delete");
    const json = await res.json();
    assert(json.success === false, "Success is false");
    assert(json.error.includes("not found"), "Error specifies not found");
  });
}

// ==========================================
// MAIN RUNNER
// ==========================================
async function main() {
  console.log("\x1b[1m\x1b[35m=====================================================");
  console.log("   SHINDB — PHASE 1 AUTOMATED VERIFICATION SUITE    ");
  console.log("=====================================================\x1b[0m");

  const suiteStart = performance.now();

  try {
    await runUnitTests();
    await runIntegrationTests();
  } catch (err) {
    console.error("\x1b[31mFatal error during test run:\x1b[0m", err);
  }

  const totalDuration = Math.round(performance.now() - suiteStart);
  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;

  console.log("\n\x1b[1m\x1b[35m=====================================================");
  console.log("                  TEST SUMMARY                      ");
  console.log("=====================================================\x1b[0m");
  console.log(`  Total Tests  : ${results.length}`);
  console.log(`  Passed       : \x1b[32m${totalPassed}\x1b[0m`);
  console.log(`  Failed       : ${totalFailed > 0 ? `\x1b[31m${totalFailed}\x1b[0m` : `\x1b[32m0\x1b[0m`}`);
  console.log(`  Total Time   : ${totalDuration}ms`);
  console.log("=====================================================\n");

  if (totalFailed > 0) {
    console.error("\x1b[31mPhase 1 test suite failed. Review errors above.\x1b[0m");
    process.exit(1);
  } else {
    console.log("\x1b[32m✔ All Phase 1 test suites PASSED with 100% success rate!\x1b[0m\n");
    process.exit(0);
  }
}

main();
