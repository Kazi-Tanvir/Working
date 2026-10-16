import dns from "node:dns";
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}
import { prisma } from "@/lib/prisma";
import { MediaStatus, MediaType } from "@prisma/client";

// ----------------------------------------------------
// 1. Text Parsing
// ----------------------------------------------------
export function parseTextList(raw: string): string[] {
  if (!raw || typeof raw !== "string") return [];

  // Split on newlines or commas
  const items = raw.split(/[\r\n,]+/);

  const cleaned = items
    .map((line) =>
      line
        .replace(/^\s*\d+[\.\)\-:]\s*/, "") // remove numbered prefixes like "1.", "1)", "1-"
        .replace(/^\s*[\-\•\*\–\—\>]\s*/, "") // remove bullet points like "-", "•", "*"
        .trim()
    )
    .filter((line) => line.length > 0);

  // Deduplicate case-insensitively while preserving original casing
  const seen = new Set<string>();
  const uniqueList: string[] = [];
  for (const item of cleaned) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueList.push(item);
    }
  }

  return uniqueList;
}

// ----------------------------------------------------
// 2. Status & Score Mapping
// ----------------------------------------------------
export function mapExternalStatus(
  externalStatus: string,
  mediaType: "anime" | "manga"
): MediaStatus {
  const norm = (externalStatus || "").toUpperCase().trim();

  switch (norm) {
    case "CURRENT":
    case "WATCHING":
      return MediaStatus.watching;
    case "READING":
      return MediaStatus.reading;
    case "COMPLETED":
      return MediaStatus.completed;
    case "PAUSED":
    case "ON_HOLD":
    case "ON-HOLD":
    case "HOLD":
      return MediaStatus.on_hold;
    case "DROPPED":
      return MediaStatus.dropped;
    case "PLANNING":
    case "PLAN_TO_WATCH":
    case "PLAN_TO_READ":
    case "PLANNING_TO_WATCH":
    case "PLANNING_TO_READ":
      return MediaStatus.plan_to_consume;
    case "REPEATING":
    case "REWATCHING":
      return mediaType === "anime" ? MediaStatus.watching : MediaStatus.reading;
    default:
      return MediaStatus.plan_to_consume;
  }
}

export function mapExternalScore(
  score: number | null | undefined,
  scale: 10 | 100 = 10
): number | null {
  if (score === null || score === undefined || isNaN(score) || score <= 0) {
    return null;
  }

  if (scale === 100) {
    const outOf10 = score / 10;
    return Math.round(outOf10 * 10) / 10;
  }

  return Math.min(10, Math.max(0, Math.round(score * 10) / 10));
}

