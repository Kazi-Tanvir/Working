/**
 * ShinDB — Phase 2 Multi-User Isolation & Scoping Test
 * Verifies that two users have isolated libraries, independent CRUD, and cannot mutate each other's data
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

async function runIsolationTests() {
  console.log("\n=======================================================");
  console.log("   SHINDB PHASE 2: MULTI-USER ISOLATION TEST SUITE    ");
  console.log("=======================================================\n");

  const userAData = {
    username: `pilot_a_${Date.now()}`,
    email: `pilot_a_${Date.now()}@shindb.test`,
    password: "Password123!",
    displayName: "Pilot Alpha",
  };

  const userBData = {
    username: `pilot_b_${Date.now()}`,
    email: `pilot_b_${Date.now()}@shindb.test`,
    password: "Password123!",
    displayName: "Pilot Bravo",
  };

  let tokenA = "";
  let tokenB = "";
  let itemAId = "";
  let itemBId = "";

  try {
    // 1. Register User A & User B
    console.log("▶ [STEP 1] Provisioning Users A and B");
    const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userAData),
    });
    const regA = await regARes.json();
    tokenA = regA.token;
    assert(regARes.status === 201, "User A registered successfully");

    const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userBData),
    });
    const regB = await regBRes.json();
    tokenB = regB.token;
    assert(regBRes.status === 201, "User B registered successfully");

    // 2. User A adds a custom game
    console.log("\n▶ [STEP 2] User A Library Insertion");
    const createARes = await fetch(`${BASE_URL}/api/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: "Armored Core VI: Fires of Rubicon",
        type: "game",
        status: "playing",
        rating: 9.5,
        progress: "45 hrs",
      }),
    });
    const createA = await createARes.json();
    itemAId = createA.entry.id;
    assert(createARes.status === 200, "User A successfully tracked Armored Core VI");

    // 3. User B queries collection: should NOT see User A's Armored Core VI
    console.log("\n▶ [STEP 3] User B Data Isolation Verification");
    const getBRes = await fetch(`${BASE_URL}/api/track?type=game`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const getB = await getBRes.json();
    const hasItemA = getB.items.some((i: any) => i.id === itemAId);
    assert(!hasItemA, "User B library does NOT contain User A's item (Strict Isolation)");

    // 4. User B tracks the SAME title (Armored Core VI): Should succeed without conflict!
    console.log("\n▶ [STEP 4] Multi-Tenant Uniqueness Verification");
    const createBRes = await fetch(`${BASE_URL}/api/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        title: "Armored Core VI: Fires of Rubicon",
        type: "game",
        status: "plan_to_consume",
        rating: 8.0,
      }),
    });
    const createB = await createBRes.json();
    itemBId = createB.entry.id;
    assert(createBRes.status === 200, "User B can independently track the same media title");
    assert(itemAId !== itemBId, "User A and User B have separate entry records");

    // 5. Cross-User Mutation Guard (User B tries to edit User A's item)
    console.log("\n▶ [STEP 5] Cross-User Authorization Guard");
    const hackRes = await fetch(`${BASE_URL}/api/track`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        id: itemAId,
        rating: 1.0,
      }),
    });
    assert(
      hackRes.status === 403 || hackRes.status === 404,
      `User B editing User A item is prevented by isolation guard (Got ${hackRes.status})`
    );

    // 6. Cross-User Deletion Guard (User B tries to delete User A's item)
    const deleteHackRes = await fetch(`${BASE_URL}/api/track?id=${itemAId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      deleteHackRes.status === 403 || deleteHackRes.status === 404,
      `User B deleting User A item is prevented by isolation guard (Got ${deleteHackRes.status})`
    );

    // 7. Cleanup
    console.log("\n▶ [STEP 7] Cleanup & Final Verification");
    await prisma.userMediaEntry.deleteMany({
      where: { id: { in: [itemAId, itemBId] } },
    });
    await prisma.user.deleteMany({
      where: { username: { in: [userAData.username, userBData.username] } },
    });
    console.log("  ✅ Cleaned up temporary test entities");

    console.log("\n=======================================================");
    console.log(`   TEST RESULTS: ${passedCount} PASSED / ${failedCount} FAILED   `);
    console.log("=======================================================\n");
  } catch (error) {
    console.error("Isolation test failed:", error);
    await prisma.user.deleteMany({
      where: { username: { in: [userAData.username, userBData.username] } },
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runIsolationTests();
