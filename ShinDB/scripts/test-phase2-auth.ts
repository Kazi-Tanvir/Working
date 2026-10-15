/**
 * ShinDB — Phase 2 Authentication Automated Test Suite
 * Validates Registration, Login, Token Issuance, Token Refresh, Password Changes, and OAuth
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

async function cleanupTestUser(username: string) {
  try {
    await prisma.userMediaEntry.deleteMany({
      where: { user: { username } },
    });
    await prisma.user.deleteMany({
      where: { username },
    });
  } catch (err) {
    // ignore
  }
}

async function runAuthTests() {
  console.log("\n=======================================================");
  console.log("   SHINDB PHASE 2: AUTHENTICATION ENGINE TEST SUITE   ");
  console.log("=======================================================\n");

  const testUser = {
    username: `test_pilot_${Date.now().toString().slice(-5)}`,
    email: `pilot_${Date.now().toString().slice(-5)}@shindb.test`,
    password: "securePassword123!",
    displayName: "Test Pilot Shin",
  };

  try {
    // ----------------------------------------------------
    // 1. REGISTRATION TESTS
    // ----------------------------------------------------
    console.log("▶ [TEST GROUP 1] User Registration");

    // 1.1 Valid Registration
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, `Valid registration returns HTTP 201 (Got ${regRes.status})`);
    assert(regData.user.username === testUser.username, "Returned user has matching username");
    assert(!!regData.token, "Returned payload includes access token");

    // 1.2 Duplicate Username Registration
    const dupUserRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUser.username,
        email: `different_${Date.now()}@test.com`,
        password: "anotherPassword123",
      }),
    });
    assert(dupUserRes.status === 409, `Duplicate username returns HTTP 409 Conflict (Got ${dupUserRes.status})`);

    // 1.3 Duplicate Email Registration
    const dupEmailRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: `unique_${Date.now().toString().slice(-4)}`,
        email: testUser.email,
        password: "anotherPassword123",
      }),
    });
    assert(dupEmailRes.status === 409, `Duplicate email returns HTTP 409 Conflict (Got ${dupEmailRes.status})`);

    // 1.4 Invalid Validation (Short password & invalid email)
    const invalidRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "ab",
        email: "not-an-email",
        password: "123",
      }),
    });
    assert(invalidRes.status === 400, `Invalid fields return HTTP 400 Bad Request (Got ${invalidRes.status})`);

    // ----------------------------------------------------
    // 2. LOGIN TESTS
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 2] User Login");

    // 2.1 Login via Username
    const loginUserRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: testUser.username,
        password: testUser.password,
      }),
    });
    const loginUserData = await loginUserRes.json();
    assert(loginUserRes.status === 200, `Login with username returns HTTP 200 (Got ${loginUserRes.status})`);
    assert(!!loginUserData.token, "Login returns valid JWT access token");

    const authToken = loginUserData.token;

    // 2.2 Login via Email
    const loginEmailRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: testUser.email,
        password: testUser.password,
      }),
    });
    assert(loginEmailRes.status === 200, `Login with email returns HTTP 200 (Got ${loginEmailRes.status})`);

    // 2.3 Wrong Password
    const wrongPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: testUser.username,
        password: "wrong_password_xyz",
      }),
    });
    assert(wrongPassRes.status === 401, `Wrong password returns HTTP 401 Unauthorized (Got ${wrongPassRes.status})`);

    // 2.4 Non-existent User
    const nonUserRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: "phantom_user_does_not_exist_404",
        password: "somePassword123",
      }),
    });
    assert(nonUserRes.status === 401, `Non-existent user returns HTTP 401 Unauthorized (Got ${nonUserRes.status})`);

    // ----------------------------------------------------
    // 3. PROFILE / SESSION RESOLUTION (`/api/auth/me`)
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 3] Session & Profile Resolution");

    // 3.1 Unauthenticated Request
    const unauthMe = await fetch(`${BASE_URL}/api/auth/me`);
    assert(unauthMe.status === 401, `Unauthenticated /api/auth/me returns HTTP 401 (Got ${unauthMe.status})`);

    // 3.2 Authenticated Request via Bearer Token
    const authMe = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const authMeData = await authMe.json();
    assert(authMe.status === 200, `Authenticated /api/auth/me returns HTTP 200 (Got ${authMe.status})`);
    assert(authMeData.user.username === testUser.username, "Profile returns matching username");
    assert(authMeData.user.email === testUser.email, "Profile returns matching email");

    // ----------------------------------------------------
    // 4. PASSWORD CHANGE (`/api/auth/password`)
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 4] Password Mutation");

    // 4.1 Wrong Current Password
    const wrongCurrentRes = await fetch(`${BASE_URL}/api/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        currentPassword: "incorrectPassword!",
        newPassword: "BrandNewPassword2026!",
      }),
    });
    assert(wrongCurrentRes.status === 403, `Wrong current password returns HTTP 403 Forbidden (Got ${wrongCurrentRes.status})`);

    // 4.2 Successful Password Change
    const changePassRes = await fetch(`${BASE_URL}/api/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        currentPassword: testUser.password,
        newPassword: "BrandNewPassword2026!",
      }),
    });
    assert(changePassRes.status === 200, `Valid password change returns HTTP 200 OK (Got ${changePassRes.status})`);

    // 4.3 Verify New Password works for Login
    const reLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: testUser.username,
        password: "BrandNewPassword2026!",
      }),
    });
    assert(reLoginRes.status === 200, `Login with new password succeeds with HTTP 200 (Got ${reLoginRes.status})`);

    // ----------------------------------------------------
    // 5. OAUTH FLOWS (Google & Discord)
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 5] OAuth Identity Integrations");

    // 5.1 Google OAuth Login
    const googleRes = await fetch(`${BASE_URL}/api/auth/login/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `google_${Date.now()}@shindb.io`,
        name: "Asuka Langley",
        providerId: `g_${Date.now()}`,
      }),
    });
    const googleData = await googleRes.json();
    assert(googleRes.status === 200, `Google OAuth returns HTTP 200 (Got ${googleRes.status})`);
    assert(googleData.user.authProvider === "google", "User registered with authProvider 'google'");
    assert(!!googleData.token, "Google OAuth returns valid session token");

    // 5.2 Discord OAuth Login
    const discordRes = await fetch(`${BASE_URL}/api/auth/login/discord`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `discord_${Date.now()}@shindb.io`,
        name: "Misato Katsuragi",
        providerId: `d_${Date.now()}`,
      }),
    });
    const discordData = await discordRes.json();
    assert(discordRes.status === 200, `Discord OAuth returns HTTP 200 (Got ${discordRes.status})`);
    assert(discordData.user.authProvider === "discord", "User registered with authProvider 'discord'");
    assert(!!discordData.token, "Discord OAuth returns valid session token");

    // ----------------------------------------------------
    // 6. LOGOUT
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 6] Logout and Cookie Invalidation");

    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(logoutRes.status === 200, `Logout returns HTTP 200 OK (Got ${logoutRes.status})`);

    // Clean up test user
    await cleanupTestUser(testUser.username);
    if (googleData?.user?.username) await cleanupTestUser(googleData.user.username);
    if (discordData?.user?.username) await cleanupTestUser(discordData.user.username);

    console.log("\n=======================================================");
    console.log(`   TEST RESULTS: ${passedCount} PASSED / ${failedCount} FAILED   `);
    console.log("=======================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed:", error);
    await cleanupTestUser(testUser.username);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAuthTests();
