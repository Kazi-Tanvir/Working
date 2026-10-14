// src/lib/media.ts
import { prisma } from "@/lib/prisma";
import { MediaType, MediaEntry } from "@prisma/client";
import { MediaItem } from "@/components/common/MediaCard";
import {
  SeasonData,
  generateDefaultSeasons,
  getActiveSeasonNumber,
  formatStructuredProgress,
  getCanonicalExternalRating,
} from "@/utils/seasonHelpers";

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

  // Structured seasons resolution
  let parsedSeasons: SeasonData[] | undefined = undefined;
  if (Array.isArray(entry.seasons) && entry.seasons.length > 0) {
    parsedSeasons = entry.seasons as unknown as SeasonData[];
  } else if (entry.type === "series") {
    parsedSeasons = generateDefaultSeasons(entry.title, entry.progressTotal, entry.progressCurrent);
  }

  // Calculate structured progress
  let progressStr = `${entry.progressCurrent} ${entry.progressUnit}`;
  let currentSeason = entry.currentSeason || 1;

  if (parsedSeasons && parsedSeasons.length > 0) {
    currentSeason = getActiveSeasonNumber(parsedSeasons, entry.currentSeason);
    progressStr = formatStructuredProgress(
      parsedSeasons,
      currentSeason,
      entry.progressCurrent,
      entry.progressTotal,
      entry.progressUnit
    );
  } else if (entry.type === "anime" || entry.type === "manga") {
    const total = entry.progressTotal ?? "?";
    progressStr = `${entry.progressCurrent}/${total} ${entry.progressUnit.toUpperCase()}`;
  } else if (entry.type === "series") {
    const total = entry.progressTotal ?? "?";
    progressStr = `${entry.progressCurrent}/${total} EP`;
  }

  // External rating resolution
  let externalRatingFormatted: string | null = null;
  const canonicalExt = entry.externalRating ?? getCanonicalExternalRating(entry.title);
  if (canonicalExt !== null && canonicalExt !== undefined) {
    const sourceLabel = entry.type === "anime" || entry.type === "manga" ? "MAL" : "IMDb";
    externalRatingFormatted = `${sourceLabel} ${canonicalExt.toFixed(1)}/10`;
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
    rating: entry.rating !== null ? `${entry.rating.toFixed(1)}/10` : "Unrated",
    externalRating: externalRatingFormatted,
    progress: progressStr,
    progressCurrent: entry.progressCurrent,
    progressTotal: entry.progressTotal,
    progressUnit: entry.progressUnit,
    currentSeason,
    seasons: parsedSeasons,
    coverImage: entry.coverImage,
    genres: parsedGenres,
    releaseYear: entry.releaseYear,
    notes: entry.notes || "",
    isFavorite: entry.isFavorite,
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
