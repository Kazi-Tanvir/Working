import { prisma } from "../src/lib/prisma";
import dns from "node:dns";
try { dns.setDefaultResultOrder("ipv4first"); } catch {}

async function migratePlaceholders() {
  console.log("=== FIXING DATABASE PLACEHOLDERS & EMPTY COVERS ===");

  // 1. Fix Witcher 3
  const witcher = await prisma.media.findFirst({
    where: { title: "The Witcher 3: Wild Hunt", type: "game" },
  });
  if (witcher) {
    await prisma.media.update({
      where: { id: witcher.id },
      data: { coverImage: "https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg" },
    });
    console.log("✓ Updated 'The Witcher 3: Wild Hunt' cover to real RAWG cover");
  }

  // 2. Fix Old Boy
  const oldBoy = await prisma.media.findFirst({
    where: { title: "Old Boy", type: "movie" },
  });
  if (oldBoy) {
    await prisma.media.update({
      where: { id: oldBoy.id },
      data: {
        coverImage: "https://image.tmdb.org/t/p/w500/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg",
        externalId: "670",
      },
    });
    console.log("✓ Updated 'Old Boy' cover to real TMDB poster (id: 670)");
  }

  // 3. Fix The Pursuit of Happiness
  const pursuit = await prisma.media.findFirst({
    where: { title: "The Pursuit of Happiness", type: "movie" },
  });
  if (pursuit) {
    await prisma.media.update({
      where: { id: pursuit.id },
      data: {
        coverImage: "https://image.tmdb.org/t/p/w500/fDcrbBqfB5nfe7b7Rk8jZl2k04U.jpg",
        externalId: "1402",
      },
    });
    console.log("✓ Updated 'The Pursuit of Happiness' cover to real TMDB poster");
  }

  // 4. Batch fix anime entries with empty coverImage and externalId from MAL
  const emptyAnimes = await prisma.media.findMany({
    where: {
      type: "anime",
      OR: [{ coverImage: "" }, { coverImage: { contains: "unsplash" } }],
      externalId: { not: null },
    },
    select: { id: true, title: true, externalId: true },
  });

  console.log(`Found ${emptyAnimes.length} anime entries to populate covers for.`);
  const malIds = emptyAnimes
    .map(a => Number(a.externalId))
    .filter(id => !isNaN(id) && id > 0);

  if (malIds.length > 0) {
    const query = `
      query ($idMalIn: [Int]) {
        Page(page: 1, perPage: 50) {
          media(idMal_in: $idMalIn, type: ANIME) {
            idMal
            coverImage { large extraLarge }
          }
        }
      }
    `;

    try {
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables: { idMalIn: malIds } }),
      });
      const json = await res.json();
      const mediaList = json.data?.Page?.media || [];

      let updatedCount = 0;
      for (const m of mediaList) {
        if (!m.idMal) continue;
        const cover = m.coverImage?.extraLarge || m.coverImage?.large;
        if (!cover) continue;

        const target = emptyAnimes.find(a => String(a.externalId) === String(m.idMal));
        if (target) {
          await prisma.media.update({
            where: { id: target.id },
            data: { coverImage: cover },
          });
          updatedCount++;
        }
      }
      console.log(`✓ Successfully updated real covers for ${updatedCount} anime entries!`);
    } catch (e: any) {
      console.warn("AniList batch update error:", e.message);
    }
  }

  console.log("\nDATABASE PLACEHOLDER FIX COMPLETE!");
}

migratePlaceholders().catch(console.error).finally(() => prisma.$disconnect());

