/**
 * ShinDB — Phase 3 Social Features Automated Test Suite
 * Validates Profiles, Friend Requests, Friendship Acceptance, Friendship Gating,
 * Search, Data Export, and Friendship Disconnection.
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

async function runPhase3Tests() {
  console.log("\n=======================================================");
  console.log("   SHINDB PHASE 3: SOCIAL FEATURES & FRIENDS TEST SUITE");
  console.log("=======================================================\n");

  const ts = Date.now().toString().slice(-6);
  const userAData = {
    username: `pilot_a_${ts}`,
    email: `pilot_a_${ts}@shindb.test`,
    password: "Password123!",
    displayName: "Commander Alpha",
  };

  const userBData = {
    username: `pilot_b_${ts}`,
    email: `pilot_b_${ts}@shindb.test`,
    password: "Password123!",
    displayName: "Navigator Bravo",
  };

  const userCData = {
    username: `pilot_c_${ts}`,
    email: `pilot_c_${ts}@shindb.test`,
    password: "Password123!",
    displayName: "Infiltrator Charlie",
  };

  let tokenA = "";
  let tokenB = "";
  let tokenC = "";
  let friendshipId = "";

  try {
    // ----------------------------------------------------
    // STEP 1: PROVISION USERS A, B, AND C
    // ----------------------------------------------------
    console.log("▶ [TEST GROUP 1] Provisioning Test Operators");

    const regA = await (
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userAData),
      })
    ).json();
    tokenA = regA.token;
    assert(!!tokenA, "User A registered & received bearer token");

    const regB = await (
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userBData),
      })
    ).json();
    tokenB = regB.token;
    assert(!!tokenB, "User B registered & received bearer token");

    const regC = await (
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userCData),
      })
    ).json();
    tokenC = regC.token;
    assert(!!tokenC, "User C registered & received bearer token");

    // ----------------------------------------------------
    // STEP 2: PROFILE RETRIEVAL & MUTATION (USER A)
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 2] Profile Retrieval & Customization");

    // 2.1 Fetch own profile
    const profileRes = await fetch(`${BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200, "User A can query own profile via GET /api/users/profile");
    assert(profileData.user.username === userAData.username, "Profile username matches");
    assert(profileData.stats.totalEntries === 0, "Initial library count is 0");

    // 2.2 Update profile details
    const updateRes = await fetch(`${BASE_URL}/api/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        displayName: "Supreme Commander Shin",
        bio: "Frontline commander overseeing ShinDB tactical operations.",
        customBadge: "[SYS_OPERATOR::ELITE]",
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, "User A updated profile via PUT /api/users/profile");
    assert(updateData.user.displayName === "Supreme Commander Shin", "Updated displayName matches");
    assert(updateData.user.customBadge === "[SYS_OPERATOR::ELITE]", "Updated customBadge matches");

    // 2.3 Update avatar
    const avatarRes = await fetch(`${BASE_URL}/api/users/profile/avatar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        avatarUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150",
      }),
    });
    const avatarData = await avatarRes.json();
    assert(avatarRes.status === 200, "User A updated avatar via POST /api/users/profile/avatar");
    assert(avatarData.avatarUrl.includes("unsplash"), "Avatar URL preserved");

    // ----------------------------------------------------
    // STEP 3: USER DIRECTORY SEARCH
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 3] Operator Registry Discovery (Search)");

    // 3.1 Search for User B by username
    const searchRes = await fetch(`${BASE_URL}/api/users/search?q=${userBData.username}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const searchData = await searchRes.json();
    assert(searchRes.status === 200, "Search query executed successfully");
    assert(searchData.users.length > 0, "Found User B in search results");
    assert(searchData.users[0].username === userBData.username, "Found correct username");
    assert(searchData.users[0].relationship === "none", "Initial friendship relationship is 'none'");

    // 3.2 Short query
    const shortSearch = await (
      await fetch(`${BASE_URL}/api/users/search?q=x`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      })
    ).json();
    assert(shortSearch.users.length === 0, "Query < 2 characters gracefully returns empty array");

    // ----------------------------------------------------
    // STEP 4: FRIEND REQUEST DISPATCH & VALIDATIONS
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 4] Friend Request Transmission & Validation");

    // 4.1 Self-friending rejected
    const selfReq = await fetch(`${BASE_URL}/api/users/friends/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ username: userAData.username }),
    });
    assert(selfReq.status === 400, "Self-friending rejected with HTTP 400 Bad Request");

    // 4.2 Non-existent user rejected
    const nonExistentReq = await fetch(`${BASE_URL}/api/users/friends/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ username: "ghost_operator_99999" }),
    });
    assert(nonExistentReq.status === 404, "Friending non-existent user rejected with HTTP 404");

    // 4.3 Valid friend request from User A to User B
    const sendReq = await fetch(`${BASE_URL}/api/users/friends/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ username: userBData.username }),
    });
    const sendData = await sendReq.json();
    assert(sendReq.status === 201, "Friend request dispatched with HTTP 201 Created");
    friendshipId = sendData.friendship.id;
    assert(!!friendshipId, "Received friendship identifier");

    // 4.4 Duplicate friend request rejected
    const dupReq = await fetch(`${BASE_URL}/api/users/friends/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ username: userBData.username }),
    });
    assert(dupReq.status === 409, "Duplicate friend request blocked with HTTP 409 Conflict");

    // 4.5 Inspect pending lists
    const pendingARes = await (
      await fetch(`${BASE_URL}/api/users/friends/requests`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      })
    ).json();
    assert(pendingARes.outgoing.length === 1, "User A has 1 outgoing pending request");
    assert(pendingARes.outgoing[0].user.username === userBData.username, "Outgoing addressee is User B");

    const pendingBRes = await (
      await fetch(`${BASE_URL}/api/users/friends/requests`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      })
    ).json();
    assert(pendingBRes.incoming.length === 1, "User B has 1 incoming pending request");
    assert(pendingBRes.incoming[0].user.username === userAData.username, "Incoming requester is User A");
    assert(pendingBRes.pendingCount === 1, "pendingCount is 1 for navbar notification badge");

    // ----------------------------------------------------
    // STEP 5: CLASSIFIED DOSSIER GATING (PRE-ACCEPTANCE)
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 5] Security Gating on Unaccepted Dossiers");

    // User A attempts to view User B's profile before acceptance
    const preAcceptGatingA = await fetch(`${BASE_URL}/api/users/profile/${userBData.username}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      preAcceptGatingA.status === 403,
      "Accessing non-friend dossier returns HTTP 403 Forbidden"
    );
    const preAcceptAData = await preAcceptGatingA.json();
    assert(preAcceptAData.error === "FRIENDSHIP_REQUIRED", "Error code is FRIENDSHIP_REQUIRED");
    assert(preAcceptAData.isFriend === false, "isFriend flag is false");

    // User C (unrelated) attempts to view User B's profile
    const preAcceptGatingC = await fetch(`${BASE_URL}/api/users/profile/${userBData.username}`, {
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    assert(preAcceptGatingC.status === 403, "Unrelated User C blocked with HTTP 403");

    // ----------------------------------------------------
    // STEP 6: FRIEND REQUEST ACCEPTANCE
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 6] Friend Request Acceptance Authorization");

    // 6.1 Unauthorized user (User C) cannot accept User A's request to User B
    const unauthAccept = await fetch(`${BASE_URL}/api/users/friends/${friendshipId}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    assert(unauthAccept.status === 403, "Unauthorized user cannot accept another's friend request (403)");

    // 6.2 User B (the addressee) accepts request
    const acceptRes = await fetch(`${BASE_URL}/api/users/friends/${friendshipId}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(acceptRes.status === 200, "User B accepted friend request with HTTP 200");

    // ----------------------------------------------------
    // STEP 7: POST-ACCEPTANCE MUTUAL NETWORK & DOSSIER ACCESS
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 7] Post-Acceptance Friend Network Verification");

    // 7.1 User A friends list
    const friendsARes = await (
      await fetch(`${BASE_URL}/api/users/friends`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      })
    ).json();
    assert(friendsARes.friends.length === 1, "User A now has 1 friend");
    assert(friendsARes.friends[0].username === userBData.username, "Friend username is User B");

    // 7.2 User B friends list
    const friendsBRes = await (
      await fetch(`${BASE_URL}/api/users/friends`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      })
    ).json();
    assert(friendsBRes.friends.length === 1, "User B now has 1 friend");
    assert(friendsBRes.friends[0].username === userAData.username, "Friend username is User A");

    // 7.3 User B adds an anime to library
    await fetch(`${BASE_URL}/api/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        title: "Cyberpunk: Edgerunners",
        type: "anime",
        status: "completed",
        rating: 10,
        progress: "10/10 ep",
      }),
    });

    // 7.4 User A now accesses User B's dossier: should succeed with library!
    const friendDossierRes = await fetch(`${BASE_URL}/api/users/profile/${userBData.username}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(friendDossierRes.status === 200, "Authorized friend can now view dossier with HTTP 200");
    const friendDossier = await friendDossierRes.json();
    assert(friendDossier.isFriend === true, "isFriend flag is true");
    assert(friendDossier.library.length === 1, "Friend's tracked library entries visible");
    assert(friendDossier.library[0].title === "Cyberpunk: Edgerunners", "Library contains friend's entry");

    // ----------------------------------------------------
    // STEP 8: DATA EXPORT
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 8] Offline Data Archive Export");

    const exportRes = await fetch(`${BASE_URL}/api/media/export`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(exportRes.status === 200, "GET /api/media/export returns HTTP 200");
    const disposition = exportRes.headers.get("content-disposition");
    assert(
      !!disposition && disposition.includes("attachment") && disposition.includes(".json"),
      "Export headers specify attachment download"
    );
    const exportJson = await exportRes.json();
    assert(exportJson.system === "ShinDB", "Export contains ShinDB system identifier");
    assert(exportJson.user.username === userBData.username, "Export metadata matches user");
    assert(exportJson.library.length === 1, "Export contains complete user library");

    // Alias check
    const aliasRes = await fetch(`${BASE_URL}/api/users/export`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(aliasRes.status === 200, "GET /api/users/export alias returns HTTP 200");

    // ----------------------------------------------------
    // STEP 9: PASSWORD CHANGE MUTATION
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 9] Security Cipher Mutation (Password Change)");

    // Incorrect current password
    const wrongPassRes = await fetch(`${BASE_URL}/api/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        currentPassword: "WrongPassword999!",
        newPassword: "BrandNewPassword2026!",
      }),
    });
    assert(wrongPassRes.status === 403, "Wrong current password rejected with HTTP 403");

    // Correct password change
    const goodPassRes = await fetch(`${BASE_URL}/api/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        currentPassword: userAData.password,
        newPassword: "BrandNewPassword2026!",
      }),
    });
    assert(goodPassRes.status === 200, "Valid password mutation succeeds with HTTP 200");

    // Login with new password
    const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: userAData.username,
        password: "BrandNewPassword2026!",
      }),
    });
    assert(newLoginRes.status === 200, "User A successfully logs in with new mutated password");

    // ----------------------------------------------------
    // STEP 10: DISCONNECTION / FRIEND REMOVAL
    // ----------------------------------------------------
    console.log("\n▶ [TEST GROUP 10] Mutual Link Termination (Remove Friend)");

    const deleteRes = await fetch(`${BASE_URL}/api/users/friends/${friendshipId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(deleteRes.status === 200, "Friendship severed with HTTP 200");

    // Friends list check
    const postDeleteFriends = await (
      await fetch(`${BASE_URL}/api/users/friends`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      })
    ).json();
    assert(postDeleteFriends.friends.length === 0, "User A friends network empty after removal");

    // Re-verify gating
    const postDeleteGating = await fetch(`${BASE_URL}/api/users/profile/${userBData.username}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(postDeleteGating.status === 403, "Dossier gating re-asserted (HTTP 403) after disconnection");

    console.log("\n=======================================================");
    console.log(`  🎉 ALL PHASE 3 TESTS COMPLETED: ${passedCount} / ${passedCount + failedCount} PASSED`);
    console.log("=======================================================\n");
  } finally {
    // Cleanup
    await cleanupUser(userAData.username);
    await cleanupUser(userBData.username);
    await cleanupUser(userCData.username);
  }
}

runPhase3Tests().catch((err) => {
  console.error("FATAL ERROR IN PHASE 3 SUITE:", err);
  process.exit(1);
});
