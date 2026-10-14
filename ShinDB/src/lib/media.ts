// src/lib/media.ts
import { prisma } from "@/lib/prisma";
import { MediaType, MediaEntry } from "@prisma/client";
import { MediaItem } from "@/components/common/MediaCard";

// Convert Prisma MySQL model to UI MediaItem interface
export function toMediaItem(entry: MediaEntry): MediaItem {
  const statusDisplayMap: Record<string, string> = {
    watching: "Watching",
    reading: "Reading",
    playing: "Playing",
    completed: "Completed",
    on_hold: "On Hold",
    dropped: "Dropped",
    plan_to_consume:
      entry.type === "manga"
        ? "Plan to Read"
        : entry.type === "game"
        ? "Plan to Play"
        : "Plan to Watch",
  };

  let progressStr = `${entry.progressCurrent} ${entry.progressUnit}`;
  if (entry.type === "anime" || entry.type === "manga") {
    const total = entry.progressTotal ?? "?";
    progressStr = `${entry.progressCurrent}/${total} ${entry.progressUnit.toUpperCase()}`;
  } else if (entry.type === "series") {
    progressStr = `S1E${String(entry.progressCurrent).padStart(2, "0")}`;
  }

  // Safely parse MySQL JSON column into string[]
  const parsedGenres = Array.isArray(entry.genres)
    ? entry.genres.map((g) => String(g))
    : [];

  return {
    id: entry.id,
    title: entry.title,
    type: entry.type,
    status: statusDisplayMap[entry.status] || "Plan to Watch",
    rating: entry.rating !== null ? `${entry.rating.toFixed(1)}/10` : "N/A",
    progress: progressStr,
    coverImage: entry.coverImage,
    genres: parsedGenres,
    releaseYear: entry.releaseYear,
  };
}

export async function getMediaByType(type: MediaType): Promise<MediaItem[]> {
  const entries = await prisma.mediaEntry.findMany({
    where: { type },
    orderBy: { updatedAt: "desc" },
  });
  return entries.map(toMediaItem);
}

export async function getAllMediaGrouped() {
  const entries = await prisma.mediaEntry.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const items = entries.map(toMediaItem);

  return {
    animeList: items.filter((i) => i.type === "anime"),
    mangaList: items.filter((i) => i.type === "manga"),
    gamesList: items.filter((i) => i.type === "game"),
    moviesList: items.filter((i) => i.type === "movie"),
    seriesList: items.filter((i) => i.type === "series"),
  };
}
