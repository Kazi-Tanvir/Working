import { PrismaClient, MediaType, MediaStatus, ProgressUnit } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

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

    // Fix bug in anime.json where Completed items have "0/28 EP"
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

async function seedCollection(filename: string, type: MediaType) {
  const filePath = path.join(process.cwd(), "src", "database", filename);
  const content = await fs.readFile(filePath, "utf-8");
  const items = JSON.parse(content);
  let count = 0;

  for (const item of items) {
    const status = mapStatus(item.status, type);
    const rating = parseRating(item.rating);
    const { current, total, unit } = parseProgress(item.progress, type, status);
    const genres = cleanGenres(item.genres);

    await prisma.mediaEntry.upsert({
      where: {
        title_type: {
          title: item.title.trim().slice(0, 250),
          type,
        },
      },
      update: {
        status,
        rating,
        progressCurrent: current,
        progressTotal: total,
        progressUnit: unit,
        genres,
        coverImage: item.coverImage || "",
        releaseYear: Number(item.releaseYear) || 2026,
      },
      create: {
        title: item.title.trim().slice(0, 250),
        type,
        status,
        rating,
        progressCurrent: current,
        progressTotal: total,
        progressUnit: unit,
        genres,
        coverImage: item.coverImage || "",
        releaseYear: Number(item.releaseYear) || 2026,
      },
    });
    count++;
  }

  console.log(`[SEED] Migrated ${count} items from ${filename} into MySQL`);
}

async function main() {
  console.log("Starting JSON -> Localhost MySQL Prisma migration...");
  await seedCollection("anime.json", "anime");
  await seedCollection("manga.json", "manga");
  await seedCollection("games.json", "game");
  await seedCollection("movies.json", "movie");
  await seedCollection("series.json", "series");
  console.log("MySQL Migration complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