// ----------------------------------------------------
// 3. Master Media Find or Create
// ----------------------------------------------------
export async function findOrCreateMedia(data: {
  title: string;
  type: MediaType;
  coverImage?: string;
  releaseYear?: number;
  genres?: string[];
  externalRating?: number | null;
  totalEpisodes?: number | null;
  externalId?: string;
  externalSource?: string;
}) {
  const cleanTitle = data.title.trim();
  const type = data.type;

  // 1. Check externalId + externalSource if present
  if (data.externalId && data.externalSource) {
    const existingByExternal = await prisma.media.findFirst({
      where: {
        externalId: String(data.externalId),
        externalSource: data.externalSource,
      },
    });
    if (existingByExternal) {
      if ((!existingByExternal.coverImage && data.coverImage) || (data.title && existingByExternal.title !== cleanTitle)) {
        try {
          return await prisma.media.update({
            where: { id: existingByExternal.id },
            data: {
              ...(data.coverImage && !existingByExternal.coverImage ? { coverImage: data.coverImage } : {}),
              ...(data.title && existingByExternal.title !== cleanTitle ? { title: cleanTitle } : {}),
            },
          });
        } catch {
          // If title conflict occurs, return existing without error
          return existingByExternal;
        }
      }
      return existingByExternal;
    }
  }

  // 2. Check by unique title + type
  const existing = await prisma.media.findUnique({
    where: {
      title_type: {
        title: cleanTitle,
        type: type,
      },
    },
  });

  if (existing) {
    // If existing lacks cover image or external IDs, augment it
    if (
      (!existing.coverImage && data.coverImage) ||
      (!existing.externalId && data.externalId)
    ) {
      return await prisma.media.update({
        where: { id: existing.id },
        data: {
          ...(data.coverImage && !existing.coverImage ? { coverImage: data.coverImage } : {}),
          ...(data.externalId && !existing.externalId ? { externalId: data.externalId } : {}),
          ...(data.externalSource && !existing.externalSource
            ? { externalSource: data.externalSource }
            : {}),
        },
      });
    }
    return existing;
  }

  // 3. Create fresh canonical record
  const year = data.releaseYear && data.releaseYear > 1900 ? data.releaseYear : new Date().getFullYear();
  const cover = data.coverImage || "";
  const genres = data.genres && data.genres.length > 0 ? data.genres : ["Imported"];

  return await prisma.media.create({
    data: {
      title: cleanTitle,
      type: type,
      coverImage: cover,
      releaseYear: year,
      genres: genres,
      externalRating: data.externalRating ?? null,
      totalEpisodes: data.totalEpisodes ?? null,
      externalId: data.externalId ?? null,
      externalSource: data.externalSource ?? null,
    },
  });
}

// ----------------------------------------------------
// 4. Media Resolution for Plain Text Import
// ----------------------------------------------------
export async function resolveTitle(
  rawTitle: string,
  type: MediaType
): Promise<{
  title: string;
  type: MediaType;
  coverImage: string;
  releaseYear: number;
  genres: string[];
  externalRating: number | null;
  totalEpisodes: number | null;
  externalId?: string;
  externalSource?: string;
  matched: boolean;
}> {
  const query = rawTitle.trim();

  // 1. Check local catalog first
  try {
    const localMatch = await prisma.media.findFirst({
      where: {
        type: type,
        title: {
          contains: query,
        },
      },
      orderBy: { userEntries: { _count: "desc" } },
    });

    if (localMatch) {
      return {
        title: localMatch.title,
        type: localMatch.type,
        coverImage: localMatch.coverImage,
        releaseYear: localMatch.releaseYear,
        genres: Array.isArray(localMatch.genres) ? (localMatch.genres as string[]) : [],
        externalRating: localMatch.externalRating,
        totalEpisodes: localMatch.totalEpisodes,
        externalId: localMatch.externalId || undefined,
        externalSource: localMatch.externalSource || undefined,
        matched: true,
      };
    }
  } catch (err) {
    console.warn("[RESOLVE_LOCAL_WARN]:", err);
  }

  // 2. Query AniList for Anime or Manga
  if (type === "anime" || type === "manga") {
    try {
      const graphqlQuery = `
        query ($search: String, $type: MediaType) {
          Media(search: $search, type: $type) {
            id
            title {
              english
              romaji
            }
            coverImage {
              large
            }
            startDate {
              year
            }
            genres
            episodes
            chapters
            averageScore
          }
        }
      `;

      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: {
            search: query,
            type: type === "anime" ? "ANIME" : "MANGA",
          },
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const json = await response.json();
        const item = json.data?.Media;
        if (item) {
          const matchedTitle =
            item.title.english || item.title.romaji || query;
          const score = item.averageScore
            ? Math.round((item.averageScore / 10) * 10) / 10
            : null;

          return {
            title: matchedTitle,
            type,
            coverImage:
              item.coverImage?.large ||
              "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
            releaseYear: item.startDate?.year || new Date().getFullYear(),
            genres: item.genres || ["Anime"],
            externalRating: score,
            totalEpisodes: item.episodes || item.chapters || null,
            externalId: String(item.id),
            externalSource: "anilist",
            matched: true,
          };
        }
      }
    } catch (err) {
      console.warn("[RESOLVE_ANILIST_WARN]:", err);
    }
  }

  // 3. Fallback barebones if no match found
  return {
    title: query,
    type,
    coverImage: "",
    releaseYear: new Date().getFullYear(),
    genres: ["Uncategorized"],
    externalRating: null,
    totalEpisodes: null,
    matched: false,
  };
}

