import { PrismaClient, MediaType, MediaStatus, ProgressUnit } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { generateDefaultSeasons, getCanonicalExternalRating } from "../src/utils/seasonHelpers";

const prisma = new PrismaClient();

function mapStatus(rawStatus: string, type: MediaType): MediaStatus {
  const s = (rawStatus || "").toLowerCase().trim();
  if (s === "completed") return "completed";
  if (s === "dropped") return "dropped";
  if (s === "on hold" || s === "on-hold") return "on_hold";
  if (s.startsWith("plan")) return "plan_to_consume";
  if (s === "reading" || type === "manga") return "reading";
  if (s === "playing" || type === "game") return "playing";
  return "watching";
}

function parseRating(rawRating: string): number | null {
  if (!rawRating || rawRating === "N/A" || rawRating === "-") return null;
  const num = parseFloat(rawRating.split("/")[0].trim());
  return isNaN(num) ? null : num;
}

function parseProgress(
  rawProgress: string,
  type: MediaType,
  status: MediaStatus
): { current: number; total: number | null; unit: ProgressUnit } {
  const str = (rawProgress || "").trim();

  // Format: "18/28 EP" or "0/? CH"
  if (str.includes("/")) {
    const [left, right] = str.split("/");
    let current = parseInt(left, 10) || 0;
    const totalMatch = right.match(/\d+/);
    const total = totalMatch ? parseInt(totalMatch[0], 10) : null;
    const unit: ProgressUnit = type === "manga" ? "ch" : "ep";

    if (status === "completed" && total && current === 0) {
      current = total;
    }

    return { current, total, unit };
  }

  // Format: "S1E16" or "S5E16" (Series)
  const seMatch = str.match(/S(\d+)E(\d+)/i);
  if (seMatch) {
    const eps = parseInt(seMatch[2], 10) || 0;
    return {
      current: eps,
      total: status === "completed" ? eps : null,
      unit: "ep",
    };
  }

  // Format: "120 hrs" (Games)
  if (str.toLowerCase().includes("hr") || type === "game") {
    const hrs = parseInt(str, 10) || 0;
    return { current: hrs, total: null, unit: "hrs" };
  }

  // Format: "148 mins" (Movies)
  if (str.toLowerCase().includes("min") || type === "movie") {
    const mins = parseInt(str, 10) || 0;
    return { current: mins, total: mins > 0 ? mins : null, unit: "mins" };
  }

  return { current: 0, total: null, unit: "ep" };
}

function cleanGenres(genres: string[]): string[] {
  const invalidTags = new Set([
    "tv",
    "ona",
    "ova",
    "pv",
    "special",
    "tv special",
    "anime-movie",
    "n/a",
  ]);
  return (genres || []).filter((g) => {
    const lower = g.toLowerCase().trim();
    if (lower.startsWith("writ:")) return false;
    if (invalidTags.has(lower)) return false;
    return true;
  });
}

async function seedCollection(filename: string, type: MediaType, baseUserId: string) {
  const filePath = path.join(process.cwd(), "src", "database", filename);
  const content = await fs.readFile(filePath, "utf-8");
  const items = JSON.parse(content);
  let count = 0;

  for (const item of items) {
    const status = mapStatus(item.status, type);
    const rating = parseRating(item.rating);
    const { current, total, unit } = parseProgress(item.progress, type, status);
    const genres = cleanGenres(item.genres);
    const title = item.title.trim().slice(0, 250);
    const canonicalRating = getCanonicalExternalRating(title);

    // Default season breakdown for TV series
    let defaultSeasons: any = null;
    if (type === "series" || (type === "anime" && total && total > 24)) {
      defaultSeasons = generateDefaultSeasons(title, total, current);
    }

    // 1. Upsert into Master Media Catalog (Shared across all users)
    const media = await prisma.media.upsert({
      where: {
        title_type: {
          title,
          type,
        },
      },
      update: {
        coverImage: item.coverImage || "",
        releaseYear: Number(item.releaseYear) || 2026,
        genres,
        externalRating: canonicalRating,
        totalEpisodes: total,
        progressUnit: unit,
        ...(defaultSeasons && { defaultSeasons }),
      },
      create: {
        title,
        type,
        coverImage: item.coverImage || "",
        releaseYear: Number(item.releaseYear) || 2026,
        genres,
        externalRating: canonicalRating,
        totalEpisodes: total,
        progressUnit: unit,
        defaultSeasons,
      },
    });

    // 2. Attach to base user (SENPAI_09) library
    await prisma.userMediaEntry.upsert({
      where: {
        userId_mediaId: {
          userId: baseUserId,
          mediaId: media.id,
        },
      },
      update: {
        status,
        rating,
        progressCurrent: current,
        ...(defaultSeasons && { seasons: defaultSeasons }),
      },
      create: {
        userId: baseUserId,
        mediaId: media.id,
        status,
        rating,
        progressCurrent: current,
        seasons: defaultSeasons,
      },
    });

    count++;
  }

  console.log(`[SEED] Master Catalog & User Library seeded: ${count} items from ${filename}`);
}

async function main() {
  console.log("Seeding Master Media Catalog and Base Account (SENPAI_09)...");

  // Create or verify base account: SENPAI_09
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("password123", salt);

  const baseUser = await prisma.user.upsert({
    where: { username: "SENPAI_09" },
    update: {
      displayName: "SENPAI_09",
      customBadge: "[SYS_OPERATOR::ELITE]",
      bio: "Archiving media ephemera across multiple timelines. Obsidian-inspired central tracking environment.",
      avatarUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80",
    },
    create: {
      username: "SENPAI_09",
      email: "senpai@shindb.local",
      displayName: "SENPAI_09",
      passwordHash,
      customBadge: "[SYS_OPERATOR::ELITE]",
      bio: "Archiving media ephemera across multiple timelines. Obsidian-inspired central tracking environment.",
      avatarUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80",
    },
  });

  // Also support shin as alternate demo account
  await prisma.user.upsert({
    where: { username: "shin" },
    update: {},
    create: {
      username: "shin",
      email: "shin@shindb.local",
      displayName: "Shin Commander",
      passwordHash,
      customBadge: "[SYS_OPERATOR::ELITE]",
      bio: "Commander Node // Tactical Database",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log(`[SEED] Verified base user: ${baseUser.username} (${baseUser.id})`);

  // Seed all 5 categories into Master Catalog and Base User Library
  await seedCollection("anime.json", "anime", baseUser.id);
  await seedCollection("manga.json", "manga", baseUser.id);
  await seedCollection("games.json", "game", baseUser.id);
  await seedCollection("movies.json", "movie", baseUser.id);
  await seedCollection("series.json", "series", baseUser.id);

  console.log("Master Media Catalog and SENPAI_09 Library setup complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
