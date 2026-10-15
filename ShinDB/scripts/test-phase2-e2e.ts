/**
 * ShinDB — Phase 2 End-to-End User Lifecycle & Session Flow Test
 * Validates complete journey: Visitor -> Registration -> Session -> Scoped CRUD -> Logout -> Re-login
 */

import { prisma } from "../src/lib/prisma";

const BASE_URL = "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runE2ETests() {
  console.log("\n=======================================================");
  console.log("   SHINDB PHASE 2: E2E USER LIFECYCLE TEST SUITE       ");
  console.log("=======================================================\n");

  const testUser = {
    username: `e2e_pilot_${Date.now().toString().slice(-5)}`,
    email: `e2e_${Date.now().toString().slice(-5)}@shindb.io`,
    password: "CyberneticPass2026!",
    displayName: "E2E Unit Shin",
  };

  let sessionCookie = "";
  let trackedItemId = "";

  try {
    // ----------------------------------------------------
    // STEP 1: Unauthenticated Visitor on Home Landing Page
    // ----------------------------------------------------
    console.log("▶ [STEP 1] Visitor Views Landing Page");
    const landingRes = await fetch(`${BASE_URL}/`, {
      headers: { "Accept": "text/html" },
    });
    assert(landingRes.status === 200, "Landing page responds with HTTP 200");
    const landingHtml = await landingRes.text();
    assert(
      landingHtml.includes("UNIFIED MEDIA ARCHIVE") || landingHtml.includes("ShinDB"),
      "Landing page renders Cyber-Neobrutalist branding"
    );

    // ----------------------------------------------------
    // STEP 2: User Registration & Session Cookie Issuance
    // ----------------------------------------------------
    console.log("\n▶ [STEP 2] User Registration & Cookie Issuance");
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    assert(regRes.status === 201, "Registration succeeds with HTTP 201");

    // Extract cookies
    const rawCookies = regRes.headers.get("set-cookie") || "";
    assert(rawCookies.includes("shindb_access_token"), "Access token cookie was set");
    assert(rawCookies.includes("shindb_refresh_token"), "Refresh token cookie was set");

    // Parse session cookie
    const accessCookieMatch = rawCookies.match(/shindb_access_token=([^;]+)/);
    sessionCookie = accessCookieMatch ? accessCookieMatch[0] : "";
    assert(!!sessionCookie, "Session cookie parsed successfully");

    // ----------------------------------------------------
    // STEP 3: Verify Session Profile (`/api/auth/me`)
    // ----------------------------------------------------
    console.log("\n▶ [STEP 3] Authenticated Session Verification");
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    assert(meRes.status === 200, "Session cookie successfully authenticates /api/auth/me");
    const meData = await meRes.json();
    assert(meData.user.username === testUser.username, "Profile returns matching username");

    // ----------------------------------------------------
    // STEP 4: Scoped Media Addition
    // ----------------------------------------------------
    console.log("\n▶ [STEP 4] User-Scoped Library Addition");
    const trackRes = await fetch(`${BASE_URL}/api/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        title: "Neon Genesis Evangelion",
        type: "anime",
        status: "watching",
        rating: 10.0,
        progress: "18/26 EP",
      }),
    });
    assert(trackRes.status === 200, "User successfully added media entry");
    const trackData = await trackRes.json();
    trackedItemId = trackData.entry.id;
    assert(!!trackedItemId, "Returned entry has valid CUID ID");

    // ----------------------------------------------------
    // STEP 5: Verify Scoped Query Returns User's Item
    // ----------------------------------------------------
    console.log("\n▶ [STEP 5] Scoped Query Verification");
    const listRes = await fetch(`${BASE_URL}/api/track?type=anime`, {
      headers: { Cookie: sessionCookie },
    });
    assert(listRes.status === 200, "Fetch anime collection succeeds with HTTP 200");
    const listData = await listRes.json();
    const found = listData.items.find((i: any) => i.id === trackedItemId);
    assert(!!found, "Tracked item is present in user's personal library");
    assert(found.title === "Neon Genesis Evangelion", "Item has correct title");

    // ----------------------------------------------------
    // STEP 6: Media Mutation / Progress Update
    // ----------------------------------------------------
    console.log("\n▶ [STEP 6] Scoped Media Mutation");
    const updateRes = await fetch(`${BASE_URL}/api/track`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        id: trackedItemId,
        progress: "26/26 EP",
        status: "completed",
        rating: 10.0,
      }),
    });
    assert(updateRes.status === 200, "Media update succeeds with HTTP 200");
    const updateData = await updateRes.json();
    assert(updateData.entry.status === "Completed", "Status successfully updated to Completed");
    assert(updateData.entry.progressCurrent === 26, "Current progress updated to 26");

    // ----------------------------------------------------
    // STEP 7: Logout & Cookie Cleared
    // ----------------------------------------------------
    console.log("\n▶ [STEP 7] User Logout");
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    assert(logoutRes.status === 200, "Logout succeeds with HTTP 200");

    // ----------------------------------------------------
    // STEP 8: Re-login with Credentials & Persistence Check
    // ----------------------------------------------------
    console.log("\n▶ [STEP 8] Re-Authentication & Data Persistence");
    const reLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: testUser.username,
        password: testUser.password,
      }),
    });
    assert(reLoginRes.status === 200, "Re-login succeeds with HTTP 200");
    const reLoginData = await reLoginRes.json();
    assert(reLoginData.user.username === testUser.username, "Re-login returns correct user profile");

    const newCookies = reLoginRes.headers.get("set-cookie") || "";
    const newAccessCookieMatch = newCookies.match(/shindb_access_token=([^;]+)/);
    const newSessionCookie = newAccessCookieMatch ? newAccessCookieMatch[0] : "";

    // Verify item still exists in re-logged-in session
    const verifyListRes = await fetch(`${BASE_URL}/api/track?type=anime`, {
      headers: { Cookie: newSessionCookie },
    });
    const verifyListData = await verifyListRes.json();
    const persistedItem = verifyListData.items.find((i: any) => i.id === trackedItemId);
    assert(!!persistedItem, "Personal media entry persisted across logout and re-login");
    assert(persistedItem.status === "Completed", "Item state maintained accurately");

    // ----------------------------------------------------
    // STEP 9: Cleanup
    // ----------------------------------------------------
    console.log("\n▶ [STEP 9] Cleanup Temporary Test User");
    await prisma.userMediaEntry.deleteMany({
      where: { id: trackedItemId },
    });
    await prisma.user.deleteMany({
      where: { username: testUser.username },
    });
    console.log("  ✅ Cleaned up temporary test user and entries");

    console.log("\n=======================================================");
    console.log(`   E2E RESULTS: ${passedCount} PASSED / ${failedCount} FAILED   `);
    console.log("=======================================================\n");
  } catch (error) {
    console.error("E2E Test failed:", error);
    if (trackedItemId) {
      await prisma.userMediaEntry.deleteMany({ where: { id: trackedItemId } }).catch(() => {});
    }
    await prisma.user.deleteMany({ where: { username: testUser.username } }).catch(() => {});
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runE2ETests();
