// src/utils/syncHelpers.ts
import https from "https";
import { prisma } from "@/lib/prisma";

const agent = new https.Agent({ keepAlive: false });

export interface ExternalMetadata {
  totalEpisodes?: number | null;
  totalChapters?: number | null;
  status?: string | null;
  releaseYear?: number | null;
  source: string;
}

function fetchJsonWithRetry(url: string, retries = 2): Promise<any> {
  return new Promise((resolve, reject) => {
    const attempt = (remaining: number) => {
      const req = https.get(
        url,
        {
          agent,
          headers: {
            "User-Agent": "ShinDB-Tracker/1.0 (Mozilla/5.0)",
            Accept: "application/json, application/vnd.api+json",
          },
          timeout: 6000,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e: any) {
              reject(new Error("Failed to parse JSON response: " + e.message));
            }
          });
        }
      );
      req.on("error", (err) => {
        if (remaining > 0) {
          setTimeout(() => attempt(remaining - 1), 600);
        } else {
          reject(err);
        }
      });
      req.on("timeout", () => {
        req.destroy();
        if (remaining > 0) {
          setTimeout(() => attempt(remaining - 1), 600);
        } else {
          reject(new Error("Request timed out"));
        }
      });
    };
    attempt(retries);
  });
}

/**
 * Fetch latest metadata for Anime from Kitsu API
 */
export async function fetchAnimeMetadata(title: string): Promise<ExternalMetadata | null> {
  const titlesToTry = [
    title,
    title.split(/ - /)[0].trim(),
    title.replace(/Season \d+/i, "").replace(/Part \d+/i, "").trim(),
    title.split(/[:\-–—]/)[0].trim(),
  ].filter((t, idx, arr) => t && arr.indexOf(t) === idx);

  for (const q of titlesToTry) {
    try {
      const data = await fetchJsonWithRetry(
        `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(q)}&page[limit]=3`
      );

      if (data?.data && data.data.length > 0) {
        const item = data.data[0];
        const attrs = item.attributes;
        const totalEpisodes = attrs.episodeCount || null;
        const status = attrs.status; // "finished", "current", "tba"
        const releaseYear = attrs.startDate ? parseInt(attrs.startDate.split("-")[0], 10) : null;

        if (totalEpisodes || releaseYear) {
          return {
            totalEpisodes,
            status,
            releaseYear,
            source: "kitsu",
          };
        }
      }
    } catch (err: any) {
      console.warn(`[SYNC] Kitsu lookup failed for "${q}":`, err.message);
    }
  }

  return null;
}

/**
 * Fetch latest metadata for Manga from Kitsu API
 */
export async function fetchMangaMetadata(title: string): Promise<ExternalMetadata | null> {
  const titlesToTry = [
    title,
    title.replace(/Season \d+/i, "").trim(),
    title.split(/[:\-–—]/)[0].trim(),
  ].filter((t, idx, arr) => t && arr.indexOf(t) === idx);

  for (const q of titlesToTry) {
    try {
      const data = await fetchJsonWithRetry(
        `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(q)}&page[limit]=2`
      );

      if (data?.data && data.data.length > 0) {
        const item = data.data[0];
        const attrs = item.attributes;
        const totalChapters = attrs.chapterCount || null;
        const status = attrs.status;
        const releaseYear = attrs.startDate ? parseInt(attrs.startDate.split("-")[0], 10) : null;

        if (totalChapters || releaseYear) {
          return {
            totalChapters,
            status,
            releaseYear,
            source: "kitsu",
          };
        }
      }
    } catch (err: any) {
      console.warn(`[SYNC] Kitsu manga lookup failed for "${q}":`, err.message);
    }
  }

  return null;
}

/**
 * Fetch latest metadata for TV Series from TVmaze API
 */
export async function fetchSeriesMetadata(title: string): Promise<ExternalMetadata | null> {
  const titlesToTry = [
    title,
    title.replace(/Season \d+/i, "").trim(),
    title.split(/[:\-–—]/)[0].trim(),
  ].filter((t, idx, arr) => t && arr.indexOf(t) === idx);

  for (const q of titlesToTry) {
    try {
      const data = await fetchJsonWithRetry(
        `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(q)}&embed=episodes`
      );

      if (data && (data.name || data.id)) {
        const totalEpisodes = data._embedded?.episodes?.length || null;
        const status = data.status; // "Ended", "Running"
        const releaseYear = data.premiered ? parseInt(data.premiered.split("-")[0], 10) : null;

        if (totalEpisodes || releaseYear) {
          return {
            totalEpisodes,
            status,
            releaseYear,
            source: "tvmaze",
          };
        }
      }
    } catch (err: any) {
      console.warn(`[SYNC] TVmaze series lookup failed for "${q}":`, err.message);
    }
  }

  return null;
}

/**
 * Sync an individual media entry from external APIs and update the database.
 */
export async function syncEntryMetadata(id: string) {
  const entry = await prisma.mediaEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    throw new Error("Media entry not found");
  }

  let externalData: ExternalMetadata | null = null;

  if (entry.type === "anime") {
    externalData = await fetchAnimeMetadata(entry.title);
  } else if (entry.type === "manga") {
    externalData = await fetchMangaMetadata(entry.title);
  } else if (entry.type === "series") {
    externalData = await fetchSeriesMetadata(entry.title);
  }

  if (!externalData) {
    return {
      updated: false,
      message: "No updated metadata found from external databases.",
      entry,
    };
  }

  // Determine what has changed
  const updates: any = {};
  let changed = false;

  if ((entry.type === "anime" || entry.type === "series") && externalData.totalEpisodes) {
    if (entry.progressTotal !== externalData.totalEpisodes) {
      updates.progressTotal = externalData.totalEpisodes;
      changed = true;
    }
  }

  if (entry.type === "manga" && externalData.totalChapters) {
    if (entry.progressTotal !== externalData.totalChapters) {
      updates.progressTotal = externalData.totalChapters;
      changed = true;
    }
  }

  if (externalData.releaseYear && (entry.releaseYear === 2026 || !entry.releaseYear)) {
    if (entry.releaseYear !== externalData.releaseYear) {
      updates.releaseYear = externalData.releaseYear;
      changed = true;
    }
  }

  if (changed) {
    const updated = await prisma.mediaEntry.update({
      where: { id },
      data: updates,
    });

    return {
      updated: true,
      message: `Updated total count to ${updates.progressTotal ?? entry.progressTotal} ${entry.progressUnit.toUpperCase()} from ${externalData.source.toUpperCase()}.`,
      entry: updated,
      newTotal: updates.progressTotal ?? entry.progressTotal,
    };
  }

  return {
    updated: false,
    message: "Record is already up-to-date with external database records.",
    entry,
  };
}
