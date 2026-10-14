// scripts/migrateSeasons.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CANONICAL_SEASONS_MAP = {
  "the witcher": [8, 8, 8, 8],
  "peaky blinders": [6, 6, 6, 6, 6, 6],
  "sherlock": [3, 3, 3, 3],
  "narcos": [10, 10, 10],
  "breaking bad": [7, 13, 13, 13, 16],
  "invincible": [8, 8, 8],
  "ozark": [10, 10, 10, 14],
  "game of thrones": [10, 10, 10, 10, 10, 10, 7, 6],
  "dark": [10, 8, 8],
  "stranger things": [8, 9, 8, 9],
  "the boys": [8, 8, 8, 8, 8],
  "better call saul": [10, 10, 10, 10, 10, 13],
  "house of the dragon": [10, 8, 8],
  "shogun": [10],
  "gen v": [8, 8],
  "hannibal": [13, 13, 13],
  "adolescence": [4],
  "a knight of the seven kingdoms": [6],
  "hostel daze": [5, 4, 6, 6],
  "kota factory": [5, 5, 5],
  "mirzapur": [9, 10, 10],
  "panchayat": [8, 8, 8, 8],

  // Anime
  "dan da dan": [12, 12, 12],
  "jujutsu kaisen": [24, 23],
  "demon slayer: kimetsu no yaiba": [26, 7, 11, 11, 8],
  "attack on titan": [25, 12, 22, 28],
  "haikyu!!": [25, 25, 10, 25],
  "kaguya-sama: love is war": [12, 12, 13],
  "bocchi the rock!": [12, 12],
  "delicious in dungeon": [24, 12],
  "chainsaw man": [12, 12],
  "bleach: thousand-year blood war": [13, 13, 10]
};

const CANONICAL_EXTERNAL_RATINGS = {
  "the witcher": 7.9,
  "peaky blinders": 8.8,
  "sherlock": 8.9,
  "breaking bad": 9.5,
  "better call saul": 9.0,
  "game of thrones": 9.2,
  "dark": 8.7,
  "stranger things": 8.7,
  "the boys": 8.7,
  "narcos": 8.8,
  "ozark": 8.5,
  "invincible": 8.7,
  "house of the dragon": 8.4,
  "shogun": 8.7,
  "hannibal": 8.5,
  "death note": 8.7,
  "fullmetal alchemist: brotherhood": 9.1,
  "hunter x hunter": 9.0,
  "attack on titan": 9.1,
  "jujutsu kaisen": 8.5,
  "demon slayer: kimetsu no yaiba": 8.6,
  "frieren: beyond journey's end": 9.1,
  "bleach": 8.2,
  "one piece": 9.0,
  "dan da dan": 8.4,
  "bocchi the rock!": 8.7,
  "delicious in dungeon": 8.4,
  "chainsaw man": 8.4,
  "vinland saga": 8.8,
  "haikyu!!": 8.7,
  "kaguya-sama: love is war": 8.7
};

function getCanonicalRating(title) {
  const clean = title.toLowerCase().trim();
  for (const [k, r] of Object.entries(CANONICAL_EXTERNAL_RATINGS)) {
    if (clean.includes(k) || k.includes(clean)) return r;
  }
  return null;
}

function getCanonicalSeasons(title, currWatched, total) {
  const clean = title.toLowerCase().trim();
  let pattern = null;

  for (const [k, pat] of Object.entries(CANONICAL_SEASONS_MAP)) {
    if (clean.includes(k) || k.includes(clean)) {
      pattern = pat;
      break;
    }
  }

  if (!pattern && total && total > 0) {
    if (total <= 16) {
      pattern = [total];
    } else {
      const size = total <= 26 ? 12 : 10;
      const count = Math.ceil(total / size);
      pattern = [];
      let rem = total;
      for (let i = 0; i < count; i++) {
        const ep = i === count - 1 ? rem : size;
        pattern.push(ep);
        rem -= ep;
      }
    }
  }

  if (!pattern) {
    pattern = [12];
  }

  let remaining = currWatched;
  const seasons = pattern.map((eps, idx) => {
    const sNum = idx + 1;
    const watched = Math.min(eps, Math.max(0, remaining));
    remaining -= watched;
    return {
      seasonNumber: sNum,
      title: `Season ${sNum}`,
      episodeCount: eps,
      episodesWatched: watched,
      isCompleted: watched >= eps && eps > 0
    };
  });

  return seasons;
}

async function main() {
  const allEntries = await prisma.mediaEntry.findMany();
  console.log(`Analyzing ${allEntries.length} total entries in database...`);

  let updatedCount = 0;
  for (const entry of allEntries) {
    const updates = {};
    const extRating = getCanonicalRating(entry.title);
    if (extRating && entry.externalRating !== extRating) {
      updates.externalRating = extRating;
    }

    if (entry.title.toLowerCase().includes("house of the dragon")) {
      const hotdSeasons = [
        { seasonNumber: 1, title: "Season 1", episodeCount: 10, episodesWatched: 10, isCompleted: true },
        { seasonNumber: 2, title: "Season 2", episodeCount: 8, episodesWatched: 8, isCompleted: true },
        { seasonNumber: 3, title: "Season 3", episodeCount: 8, episodesWatched: 0, isCompleted: false },
      ];
      updates.seasons = hotdSeasons;
      updates.currentSeason = 3;
      updates.progressCurrent = 18;
      updates.progressTotal = 26;
      updates.status = "watching";
    } else if (entry.type === "series" || (entry.type === "anime" && CANONICAL_SEASONS_MAP[entry.title.toLowerCase().trim()])) {
      const seasons = getCanonicalSeasons(entry.title, entry.progressCurrent, entry.progressTotal);
      const totalEpisodes = seasons.reduce((sum, s) => sum + s.episodeCount, 0);
      const totalWatched = seasons.reduce((sum, s) => sum + s.episodesWatched, 0);

      // Determine active season (first incomplete, or last)
      const firstIncomplete = seasons.find(s => !s.isCompleted);
      const activeSeasonNum = firstIncomplete ? firstIncomplete.seasonNumber : seasons.length || 1;

      updates.seasons = seasons;
      updates.currentSeason = activeSeasonNum;
      updates.progressTotal = totalEpisodes;
      updates.progressCurrent = totalWatched;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.mediaEntry.update({
        where: { id: entry.id },
        data: updates
      });
      updatedCount++;
      console.log(`Updated "${entry.title}":`, {
        currentSeason: updates.currentSeason,
        seasonsCount: updates.seasons?.length,
        progress: `${updates.progressCurrent}/${updates.progressTotal}`,
        externalRating: updates.externalRating
      });
    }
  }

  console.log(`Migration complete! Updated ${updatedCount} entries.`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error("Migration error:", e);
  process.exit(1);
});
