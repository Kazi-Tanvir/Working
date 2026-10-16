/**
 * ShinDB — Phase 5 Production Deployment & Launch Smoke Test Suite
 * Validates:
 * 1. Health check & database connectivity (/api/health)
 * 2. Registration gating (ALLOW_REGISTRATION=false vs true)
 * 3. Authentication & JWT session persistence
 * 4. Scoped Tracker CRUD lifecycle & multi-season tracking
 * 5. Social, Profile & Media Data Export (/api/media/export)
 * 6. Production configuration & standalone artifacts
 */

import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passedCount++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
    failedCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function cleanupUser(username: string) {
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      await prisma.friendship.deleteMany({
        where: {
          OR: [{ requesterId: user.id }, { addresseeId: user.id }],
        },
      });
      await prisma.userMediaEntry.deleteMany({
        where: { userId: user.id },
      });
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  } catch (err) {
    // ignore
  }
}

async function runSmokeTests() {
  console.log("\n==================================================================");
  console.log("   SHINDB PHASE 5: PRODUCTION DEPLOYMENT & LAUNCH SMOKE TESTS     ");
  console.log("==================================================================\n");

  const ts = Date.now().toString().slice(-6);
  const smokeUser = {
    username: `smoke_op_${ts}`,
    email: `smoke_op_${ts}@shindb.prod`,
    password: "SecurePassword123!",
    displayName: "Smoke Test Commander",
  };

  let token = "";
  let createdEntryId = "";

  try {
    // ----------------------------------------------------
    // TEST GROUP 1: HEALTH MONITORING & DB LATENCY
    // ----------------------------------------------------
    console.log("▶ [TEST GROUP 1] Health Check & Database Telemetry");

    const healthRes = await fetch(`${BASE_URL}/api/health`);
    assert(healthRes.status === 200, "Health check endpoint returns HTTP 200 OK");

    const healthData = await healthRes.json();
    assert(healthData.status === "ok", "System status reports 'ok'");
    assert(healthData.service === "shindb", "Service identifier is 'shindb'");
    assert(healthData.version === "1.0.0", "System version reports '1.0.0'");
    assert(healthData.database?.status === "healthy", "Prisma MySQL database connection is 'healthy'");
    assert(typeof healthData.database?.latencyMs === "number", `DB latency recorded: ${healthData.database?.latencyMs}ms`);
    assert(typeof healthData.uptime === "number", `Uptime recorded: ${healthData.uptime}s`);
    assert(typeof healthData.registrationOpen === "boolean", `Registration status reported: ${healthData.registrationOpen}`);

    // ----------------------------------------------------
    // TEST GROUP 2: REGISTRATION GATING (ALLOW_REGISTRATION)
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 2] Registration Access Control & Gating");

    // 2.1 Test registration when disabled (invite-only)
    const disabledRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-allow-registration": "false",
      },
      body: JSON.stringify(smokeUser),
    });
    assert(disabledRegRes.status === 403, "Gated registration returns HTTP 403 Forbidden when disabled");
    const disabledRegData = await disabledRegRes.json();
    assert(disabledRegData.error === "REGISTRATION_DISABLED", "Error code matches 'REGISTRATION_DISABLED'");

    // 2.2 Test registration when enabled
    const enabledRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-allow-registration": "true",
      },
      body: JSON.stringify(smokeUser),
    });
    assert(enabledRegRes.status === 201, "Registration succeeds with HTTP 201 Created when enabled");
    const enabledRegData = await enabledRegRes.json();
    token = enabledRegData.token;
    assert(!!token, "Operator received valid JWT access token");
    assert(enabledRegData.user?.username === smokeUser.username, "Registered operator username matches");

    // ----------------------------------------------------
    // TEST GROUP 3: AUTHENTICATION & SESSION PERSISTENCE
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 3] Authentication & Session Lifecycle");

    // 3.1 Login with credentials
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: smokeUser.username,
        password: smokeUser.password,
      }),
    });
    assert(loginRes.status === 200, "Login returns HTTP 200 OK");
    const loginData = await loginRes.json();
    assert(!!loginData.token, "Login returns refreshed JWT token");

    // 3.2 Verify session identity (/api/auth/me)
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(meRes.status === 200, "GET /api/auth/me returns HTTP 200 OK");
    const meData = await meRes.json();
    assert(meData.user?.username === smokeUser.username, "Identity matches authenticated operator");

    // ----------------------------------------------------
    // TEST GROUP 4: END-TO-END TRACKER CRUD & DISCOVERY
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 4] Scoped Media Tracker CRUD & Catalog Flow");

    // 4.1 Search external catalog
    const searchRes = await fetch(`${BASE_URL}/api/search?q=Naruto&type=anime`);
    assert(searchRes.status === 200, "Search query /api/search returns HTTP 200 OK");
    const searchData = await searchRes.json();
    assert(Array.isArray(searchData.results), "Search returns array of normalized results");
    assert(searchData.results.length > 0, "Search returns matching catalog items");

    // 4.2 Add new media entry
    const createRes = await fetch(`${BASE_URL}/api/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: `Smoke Test Media ${ts}`,
        type: "anime",
        status: "WATCHING",
        progressCurrent: 3,
        progressTotal: 12,
        progressUnit: "episodes",
        rating: 9,
        releaseYear: 2026,
        genres: ["Action", "Sci-Fi"],
        notes: "Automated smoke test entry",
        isFavorite: true,
      }),
    });
    assert(createRes.status === 200 || createRes.status === 201, "POST /api/track creates entry with HTTP 200/201 OK");
    const createData = await createRes.json();
    createdEntryId = createData.entry?.id;
    assert(!!createdEntryId, "Entry created with valid UUID");
    assert(createData.entry?.progressCurrent === 3, "Initial progress saved accurately");

    // 4.3 Retrieve tracked list
    const listRes = await fetch(`${BASE_URL}/api/track?type=anime`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(listRes.status === 200, "GET /api/track returns HTTP 200 OK");
    const listData = await listRes.json();
    const items = listData.items || listData.entries || [];
    const found = items.some((e: any) => e.id === createdEntryId);
    assert(found, "Newly tracked entry present in user collection");

    // 4.4 Update progress and rating
    const updateRes = await fetch(`${BASE_URL}/api/track`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: createdEntryId,
        progressCurrent: 12,
        status: "COMPLETED",
        rating: 10,
        notes: "Completed in smoke test",
      }),
    });
    assert(updateRes.status === 200, "PUT /api/track updates progress with HTTP 200 OK");
    const updateData = await updateRes.json();
    assert(updateData.entry?.status?.toLowerCase() === "completed", "Status transitioned to COMPLETED");
    assert(updateData.entry?.progressCurrent === 12, "Progress incremented to 12");

    // 4.5 External sync sanity check
    const syncRes = await fetch(`${BASE_URL}/api/track/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: createdEntryId }),
    });
    assert(syncRes.status === 200, "POST /api/track/sync responds with HTTP 200 OK");

    // 4.6 Delete tracked entry
    const deleteRes = await fetch(`${BASE_URL}/api/track?id=${createdEntryId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(deleteRes.status === 200, "DELETE /api/track returns HTTP 200 OK");

    // Verify deletion
    const verifyListRes = await fetch(`${BASE_URL}/api/track?type=anime`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifyListData = await verifyListRes.json();
    const remainingItems = verifyListData.items || verifyListData.entries || [];
    const stillExists = remainingItems.some((e: any) => e.id === createdEntryId);
    assert(!stillExists, "Deleted entry confirmed removed from user collection");

    // ----------------------------------------------------
    // TEST GROUP 5: SOCIAL, PROFILE & DATA EXPORT SMOKE
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 5] Operator Profile, Friends Hub & Data Export");

    // 5.1 Profile endpoint
    const profileRes = await fetch(`${BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(profileRes.status === 200, "GET /api/users/profile returns HTTP 200 OK");
    const profileData = await profileRes.json();
    assert(profileData.user?.username === smokeUser.username, "Profile data matches active operator");

    // 5.2 Friends endpoints
    const friendsRes = await fetch(`${BASE_URL}/api/users/friends`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(friendsRes.status === 200, "GET /api/users/friends returns HTTP 200 OK");

    const requestsRes = await fetch(`${BASE_URL}/api/users/friends/requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(requestsRes.status === 200, "GET /api/users/friends/requests returns HTTP 200 OK");

    // 5.3 Data Export archive
    const exportRes = await fetch(`${BASE_URL}/api/media/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(exportRes.status === 200, "GET /api/media/export returns HTTP 200 OK");
    const exportData = await exportRes.json();
    assert(exportData.version === "1.0.0", "Export archive version is '1.0.0'");
    assert(exportData.user?.username === smokeUser.username, "Export archive includes user profile");
    assert(Array.isArray(exportData.library), "Export archive includes media entries array");

    // ----------------------------------------------------
    // TEST GROUP 6: PRODUCTION ARTIFACT INTEGRITY
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 6] Standalone & Production Build Artifacts");

    const dockerfileExists = fs.existsSync(path.resolve(process.cwd(), "Dockerfile"));
    assert(dockerfileExists, "Production Dockerfile exists in workspace root");

    const dockerComposeExists = fs.existsSync(path.resolve(process.cwd(), "docker-compose.prod.yml"));
    assert(dockerComposeExists, "Production docker-compose.prod.yml exists");

    const envProdExists = fs.existsSync(path.resolve(process.cwd(), ".env.production.example"));
    assert(envProdExists, ".env.production.example configuration template exists");

    const deploymentDocExists = fs.existsSync(path.resolve(process.cwd(), "docs/Deployment.md"));
    assert(deploymentDocExists, "docs/Deployment.md guide exists");

    const launchGuideExists = fs.existsSync(path.resolve(process.cwd(), "docs/LaunchGuide.md"));
    assert(launchGuideExists, "docs/LaunchGuide.md runbook exists");

    console.log("\n==================================================================");
    console.log(`   ALL ${passedCount} PHASE 5 SMOKE TESTS PASSED (100% SUCCESS)`);
    console.log("   SYSTEM STATUS: PRODUCTION READY // V1.0.0 STABLE               ");
    console.log("==================================================================\n");

  } finally {
    // Cleanup smoke test operator
    await cleanupUser(smokeUser.username);
  }
}

runSmokeTests().catch((err) => {
  console.error("\n💥 SMOKE TEST FAILED:", err);
  process.exit(1);
});
