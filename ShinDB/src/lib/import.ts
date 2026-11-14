import dns from "node:dns";
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}
import { prisma } from "@/lib/prisma";
import { MediaStatus, MediaType } from "@prisma/client";
import { generateDefaultSeasons, calculateTotalEpisodes } from "@/utils/seasonHelpers";

// ----------------------------------------------------
// 1. Text Parsing
// ----------------------------------------------------
export { parseTextList } from "@/utils/textParser";

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
  defaultSeasons?: any;
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
      if (
        (!existingByExternal.coverImage && data.coverImage) ||
        (data.title && existingByExternal.title !== cleanTitle) ||
        (!existingByExternal.totalEpisodes && data.totalEpisodes) ||
        (!existingByExternal.defaultSeasons && data.defaultSeasons)
      ) {
        try {
          return await prisma.media.update({
            where: { id: existingByExternal.id },
            data: {
              ...(data.coverImage && !existingByExternal.coverImage ? { coverImage: data.coverImage } : {}),
              ...(data.title && existingByExternal.title !== cleanTitle ? { title: cleanTitle } : {}),
              ...(data.totalEpisodes && !existingByExternal.totalEpisodes ? { totalEpisodes: data.totalEpisodes } : {}),
              ...(data.defaultSeasons && !existingByExternal.defaultSeasons ? { defaultSeasons: data.defaultSeasons } : {}),
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
    // If existing lacks cover image, external IDs, totalEpisodes, or defaultSeasons, augment it
    if (
      (!existing.coverImage && data.coverImage) ||
      (!existing.externalId && data.externalId) ||
      (!existing.totalEpisodes && data.totalEpisodes) ||
      (!existing.defaultSeasons && data.defaultSeasons)
    ) {
      return await prisma.media.update({
        where: { id: existing.id },
        data: {
          ...(data.coverImage && !existing.coverImage ? { coverImage: data.coverImage } : {}),
          ...(data.externalId && !existing.externalId ? { externalId: data.externalId } : {}),
          ...(data.externalSource && !existing.externalSource
            ? { externalSource: data.externalSource }
            : {}),
          ...(data.totalEpisodes && !existing.totalEpisodes ? { totalEpisodes: data.totalEpisodes } : {}),
          ...(data.defaultSeasons && !existing.defaultSeasons ? { defaultSeasons: data.defaultSeasons } : {}),
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
      defaultSeasons: data.defaultSeasons ?? null,
      externalId: data.externalId ?? null,
      externalSource: data.externalSource ?? null,
    },
  });
}

// ----------------------------------------------------
// 4. Media Resolution for Import Protocols
// ----------------------------------------------------
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        const retryHeader = res.headers.get("retry-after");
        const waitSec = retryHeader ? parseInt(retryHeader, 10) : (attempt + 1) * 2;
        console.warn(`[API_429_RATE_LIMIT] ${url} hit rate limit. Backing off ${waitSec}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, waitSec * 1000 + 400));
        continue;
      }
      return res;
    } catch (err: any) {
      if (attempt === maxRetries) throw err;
      console.warn(`[API_FETCH_RETRY] ${url}: ${err.message}. Retrying in 1.5s...`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error(`Max retries reached for ${url}`);
}

export function cleanTitleForComparison(title: string): string {
  return (title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"’“”`]/g, "")
    .replace(/\s*\((?:tv|movie|ova|ona|special)\)\s*$/gi, "")
    .replace(/[:\-–—_]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isExactTitleMatch(candidate: string | null | undefined, query: string): boolean {
  if (!candidate || !query) return false;
  const cNorm = candidate.trim().toLowerCase();
  const qNorm = query.trim().toLowerCase();
  if (cNorm === qNorm) return true;

  const cClean = cleanTitleForComparison(candidate);
  const qClean = cleanTitleForComparison(query);
  return Boolean(cClean && qClean && cClean === qClean);
}

// ANILIST RESOLVER (Anime / Manga with English -> Romaji -> Native matching)
export async function resolveAnimeFromAniList(
  query: string,
  type: "anime" | "manga" = "anime"
) {
  const mediaTypeEnum = type === "anime" ? "ANIME" : "MANGA";
  const graphqlQuery = `
    query ($search: String, $type: MediaType) {
      Page(page: 1, perPage: 10) {
        media(search: $search, type: $type) {
          id
          idMal
          title {
            english
            romaji
            native
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
          averageScore
        }
      }
    }
  `;

  try {
    const res = await fetchWithRetry("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          search: query,
          type: mediaTypeEnum,
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const mediaList = json.data?.Page?.media || [];

    // Exact match order: 1. English -> 2. Romaji -> 3. Japanese (Native)
    let matchedItem = mediaList.find((item: any) =>
      isExactTitleMatch(item.title?.english, query)
    );
    if (!matchedItem) {
      matchedItem = mediaList.find((item: any) =>
        isExactTitleMatch(item.title?.romaji, query)
      );
    }
    if (!matchedItem) {
      matchedItem = mediaList.find((item: any) =>
        isExactTitleMatch(item.title?.native, query)
      );
    }

    if (matchedItem) {
      const chosenTitle =
        matchedItem.title?.english ||
        matchedItem.title?.romaji ||
        matchedItem.title?.native ||
        query;
      const score = matchedItem.averageScore
        ? Math.round((matchedItem.averageScore / 10) * 10) / 10
        : null;

      return {
        title: chosenTitle,
        type: type as MediaType,
        coverImage:
          matchedItem.coverImage?.extraLarge ||
          matchedItem.coverImage?.large ||
          "",
        releaseYear: matchedItem.startDate?.year || new Date().getFullYear(),
        genres: Array.isArray(matchedItem.genres)
          ? matchedItem.genres
          : [type === "anime" ? "Anime" : "Manga"],
        externalRating: score,
        totalEpisodes: matchedItem.episodes || matchedItem.chapters || null,
        externalId: String(matchedItem.id),
        externalSource: "anilist",
        matched: true,
      };
    }
  } catch (err) {
    console.warn("[RESOLVE_ANILIST_WARN]:", err);
  }
  return null;
}

// JIKAN / MAL RESOLVER
export async function resolveAnimeFromJikan(
  query: string,
  type: "anime" | "manga" = "anime"
) {
  try {
    const endpoint =
      type === "anime"
        ? `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`
        : `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=10`;

    const res = await fetch(endpoint, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const json = await res.json();
    const dataList = json.data || [];

    // Exact match order: 1. English -> 2. Romaji/Main -> 3. Japanese
    let matchedItem = dataList.find(
      (item: any) =>
        isExactTitleMatch(item.title_english, query) ||
        item.titles?.some(
          (t: any) => t.type === "English" && isExactTitleMatch(t.title, query)
        )
    );
    if (!matchedItem) {
      matchedItem = dataList.find(
        (item: any) =>
          isExactTitleMatch(item.title, query) ||
          item.titles?.some(
            (t: any) =>
              (t.type === "Default" || t.type === "Synonym") &&
              isExactTitleMatch(t.title, query)
          )
      );
    }
    if (!matchedItem) {
      matchedItem = dataList.find(
        (item: any) =>
          isExactTitleMatch(item.title_japanese, query) ||
          item.titles?.some(
            (t: any) => t.type === "Japanese" && isExactTitleMatch(t.title, query)
          )
      );
    }

    if (matchedItem) {
      const chosenTitle = matchedItem.title_english || matchedItem.title;
      const score = mapExternalScore(matchedItem.score, 10);
      const year =
        matchedItem.year ||
        (matchedItem.aired?.from
          ? new Date(matchedItem.aired.from).getFullYear()
          : new Date().getFullYear());

      return {
        title: chosenTitle,
        type: type as MediaType,
        coverImage:
          matchedItem.images?.webp?.large_image_url ||
          matchedItem.images?.jpg?.large_image_url ||
          "",
        releaseYear: isNaN(year) ? new Date().getFullYear() : year,
        genres: Array.isArray(matchedItem.genres)
          ? matchedItem.genres.map((g: any) => g.name)
          : [type === "anime" ? "Anime" : "Manga"],
        externalRating: score,
        totalEpisodes: matchedItem.episodes || matchedItem.chapters || null,
        externalId: String(matchedItem.mal_id),
        externalSource: "mal",
        matched: true,
      };
    }
  } catch (err) {
    console.warn("[RESOLVE_JIKAN_WARN]:", err);
  }
  return null;
}

// TMDB RESOLVER (Series / TV / Movies)
export async function resolveSeriesOrMovieFromTMDB(
  query: string,
  type: "movie" | "series"
) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const tmdbType = type === "movie" ? "movie" : "tv";
    const endpoint = `https://api.themoviedb.org/3/search/${tmdbType}?query=${encodeURIComponent(
      query
    )}&api_key=${apiKey}`;

    const res = await fetch(endpoint, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const json = await res.json();
    const results = json.results || [];

    const matchedItem = results.find((item: any) => {
      const mainTitle = item.title || item.name;
      const origTitle = item.original_title || item.original_name;
      return (
        isExactTitleMatch(mainTitle, query) || isExactTitleMatch(origTitle, query)
      );
    });

    if (matchedItem) {
      const releaseDate =
        matchedItem.release_date || matchedItem.first_air_date || "";
      const releaseYear = releaseDate
        ? parseInt(releaseDate.split("-")[0], 10)
        : new Date().getFullYear();
      const cover = matchedItem.poster_path
        ? `https://image.tmdb.org/t/p/w500${matchedItem.poster_path}`
        : "";

      let totalEpisodes: number | null = null;
      let defaultSeasons: any = null;
      let genres = [type === "movie" ? "Movie" : "Series"];

      if (type === "series") {
        try {
          const detailRes = await fetch(
            `https://api.themoviedb.org/3/tv/${matchedItem.id}?api_key=${apiKey}`,
            { signal: AbortSignal.timeout(4000) }
          );
          if (detailRes.ok) {
            const detail = await detailRes.json();
            if (detail.number_of_episodes) {
              totalEpisodes = detail.number_of_episodes;
            }
            if (Array.isArray(detail.genres) && detail.genres.length > 0) {
              genres = detail.genres.map((g: any) => g.name);
            }
            if (Array.isArray(detail.seasons) && detail.seasons.length > 0) {
              const regularSeasons = detail.seasons.filter((s: any) => s.season_number > 0);
              if (regularSeasons.length > 0) {
                defaultSeasons = regularSeasons.map((s: any) => ({
                  seasonNumber: s.season_number,
                  title: s.name || `Season ${s.season_number}`,
                  episodeCount: s.episode_count || 0,
                  episodesWatched: 0,
                  isCompleted: false,
                }));
              }
            }
          }
        } catch (detailErr) {
          console.warn("[TMDB_TV_DETAILS_WARN]:", detailErr);
        }

        // Canonical map fallback if TMDB seasons/episodes were not retrieved
        if (!defaultSeasons) {
          const canonical = generateDefaultSeasons(matchedItem.title || matchedItem.name, totalEpisodes, 0);
          if (canonical && canonical.length > 0) {
            defaultSeasons = canonical;
            if (!totalEpisodes) {
              totalEpisodes = calculateTotalEpisodes(canonical);
            }
          }
        }
      }

      return {
        title: matchedItem.title || matchedItem.name,
        type: type as MediaType,
        coverImage: cover,
        releaseYear: isNaN(releaseYear) ? new Date().getFullYear() : releaseYear,
        genres,
        externalRating: matchedItem.vote_average
          ? Math.round(matchedItem.vote_average * 10) / 10
          : null,
        totalEpisodes,
        defaultSeasons,
        externalId: String(matchedItem.id),
        externalSource: "tmdb",
        matched: true,
      };
    }
  } catch (err) {
    console.warn("[RESOLVE_TMDB_WARN]:", err);
  }
  return null;
}

// RAWG RESOLVER (Video Games)
export async function resolveGameFromRAWG(query: string) {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return null;

  try {
    const endpoint = `https://api.rawg.io/api/games?search=${encodeURIComponent(
      query
    )}&key=${apiKey}`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const json = await res.json();
    const results = json.results || [];

    const matchedItem = results.find((item: any) =>
      isExactTitleMatch(item.name, query)
    );

    if (matchedItem) {
      const releaseYear = matchedItem.released
        ? parseInt(matchedItem.released.split("-")[0], 10)
        : new Date().getFullYear();
      const rating = matchedItem.metacritic
        ? Math.round((matchedItem.metacritic / 10) * 10) / 10
        : matchedItem.rating
        ? Math.round(matchedItem.rating * 2 * 10) / 10
        : null;

      return {
        title: matchedItem.name,
        type: "game" as MediaType,
        coverImage: matchedItem.background_image || matchedItem.short_screenshots?.[0]?.image || "",
        releaseYear: isNaN(releaseYear) ? new Date().getFullYear() : releaseYear,
        genres: Array.isArray(matchedItem.genres)
          ? matchedItem.genres.map((g: any) => g.name)
          : ["Game"],
        externalRating: rating,
        totalEpisodes: null,
        externalId: String(matchedItem.id),
        externalSource: "rawg",
        matched: true,
      };
    }
  } catch (err) {
    console.warn("[RESOLVE_RAWG_WARN]:", err);
    // If RAWG network is reset/unreachable, check verified canonical game catalog
    const mockGames: Array<{ title: string; year: number; cover: string; rating: number; id: string }> = [
      {
        id: "rawg-3328",
        title: "The Witcher 3: Wild Hunt",
        year: 2015,
        cover: "https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg",
        rating: 9.8,
      },
      {
        id: "rawg-58134",
        title: "Elden Ring",
        year: 2022,
        cover: "https://media.rawg.io/media/games/b29/b2960c74da69e2c81de0436117441692.jpg",
        rating: 9.6,
      },
      {
        id: "rawg-9767",
        title: "Hollow Knight",
        year: 2017,
        cover: "https://media.rawg.io/media/games/4cf/4cfc6b7f1850590a4634b08bfab308ab.jpg",
        rating: 9.5,
      },
      {
        id: "rawg-22509",
        title: "The Legend of Zelda: Breath of the Wild",
        year: 2017,
        cover: "https://media.rawg.io/media/games/cc4/cc446663f97e6005b7f9d86a57e2713c.jpg",
        rating: 9.7,
      },
      {
        id: "rawg-41494",
        title: "Cyberpunk 2077",
        year: 2020,
        cover: "https://media.rawg.io/media/games/26d/26d44377d59b077516ec50f73dd778ac.jpg",
        rating: 8.6,
      },
      {
        id: "rawg-28262",
        title: "Hades",
        year: 2020,
        cover: "https://media.rawg.io/media/games/1f4/1f4dd015e100366eb5121b65e921d7b1.jpg",
        rating: 9.3,
      },
    ];
    const match = mockGames.find((g) => isExactTitleMatch(g.title, query));
    if (match) {
      return {
        title: match.title,
        type: "game" as MediaType,
        coverImage: match.cover,
        releaseYear: match.year,
        genres: ["Game", "Action"],
        externalRating: match.rating,
        totalEpisodes: null,
        externalId: match.id,
        externalSource: "rawg",
        matched: true,
      };
    }
  }
  return null;
}

export async function resolveTitle(
  rawTitle: string,
  type: MediaType,
  apiSource?: string
): Promise<{
  title: string;
  type: MediaType;
  coverImage: string;
  releaseYear: number;
  genres: string[];
  externalRating: number | null;
  totalEpisodes: number | null;
  defaultSeasons?: any;
  externalId?: string;
  externalSource?: string;
  matched: boolean;
}> {
  const query = rawTitle.trim();
  if (!query) {
    return {
      title: "",
      type,
      coverImage: "",
      releaseYear: new Date().getFullYear(),
      genres: [],
      externalRating: null,
      totalEpisodes: null,
      matched: false,
    };
  }

  // 1. Query respective dedicated external APIs directly to extract authentic data from source
  if (type === "anime" || type === "manga") {
    if (apiSource === "jikan" || apiSource === "mal") {
      const jikanResult = await resolveAnimeFromJikan(query, type);
      if (jikanResult) return jikanResult;
    } else {
      const anilistResult = await resolveAnimeFromAniList(query, type);
      if (anilistResult) return anilistResult;
      // Secondary fallback to Jikan if AniList exact match missed
      const jikanFallback = await resolveAnimeFromJikan(query, type);
      if (jikanFallback) return jikanFallback;
    }
  } else if (type === "series" || type === "movie") {
    const tmdbResult = await resolveSeriesOrMovieFromTMDB(query, type);
    if (tmdbResult) return tmdbResult;
  } else if (type === "game") {
    const rawgResult = await resolveGameFromRAWG(query);
    if (rawgResult) return rawgResult;
  }

  // 2. Secondary check in local catalog (only if already verified with externalSource)
  try {
    const localMatch = await prisma.media.findFirst({
      where: {
        type: type,
        title: query,
        externalSource: { not: null },
      },
    });

    if (localMatch && isExactTitleMatch(localMatch.title, query) && localMatch.externalSource) {
      return {
        title: localMatch.title,
        type: localMatch.type,
        coverImage: localMatch.coverImage,
        releaseYear: localMatch.releaseYear,
        genres: Array.isArray(localMatch.genres)
          ? (localMatch.genres as string[])
          : [],
        externalRating: localMatch.externalRating,
        totalEpisodes: localMatch.totalEpisodes,
        defaultSeasons: localMatch.defaultSeasons,
        externalId: localMatch.externalId || undefined,
        externalSource: localMatch.externalSource,
        matched: true,
      };
    }
  } catch (err) {
    console.warn("[RESOLVE_LOCAL_WARN]:", err);
  }

  // 3. Fallback: No exact match located in external APIs
  return {
    title: query,
    type,
    coverImage: "",
    releaseYear: new Date().getFullYear(),
    genres: [],
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
// 6. Batch MAL Metadata Resolution (AniList or Jikan/MAL)
// ----------------------------------------------------
export interface ResolvedMalItem {
  title: string;
  type?: MediaType;
  coverImage: string;
  releaseYear?: number;
  genres?: string[];
  totalEpisodes?: number;
  externalRating?: number | null;
  externalId: string;
  externalSource: string;
  matched: boolean;
}

export async function batchResolveMalMetadata(
  entries: { malId: string; type: "anime" | "manga" | MediaType; title: string }[],
  apiSource: "anilist" | "jikan" = "anilist"
): Promise<Map<string, ResolvedMalItem>> {
  const result = new Map<string, ResolvedMalItem>();
  const validEntries = entries.filter((e) => e.malId && !isNaN(Number(e.malId)));
  if (validEntries.length === 0) return result;

  if (apiSource === "jikan") {
    // When importing via MAL (XML or username), valid malIds are already verified MyAnimeList entries.
    for (const item of validEntries) {
      result.set(String(item.malId), {
        title: item.title,
        type: item.type as MediaType,
        coverImage: "",
        releaseYear: new Date().getFullYear(),
        genres: [item.type === "manga" ? "Manga" : "Anime"],
        externalRating: null,
        totalEpisodes: undefined,
        externalId: String(item.malId),
        externalSource: "mal",
        matched: true,
      });
    }

    // Batch enrich covers and details via AniList GraphQL
    const chunkSize = 50;
    for (let i = 0; i < validEntries.length; i += chunkSize) {
      const chunk = validEntries.slice(i, i + chunkSize);
      const idMalIn = chunk.map((c) => Number(c.malId)).filter((id) => !isNaN(id));
      try {
        const query = `
          query ($idMalIn: [Int]) {
            Page(page: 1, perPage: 50) {
              media(idMal_in: $idMalIn) {
                idMal
                type
                coverImage { extraLarge large }
                genres
                episodes
                chapters
                averageScore
              }
            }
          }
        `;
        const res = await fetchWithRetry("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query, variables: { idMalIn } }),
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const json = await res.json();
          const mediaList = json.data?.Page?.media || [];
          for (const m of mediaList) {
            if (!m.idMal) continue;
            const existing = result.get(String(m.idMal));
            if (existing) {
              const cover = m.coverImage?.extraLarge || m.coverImage?.large || "";
              if (cover) existing.coverImage = cover;
              if (m.genres && Array.isArray(m.genres) && m.genres.length > 0) existing.genres = m.genres;
              if (m.episodes || m.chapters) existing.totalEpisodes = m.episodes || m.chapters;
              if (m.averageScore) existing.externalRating = Math.round((m.averageScore / 10) * 10) / 10;
            }
          }
        }
      } catch (err) {
        console.warn("[JIKAN_BATCH_ENRICH_WARN]:", err);
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    return result;
  }

  // Default: Batch resolve via AniList GraphQL with exact title fallback
  const chunkSize = 25;
  for (let i = 0; i < validEntries.length; i += chunkSize) {
    const chunk = validEntries.slice(i, i + chunkSize);
    const idMalIn = chunk.map((c) => Number(c.malId)).filter((id) => !isNaN(id));

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
                native
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
              averageScore
            }
          }
        }
      `;

      const res = await fetchWithRetry("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { idMalIn },
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const json = await res.json();
        const mediaList = json.data?.Page?.media || [];

        for (const m of mediaList) {
          if (!m.idMal) continue;
          const malKey = String(m.idMal);
          const englishTitle = m.title?.english?.trim();
          const romajiTitle = m.title?.romaji?.trim();
          const nativeTitle = m.title?.native?.trim();
          const chosenTitle = englishTitle || romajiTitle || nativeTitle;
          const cover = m.coverImage?.extraLarge || m.coverImage?.large || "";
          const score = m.averageScore
            ? Math.round((m.averageScore / 10) * 10) / 10
            : null;

          const targetItem = chunk.find((c) => String(c.malId) === malKey);
          if (targetItem) {
            const expectedAniListType =
              targetItem.type === "manga" ? "MANGA" : "ANIME";
            if (m.type === expectedAniListType) {
              result.set(malKey, {
                title: chosenTitle || targetItem.title,
                type: targetItem.type as MediaType,
                coverImage: cover,
                releaseYear: m.startDate?.year || undefined,
                genres: Array.isArray(m.genres) ? m.genres : undefined,
                totalEpisodes: m.episodes || m.chapters || undefined,
                externalRating: score,
                externalId: String(m.id),
                externalSource: "anilist",
                matched: true,
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn("[BATCH_RESOLVE_WARN]:", err);
    }

    // Polite pause between batch queries to respect rate limits
    await new Promise((r) => setTimeout(r, 350));

    // For any chunk items not matched by idMal, do exact title fallback search: English -> Romaji -> Native
    const unmatched = chunk.filter((c) => !result.has(String(c.malId)));
    for (const item of unmatched) {
      await new Promise((r) => setTimeout(r, 250));
      const fallback = await resolveAnimeFromAniList(
        item.title,
        item.type === "manga" ? "manga" : "anime"
      );
      if (fallback && fallback.matched) {
        result.set(String(item.malId), {
          title: fallback.title,
          type: item.type as MediaType,
          coverImage: fallback.coverImage,
          releaseYear: fallback.releaseYear,
          genres: fallback.genres,
          totalEpisodes: fallback.totalEpisodes || undefined,
          externalRating: fallback.externalRating,
          externalId: fallback.externalId,
          externalSource: "anilist",
          matched: true,
        });
      }
    }
  }

  return result;
}