// ----------------------------------------------------
// 5. User Media Entry Upsert
// ----------------------------------------------------
export async function upsertUserMediaEntry(params: {
  userId: string;
  mediaId: string;
  status: MediaStatus;
  progressCurrent?: number;
  rating?: number | null;
  notes?: string;
  overwrite: boolean;
  rewatchCount?: number;
}): Promise<"imported" | "updated" | "skipped"> {
  const {
    userId,
    mediaId,
    status,
    progressCurrent = 0,
    rating = null,
    notes,
    overwrite,
    rewatchCount = 0,
  } = params;

  const existing = await prisma.userMediaEntry.findUnique({
    where: {
      userId_mediaId: {
        userId,
        mediaId,
      },
    },
  });

  if (!existing) {
    await prisma.userMediaEntry.create({
      data: {
        userId,
        mediaId,
        status,
        progressCurrent,
        rating,
        notes: notes || null,
        rewatchCount,
      },
    });
    return "imported";
  }

  if (overwrite) {
    await prisma.userMediaEntry.update({
      where: { id: existing.id },
      data: {
        status,
        progressCurrent,
        rating: rating !== undefined ? rating : existing.rating,
        ...(notes ? { notes } : {}),
        rewatchCount,
      },
    });
    return "updated";
  }

  return "skipped";
}

// ----------------------------------------------------
// 6. Batch MAL Metadata Resolution via AniList
// ----------------------------------------------------
export interface ResolvedMalItem {
  title: string;
  coverImage: string;
  releaseYear?: number;
  genres?: string[];
  totalEpisodes?: number;
}

export async function batchResolveMalMetadata(
  entries: { malId: string; type: "anime" | "manga" | MediaType; title: string }[]
): Promise<Map<string, ResolvedMalItem>> {
  const result = new Map<string, ResolvedMalItem>();
  const validEntries = entries.filter((e) => e.malId && !isNaN(Number(e.malId)));
  if (validEntries.length === 0) return result;

  const chunkSize = 40;
  for (let i = 0; i < validEntries.length; i += chunkSize) {
    const chunk = validEntries.slice(i, i + chunkSize);
    const idMalIn = chunk.map((c) => Number(c.malId));

    try {
      const query = `
        query ($idMalIn: [Int]) {
          Page(page: 1, perPage: 50) {
            media(idMal_in: $idMalIn) {
              id
              idMal
              type
              title {
                english
                romaji
              }
              coverImage {
                extraLarge
                large
              }
              startDate {
                year
              }
              genres
              episodes
              chapters
            }
          }
        }
      `;

      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { idMalIn },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const json = await res.json();
        const mediaList = json.data?.Page?.media || [];

        for (const m of mediaList) {
          if (!m.idMal) continue;
          const malKey = String(m.idMal);
          const englishTitle = m.title?.english?.trim();
          const romajiTitle = m.title?.romaji?.trim();
          const chosenTitle = englishTitle || romajiTitle;
          const cover = m.coverImage?.extraLarge || m.coverImage?.large || "";

          const targetItem = chunk.find((c) => c.malId === malKey);
          if (targetItem) {
            const expectedAniListType = targetItem.type === "manga" ? "MANGA" : "ANIME";
            if (m.type === expectedAniListType) {
              result.set(malKey, {
                title: chosenTitle || targetItem.title,
                coverImage: cover,
                releaseYear: m.startDate?.year || undefined,
                genres: Array.isArray(m.genres) ? m.genres : undefined,
                totalEpisodes: m.episodes || m.chapters || undefined,
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn("[BATCH_RESOLVE_WARN]:", err);
    }
  }

  return result;
}

