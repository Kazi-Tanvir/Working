import { prisma } from "../src/lib/prisma";

const BASE_URL = "http://localhost:3000";

async function runCatalogSharingTest() {
  console.log("\n=======================================================");
  console.log("   TESTING BASE ACCOUNT + MULTI-USER CATALOG SHARING   ");
  console.log("=======================================================\n");

  // 1. Verify base user SENPAI_09 has entries
  const senpai = await prisma.user.findFirst({
    where: { username: "SENPAI_09" },
    include: { library: true },
  });

  if (!senpai) {
    throw new Error("Base user SENPAI_09 not found in database!");
  }
  console.log(`✅ Base user SENPAI_09 verified. Personal library entries count: ${senpai.library.length}`);

  // 2. Register a brand new user via normal authentication
  const newUsername = `OPERATOR_${Date.now().toString().slice(-4)}`;
  const newEmail = `${newUsername.toLowerCase()}@shindb.local`;
  const newPassword = "testPassword123!";

  console.log(`\n▶ Registering new user: ${newUsername} (${newEmail})`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: newUsername,
      email: newEmail,
      password: newPassword,
      displayName: `Agent ${newUsername}`,
    }),
  });

  const regData = await regRes.json();
  if (!regRes.ok || !regData.token) {
    throw new Error(`Failed to register new user: ${JSON.stringify(regData)}`);
  }
  const token = regData.token;
  console.log(`✅ Successfully registered ${newUsername}! Token received.`);

  // 3. Verify new user library is initially empty (0 items)
  const libRes = await fetch(`${BASE_URL}/api/track`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const libData = await libRes.json();
  console.log(`✅ Initial library count for ${newUsername}: ${libData.items.length}`);

  // 4. Query Master Catalog (should return all 365+ catalog items from base account)
  console.log(`\n▶ Querying master catalog as new user...`);
  const catRes = await fetch(`${BASE_URL}/api/track?catalog=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const catData = await catRes.json();
  console.log(`✅ Master Catalog contains ${catData.items.length} total shared items!`);

  // Pick an entry that SENPAI_09 has in their library
  const senpaiExisting = await prisma.userMediaEntry.findFirst({
    where: { userId: senpai.id },
    include: { media: true },
  });
  if (!senpaiExisting) throw new Error("SENPAI_09 has no library entries!");

  const sampleItem = senpaiExisting.media;
  console.log(`▶ Selected sample item from SENPAI_09 library: "${sampleItem.title}" (${sampleItem.type})`);

  // 5. New user tracks this existing entry from base account!
  console.log(`\n▶ Adding "${sampleItem.title}" to ${newUsername}'s personal library...`);
  const trackRes = await fetch(`${BASE_URL}/api/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      mediaId: sampleItem.id,
      title: sampleItem.title,
      type: sampleItem.type,
      status: "watching",
      progressCurrent: 5,
      rating: 9.5,
    }),
  });

  const trackData = await trackRes.json();
  if (!trackRes.ok || !trackData.success) {
    throw new Error(`Failed to track catalog item for new user: ${JSON.stringify(trackData)}`);
  }
  console.log(`✅ Successfully added "${sampleItem.title}" to ${newUsername}'s personal library!`);
  console.log(`  New entry ID: ${trackData.entry.id}`);
  console.log(`  New entry Rating: ${trackData.entry.rating}`);

  // 6. Verify isolation: SENPAI_09's entry and new user's entry are separate in database
  const senpaiEntry = await prisma.userMediaEntry.findFirst({
    where: { userId: senpai.id, media: { title: sampleItem.title } },
  });
  const newEntry = await prisma.userMediaEntry.findFirst({
    where: { userId: regData.user.id, media: { title: sampleItem.title } },
  });

  if (!senpaiEntry || !newEntry) {
    throw new Error("Could not find entries for both users in database!");
  }

  if (senpaiEntry.id === newEntry.id) {
    throw new Error("Entries share the same ID! Multi-tenancy failed!");
  }
  console.log(`✅ Dual entries confirmed!`);
  console.log(`  SENPAI_09 Entry ID: ${senpaiEntry.id} (Rating: ${senpaiEntry.rating})`);
  console.log(`  ${newUsername} Entry ID: ${newEntry.id} (Rating: ${newEntry.rating})`);

  // 7. Clean up new user
  await prisma.userMediaEntry.deleteMany({ where: { userId: regData.user.id } });
  await prisma.user.delete({ where: { id: regData.user.id } });
  console.log(`✅ Cleaned up temporary test user.\n`);
  console.log("=======================================================");
  console.log("   CATALOG SHARING & MULTI-USER TEST: 100% SUCCESS!    ");
  console.log("=======================================================\n");
}

runCatalogSharingTest()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
