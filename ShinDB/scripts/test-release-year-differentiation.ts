import { resolveTitle, resolveSeriesOrMovieFromTMDB } from "../src/lib/import";
import { searchMedia } from "../src/utils/apiHelpers";
import { prisma } from "../src/lib/prisma";

async function runComprehensiveTests() {
  console.log("=== RUNNING FULL RELEASE YEAR DIFFERENTIATION SUITE ===");
  let failed = 0;

  // 1. Test searchMedia differentiates by releaseYear
  try {
    const results = await searchMedia("one piece", "series");
    const item1999 = results.find((r) => r.releaseYear === "1999");
    const item2023 = results.find((r) => r.releaseYear === "2023");

    console.log("[Test 1: Search] Found 1999 series:", !!item1999, "| Found 2023 series:", !!item2023);
    if (!item1999 || !item2023) {
      console.error("❌ Test 1 FAILED: Search did not return both 1999 and 2023 series");
      failed++;
    } else {
      console.log("✅ Test 1 PASSED: Search returns both series simultaneously");
    }
  } catch (err: any) {
    console.error("❌ Test 1 ERROR:", err.message);
    failed++;
  }

  // 2. Test resolveSeriesOrMovieFromTMDB differentiation
  try {
    const res2023 = await resolveSeriesOrMovieFromTMDB("ONE PIECE", "series", 2023);
    const res1999 = await resolveSeriesOrMovieFromTMDB("ONE PIECE", "series", 1999);

    console.log("[Test 2: TMDB Resolver] 2023 ID:", res2023?.externalId, "Eps:", res2023?.totalEpisodes);
    console.log("[Test 2: TMDB Resolver] 1999 ID:", res1999?.externalId, "Eps:", res1999?.totalEpisodes);

    if (res2023?.externalId !== "111110" || res2023?.releaseYear !== 2023) {
      console.error("❌ Test 2 FAILED on 2023 resolver:", res2023);
      failed++;
    } else if (res1999?.externalId !== "37854" || res1999?.releaseYear !== 1999) {
      console.error("❌ Test 2 FAILED on 1999 resolver:", res1999);
      failed++;
    } else {
      console.log("✅ Test 2 PASSED: TMDB resolver correctly targets 111110 for 2023 and 37854 for 1999");
    }
  } catch (err: any) {
    console.error("❌ Test 2 ERROR:", err.message);
    failed++;
  }

  // 3. Test resolveTitle with releaseYear
  try {
    const titleRes = await resolveTitle("ONE PIECE", "series", undefined, 2023);
    console.log("[Test 3: resolveTitle] 2023 Title:", titleRes?.title, "Year:", titleRes?.releaseYear, "ID:", titleRes?.externalId);

    if (titleRes?.externalId !== "111110" || titleRes?.releaseYear !== 2023) {
      console.error("❌ Test 3 FAILED: Expected 111110 and 2023, got:", titleRes?.externalId, titleRes?.releaseYear);
      failed++;
    } else {
      console.log("✅ Test 3 PASSED: Unified resolveTitle routes to 2023 live action");
    }
  } catch (err: any) {
    console.error("❌ Test 3 ERROR:", err.message);
    failed++;
  }

  // 4. Test database coexistence of same-title, same-type, different releaseYear
  try {
    // 1999 record must already exist in DB
    const existing1999 = await prisma.media.findFirst({
      where: { title: "One Piece", type: "series", releaseYear: 1999 },
    });
    console.log("[Test 4: DB Coexistence] 1999 record ID:", existing1999?.id);

    // Create 2023 record in DB (or verify creation if existing)
    let record2023 = await prisma.media.findFirst({
      where: { title: "ONE PIECE", type: "series", releaseYear: 2023 },
    });

    if (!record2023) {
      record2023 = await prisma.media.create({
        data: {
          title: "ONE PIECE",
          type: "series",
          releaseYear: 2023,
          genres: ["Action", "Adventure"],
          coverImage: "https://image.tmdb.org/t/p/w500/2rmK7mnchw9Xr3XdiTFSxTTvYRI.jpg",
          externalId: "111110",
          externalSource: "tmdb",
          totalEpisodes: 8,
        },
      });
      console.log("[Test 4: DB Coexistence] Successfully created 2023 record ID:", record2023.id);
    } else {
      console.log("[Test 4: DB Coexistence] 2023 record already exists ID:", record2023.id);
    }

    if (!existing1999 || !record2023 || existing1999.id === record2023.id) {
      console.error("❌ Test 4 FAILED: Records could not coexist distinctively in media_catalog");
      failed++;
    } else {
      console.log("✅ Test 4 PASSED: Both 1999 and 2023 series exist concurrently with unique IDs");
    }
  } catch (err: any) {
    console.error("❌ Test 4 ERROR:", err.message);
    failed++;
  }

  await prisma.$disconnect();
  console.log(`\n=== SUITE RESULT: ${failed === 0 ? "100% PASS (ALL 4 TESTS VERIFIED)" : `${failed} FAILED`} ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runComprehensiveTests();
