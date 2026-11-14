import { prisma } from "../src/lib/prisma";
import { CANONICAL_SEASONS_MAP, calculateTotalEpisodes } from "../src/utils/seasonHelpers";

async function fixSeriesData() {
  console.log("=== FIXING SERIES MEDIA CATALOG & USER ENTRIES ===");

  const seriesMediaList = await prisma.media.findMany({
    where: { type: "series" },
    include: { userEntries: true },
  });

  console.log(`Found ${seriesMediaList.length} series in catalog.`);

  for (const media of seriesMediaList) {
    const cleanTitle = media.title.toLowerCase().trim();
    let pattern: number[] | undefined;

    // Look for matching pattern in CANONICAL_SEASONS_MAP
    for (const key of Object.keys(CANONICAL_SEASONS_MAP)) {
      if (cleanTitle === key || cleanTitle.includes(key) || key.includes(cleanTitle)) {
        pattern = CANONICAL_SEASONS_MAP[key];
        break;
      }
    }

    if (!pattern && media.totalEpisodes && media.totalEpisodes > 0) {
      if (media.totalEpisodes <= 16) {
        pattern = [media.totalEpisodes];
      }
    }

    if (!pattern) {
      console.log(`No canonical pattern for '${media.title}', skipping.`);
      continue;
    }

    const totalEps = pattern.reduce((sum, count) => sum + count, 0);
    const defaultSeasons = pattern.map((eps, idx) => ({
      seasonNumber: idx + 1,
      title: `Season ${idx + 1}`,
      episodeCount: eps,
      episodesWatched: 0,
      isCompleted: false,
    }));

    // 1. Update Media record with accurate totalEpisodes and defaultSeasons
    await prisma.media.update({
      where: { id: media.id },
      data: {
        totalEpisodes: totalEps,
        defaultSeasons,
      },
    });
    console.log(`✓ Updated media '${media.title}': ${pattern.length} season(s), ${totalEps} total eps`);

    // 2. Update user entries for this media
    for (const entry of media.userEntries) {
      if (entry.status === "completed") {
        const completedSeasons = pattern.map((eps, idx) => ({
          seasonNumber: idx + 1,
          title: `Season ${idx + 1}`,
          episodeCount: eps,
          episodesWatched: eps,
          isCompleted: true,
        }));

        await prisma.userMediaEntry.update({
          where: { id: entry.id },
          data: {
            progressCurrent: totalEps,
            seasons: completedSeasons,
          },
        });
        console.log(`  ✓ Updated completed entry for user '${entry.userId}': progressCurrent = ${totalEps}`);
      } else if (entry.status === "plan_to_consume") {
        await prisma.userMediaEntry.update({
          where: { id: entry.id },
          data: {
            progressCurrent: 0,
            seasons: defaultSeasons,
          },
        });
        console.log(`  ✓ Updated plan_to_consume entry for user '${entry.userId}': progressCurrent = 0`);
      } else {
        // Active/dropped/on-hold: distribute existing watched count across valid season sizes
        let remaining = entry.progressCurrent;
        const syncedSeasons = pattern.map((eps, idx) => {
          const watched = Math.min(eps, Math.max(0, remaining));
          remaining -= watched;
          return {
            seasonNumber: idx + 1,
            title: `Season ${idx + 1}`,
            episodeCount: eps,
            episodesWatched: watched,
            isCompleted: watched >= eps && eps > 0,
          };
        });

        await prisma.userMediaEntry.update({
          where: { id: entry.id },
          data: {
            seasons: syncedSeasons,
          },
        });
        console.log(`  ✓ Synced partial entry for user '${entry.userId}'`);
      }
    }
  }

  console.log("\n✓ Database update complete!");
}

fixSeriesData()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

