import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { logAuditEvent } from "@/lib/admin";
import {
  findOrCreateMedia,
  mapExternalScore,
  mapExternalStatus,
  upsertUserMediaEntry,
} from "@/lib/import";
import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";

const ANILIST_USER_QUERY = `
  query ($username: String, $type: MediaType) {
    MediaListCollection(userName: $username, type: $type) {
      lists {
        name
        status
        entries {
          status
          score(format: POINT_100)
          progress
          repeat
          notes
          media {
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
            meanScore
          }
        }
      }
    }
  }
`;

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to import media lists" },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    anilistUsername,
    importTypes = ["anime", "manga"],
    overwriteExisting = false,
    preview = false,
  } = body;

  if (!anilistUsername || typeof anilistUsername !== "string" || !anilistUsername.trim()) {
    return NextResponse.json(
      { error: "AniList username is required" },
      { status: 400 }
    );
  }

  const cleanUsername = anilistUsername.trim();

  // Fetch from AniList for both requested types
  const collectedEntries: Array<{
    title: string;
    type: MediaType;
    status: any;
    score: number | null;
    progress: number;
    repeat: number;
    notes?: string;
    coverImage: string;
    releaseYear: number;
    genres: string[];
    totalEpisodes: number | null;
    externalId: string;
    externalRating: number | null;
  }> = [];

  for (const t of importTypes) {
    if (t !== "anime" && t !== "manga") continue;
    const mediaTypeEnum = t === "anime" ? "ANIME" : "MANGA";

    try {
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: ANILIST_USER_QUERY,
          variables: {
            username: cleanUsername,
            type: mediaTypeEnum,
          },
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        if (res.status === 404) {
          return NextResponse.json(
            { error: `AniList user "${cleanUsername}" was not found.` },
            { status: 404 }
          );
        }
        throw new Error(`AniList returned status ${res.status}`);
      }

      const json = await res.json();
      const lists = json.data?.MediaListCollection?.lists || [];

      for (const list of lists) {
        for (const entry of list.entries || []) {
          if (!entry.media) continue;

          const title =
            entry.media.title?.english ||
            entry.media.title?.romaji ||
            "Unknown AniList Entry";

          const externalScore = mapExternalScore(entry.score, 100);
          const mappedStatus = mapExternalStatus(entry.status, t);

          collectedEntries.push({
            title,
            type: t as MediaType,
            status: mappedStatus,
            score: externalScore,
            progress: Number(entry.progress) || 0,
            repeat: Number(entry.repeat) || 0,
            notes: entry.notes || undefined,
            coverImage: entry.media.coverImage?.large || "",
            releaseYear: entry.media.startDate?.year || new Date().getFullYear(),
            genres: entry.media.genres || [t === "anime" ? "Anime" : "Manga"],
            totalEpisodes: entry.media.episodes || entry.media.chapters || null,
            externalId: String(entry.media.id),
            externalRating: entry.media.meanScore
              ? Math.round((entry.media.meanScore / 10) * 10) / 10
              : null,
          });
        }
      }
    } catch (err: any) {
      console.error(`[ANILIST_FETCH_ERROR] for ${t}:`, err);
      return NextResponse.json(
        {
          error: `Failed to query AniList collection for @${cleanUsername}: ${
            err.message || "Network timeout"
          }`,
        },
        { status: 502 }
      );
    }
  }

  // If PREVIEW MODE: return preview summary without writing to DB
  if (preview) {
    // Check how many already exist in user library
    const existingUserEntries = await prisma.userMediaEntry.findMany({
      where: { userId: user.id },
      include: {
        media: {
          select: { title: true, type: true, externalId: true },
        },
      },
    });

    const userTrackedKeys = new Set(
      existingUserEntries.map(
        (e) => `${e.media.type}:${e.media.title.toLowerCase()}`
      )
    );

    let alreadyTracked = 0;
    for (const item of collectedEntries) {
      const key = `${item.type}:${item.title.toLowerCase()}`;
      if (userTrackedKeys.has(key)) {
        alreadyTracked++;
      }
    }

    return NextResponse.json({
      preview: true,
      username: cleanUsername,
      totalEntries: collectedEntries.length,
      animeCount: collectedEntries.filter((e) => e.type === "anime").length,
      mangaCount: collectedEntries.filter((e) => e.type === "manga").length,
      alreadyTracked,
      newEntries: collectedEntries.length - alreadyTracked,
      sample: collectedEntries.slice(0, 10).map((e) => ({
        title: e.title,
        type: e.type,
        status: e.status,
        score: e.score,
        progress: e.progress,
        coverImage: e.coverImage,
      })),
    });
  }

  // LIVE IMPORT: Stream progress
  const encoder = new TextEncoder();
  const total = collectedEntries.length;

  const stream = new ReadableStream({
    async start(controller) {
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      let failed = 0;

      for (let i = 0; i < total; i++) {
        const item = collectedEntries[i];
        try {
          // 1. Find or create master catalog record
          const media = await findOrCreateMedia({
            title: item.title,
            type: item.type,
            coverImage: item.coverImage,
            releaseYear: item.releaseYear,
            genres: item.genres,
            totalEpisodes: item.totalEpisodes,
            externalId: item.externalId,
            externalSource: "anilist",
            externalRating: item.externalRating,
          });

          // 2. Upsert user media tracking entry
          const action = await upsertUserMediaEntry({
            userId: user.id,
            mediaId: media.id,
            status: item.status,
            progressCurrent: item.progress,
            rating: item.score,
            notes: item.notes,
            overwrite: overwriteExisting,
            rewatchCount: item.repeat,
          });

          if (action === "imported") imported++;
          else if (action === "updated") updated++;
          else if (action === "skipped") skipped++;

          // Send NDJSON stream chunk
          const chunk = JSON.stringify({
            type: "progress",
            current: i + 1,
            total,
            percentage: Math.round(((i + 1) / total) * 100),
            item: {
              title: item.title,
              type: item.type,
              action,
            },
          }) + "\n";
          controller.enqueue(encoder.encode(chunk));
        } catch (err: any) {
          failed++;
          const errChunk = JSON.stringify({
            type: "progress",
            current: i + 1,
            total,
            percentage: Math.round(((i + 1) / total) * 100),
            item: {
              title: item.title,
              type: item.type,
              action: "failed",
              error: err.message,
            },
          }) + "\n";
          controller.enqueue(encoder.encode(errChunk));
        }
      }

      await logAuditEvent({
        userId: user.id,
        action: "import.anilist",
        target: `anilist:@${cleanUsername}`,
        details: {
          total,
          imported,
          updated,
          skipped,
          failed,
        },
      });

      // Send complete message
      const completeChunk = JSON.stringify({
        type: "complete",
        summary: {
          total,
          imported,
          updated,
          skipped,
          failed,
        },
      }) + "\n";
      controller.enqueue(encoder.encode(completeChunk));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
