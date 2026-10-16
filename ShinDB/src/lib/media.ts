// src/lib/media.ts
import { prisma } from "@/lib/prisma";
import { MediaType, Media, UserMediaEntry } from "@prisma/client";
import { MediaItem } from "@/components/common/MediaCard";
import {
  SeasonData,
  generateDefaultSeasons,
  getActiveSeasonNumber,
  formatStructuredProgress,
  getCanonicalExternalRating,
} from "@/utils/seasonHelpers";

const statusDisplayMap: Record<string, string> = {
  watching: "Watching",
  reading: "Reading",
  playing: "Playing",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
  plan_to_consume: "Plan to Consume",
};

function getDisplayStatus(rawStatus: string, type: MediaType): string {
  if (rawStatus === "plan_to_consume") {
    return type === "manga" ? "Plan to Read" : type === "game" ? "Plan to Play" : "Plan to Watch";
  }
  return statusDisplayMap[rawStatus] || "Plan to Watch";
}

// Convert UserMediaEntry joined with Media into UI MediaItem
export function toMediaItem(
  entry: UserMediaEntry & { media: Media }
): MediaItem {
  const { media } = entry;

  // Seasons breakdown resolution strictly for TV series
  let parsedSeasons: SeasonData[] | undefined = undefined;
  if (media.type === "series") {
    if (Array.isArray(entry.seasons) && entry.seasons.length > 0) {
      parsedSeasons = entry.seasons as unknown as SeasonData[];
    } else if (Array.isArray(media.defaultSeasons) && media.defaultSeasons.length > 0) {
      parsedSeasons = media.defaultSeasons as unknown as SeasonData[];
    } else {
      parsedSeasons = generateDefaultSeasons(media.title, media.totalEpisodes, entry.progressCurrent);
    }
  }

  // Format progress string
  let progressStr = `${entry.progressCurrent} ${media.progressUnit}`;
  let currentSeason = entry.currentSeason || 1;

  if (parsedSeasons && parsedSeasons.length > 0) {
    currentSeason = getActiveSeasonNumber(parsedSeasons, entry.currentSeason);
    progressStr = formatStructuredProgress(
      parsedSeasons,
      currentSeason,
      entry.progressCurrent,
      media.totalEpisodes,
      media.progressUnit
    );
  } else if (media.type === "anime" || media.type === "manga" || media.type === "series" || media.type === "movie") {
    const total = media.totalEpisodes ?? "?";
    progressStr = `${entry.progressCurrent}/${total} ${media.progressUnit.toUpperCase()}`;
  }

  // External Rating
  let externalRatingFormatted: string | null = null;
  const canonicalExt = media.externalRating ?? getCanonicalExternalRating(media.title);
  if (canonicalExt !== null && canonicalExt !== undefined) {
    const sourceLabel = media.type === "anime" || media.type === "manga" ? "MAL" : "IMDb";
    externalRatingFormatted = `${sourceLabel} ${canonicalExt.toFixed(1)}/10`;
  }

  const parsedGenres = Array.isArray(media.genres)
    ? (media.genres as any[]).map((g) => String(g))
    : [];

  return {
    id: entry.id,
    mediaId: media.id,
    title: media.title,
    type: media.type,
    status: getDisplayStatus(entry.status, media.type),
    rating: entry.rating !== null ? `${entry.rating.toFixed(1)}/10` : "Unrated",
    externalRating: externalRatingFormatted,
    progress: progressStr,
    progressCurrent: entry.progressCurrent,
    progressTotal: media.totalEpisodes,
    progressUnit: media.progressUnit,
    currentSeason,
    seasons: parsedSeasons,
    coverImage: media.coverImage,
    genres: parsedGenres,
    releaseYear: media.releaseYear,
    notes: entry.notes || "",
    isFavorite: entry.isFavorite,
    isUserTracked: true,
  };
}

// Convert Master Catalog Media into UI MediaItem
export function catalogToMediaItem(
  media: Media,
  userEntry?: UserMediaEntry | null
): MediaItem {
  if (userEntry) {
    return toMediaItem({ ...userEntry, media });
  }

  let externalRatingFormatted: string | null = null;
  const canonicalExt = media.externalRating ?? getCanonicalExternalRating(media.title);
  if (canonicalExt !== null && canonicalExt !== undefined) {
    const sourceLabel = media.type === "anime" || media.type === "manga" ? "MAL" : "IMDb";
    externalRatingFormatted = `${sourceLabel} ${canonicalExt.toFixed(1)}/10`;
  }

  let progressStr = `0/${media.totalEpisodes ?? "?"} ${media.progressUnit.toUpperCase()}`;
  if (media.progressUnit === "hrs") progressStr = `0 hrs`;
  if (media.progressUnit === "mins") progressStr = `0/${media.totalEpisodes ?? "?"} MINS`;

  const parsedGenres = Array.isArray(media.genres)
    ? (media.genres as any[]).map((g) => String(g))
    : [];

  return {
    id: media.id,
    mediaId: media.id,
    title: media.title,
    type: media.type,
    status: "Not Tracked",
    rating: "Unrated",
    externalRating: externalRatingFormatted,
    progress: progressStr,
    progressCurrent: 0,
    progressTotal: media.totalEpisodes,
    progressUnit: media.progressUnit,
    currentSeason: 1,
    coverImage: media.coverImage,
    genres: parsedGenres,
    releaseYear: media.releaseYear,
    notes: "",
    isFavorite: false,
    isUserTracked: false,
  };
}

export async function getDefaultUserId(): Promise<string | null> {
  return null;
}

export async function getMediaByType(
  type: MediaType,
  userId?: string | null
): Promise<MediaItem[]> {
  // If user is provided, get their personal library for this category
  if (userId) {
    const userEntries = await prisma.userMediaEntry.findMany({
      where: {
        userId,
        media: { type },
      },
      include: { media: true },
      orderBy: { updatedAt: "desc" },
    });
    return userEntries.map(toMediaItem);
  }

  // Without a user, return empty list (individual personal library)
  return [];
}

export async function getAllMediaGrouped(userId?: string | null) {
  if (userId) {
    const userEntries = await prisma.userMediaEntry.findMany({
      where: { userId },
      include: { media: true },
      orderBy: { updatedAt: "desc" },
    });

    const items = userEntries.map(toMediaItem);
    return {
      animeList: items.filter((i) => i.type === "anime"),
      mangaList: items.filter((i) => i.type === "manga"),
      gamesList: items.filter((i) => i.type === "game"),
      moviesList: items.filter((i) => i.type === "movie"),
      seriesList: items.filter((i) => i.type === "series"),
    };
  }

  // Unauthenticated visitors have empty lists
  return {
    animeList: [],
    mangaList: [],
    gamesList: [],
    moviesList: [],
    seriesList: [],
  };
}
