import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { logAuditEvent } from "@/lib/admin";
import {
  findOrCreateMedia,
  mapExternalScore,
  mapExternalStatus,
  upsertUserMediaEntry,
  batchResolveMalMetadata,
} from "@/lib/import";
import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";

interface MALEntryItem {
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
}

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
    malUsername,
    importTypes = ["anime", "manga"],
    overwriteExisting = false,
    preview = false,
  } = body;

  if (!malUsername || typeof malUsername !== "string" || !malUsername.trim()) {
    return NextResponse.json(
      { error: "MyAnimeList username is required" },
      { status: 400 }
    );
  }

  const cleanUsername = malUsername.trim();
  const clientId = process.env.MAL_CLIENT_ID;

  const collectedEntries: MALEntryItem[] = [];

  for (const t of importTypes) {
    if (t !== "anime" && t !== "manga") continue;

    try {
      if (clientId && clientId.trim().length > 0) {
        // Official MAL REST API v2
        const endpoint = `https://api.myanimelist.net/v2/users/${encodeURIComponent(
          cleanUsername
        )}/${t}list?fields=list_status{status,score,num_episodes_watched,num_chapters_read,is_rewatching,num_times_rewatched,comments},num_episodes,num_chapters,start_date,genres,main_picture&limit=1000&nsfw=true`;

        const res = await fetch(endpoint, {
          headers: {
            "X-MAL-CLIENT-ID": clientId.trim(),
          },
          signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) {
          if (res.status === 404) {
            return NextResponse.json(
              { error: `MyAnimeList user "${cleanUsername}" was not found.` },
              { status: 404 }
            );
          }
          if (res.status === 403) {
            return NextResponse.json(
              { error: `The MyAnimeList list for "${cleanUsername}" is private.` },
              { status: 403 }
            );
          }
          throw new Error(`MAL API responded with HTTP status ${res.status}`);
        }

        const json = await res.json();
        const dataList = json.data || [];

        for (const item of dataList) {
          const node = item.node;
          const listStatus = item.list_status || {};
          if (!node) continue;

          const title = node.title || "Unknown MAL Title";
          const score = mapExternalScore(listStatus.score, 10);
          const rawStatus = listStatus.status || "plan_to_watch";
          const mappedStatus = mapExternalStatus(rawStatus, t);

          const progress =
            t === "anime"
              ? Number(listStatus.num_episodes_watched) || 0
              : Number(listStatus.num_chapters_read) || 0;

          const releaseYear = node.start_date
            ? parseInt(node.start_date.split("-")[0], 10)
            : new Date().getFullYear();

          const genres = Array.isArray(node.genres)
            ? node.genres.map((g: any) => g.name)
            : [t === "anime" ? "Anime" : "Manga"];

          collectedEntries.push({
            title,
            type: t as MediaType,
            status: mappedStatus,
            score,
            progress,
            repeat: Number(listStatus.num_times_rewatched) || 0,
            notes: listStatus.comments || undefined,
            coverImage: node.main_picture?.large || node.main_picture?.medium || "",
            releaseYear: isNaN(releaseYear) ? new Date().getFullYear() : releaseYear,
            genres,
            totalEpisodes: node.num_episodes || node.num_chapters || null,
            externalId: String(node.id),
            externalRating: score,
          });
        }
      } else {
        // Fallback: Public Jikan API v4 (no client ID needed)
        const jikanEndpoint = `https://api.jikan.moe/v4/users/${encodeURIComponent(
          cleanUsername
        )}/userlist/${t}?limit=1000`;

        const res = await fetch(jikanEndpoint, {
          signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) {
          if (res.status === 404) {
            return NextResponse.json(
              { error: `MyAnimeList user "${cleanUsername}" was not found.` },
              { status: 404 }
            );
          }
          throw new Error(
            `Could not access public MAL list (Status ${res.status}). Provide a MAL_CLIENT_ID in settings or try again.`
          );
        }

        const json = await res.json();
        const dataList = json.data || [];

        for (const item of dataList) {
          const entry = item.entry || {};
          const title = entry.title || "Unknown Title";
          const score = mapExternalScore(item.score, 10);
          const rawStatus = item.status || "plan_to_watch";
          const mappedStatus = mapExternalStatus(rawStatus, t);

          const progress =
            t === "anime"
              ? Number(item.episodes_watched) || 0
              : Number(item.chapters_read) || 0;

          collectedEntries.push({
            title,
            type: t as MediaType,
            status: mappedStatus,
            score,
            progress,
            repeat: 0,
            notes: item.comments || undefined,
            coverImage:
              entry.images?.webp?.large_image_url ||
              entry.images?.jpg?.large_image_url ||
              "",
            releaseYear: new Date().getFullYear(),
            genres: [t === "anime" ? "Anime" : "Manga"],
            totalEpisodes: null,
            externalId: String(entry.mal_id || ""),
            externalRating: score,
          });
        }
      }
    } catch (err: any) {
      console.error(`[MAL_FETCH_ERROR] for ${t}:`, err);
      return NextResponse.json(
        {
          error: `Failed to fetch MAL list for @${cleanUsername}: ${
            err.message || "Network timeout"
          }`,
        },
        { status: 502 }
      );
    }
  }

  // PREVIEW MODE
  if (preview) {
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

  // LIVE STREAMING IMPORT
  const encoder = new TextEncoder();
  const total = collectedEntries.length;

  const stream = new ReadableStream({
    async start(controller) {
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      let failed = 0;

      // Pre-resolve metadata in batches to acquire English titles and high-res covers
      let metadataMap = new Map();
      try {
        metadataMap = await batchResolveMalMetadata(
          collectedEntries.map((e) => ({ malId: e.externalId, type: e.type, title: e.title }))
        );
      } catch (err) {
        console.warn("[MAL_API_METADATA_BATCH_WARN]:", err);
      }

      for (let i = 0; i < total; i++) {
        const item = collectedEntries[i];
        const resolved = metadataMap.get(item.externalId);
        const finalTitle = resolved?.title || item.title;
        const finalCover = item.coverImage || resolved?.coverImage || "";
        const finalYear = resolved?.releaseYear || item.releaseYear;
        const finalGenres = resolved?.genres || item.genres;
        const finalEpisodes = resolved?.totalEpisodes || item.totalEpisodes;

        try {
          const media = await findOrCreateMedia({
            title: finalTitle,
            type: item.type,
            coverImage: finalCover,
            releaseYear: finalYear,
            genres: finalGenres,
            totalEpisodes: finalEpisodes,
            externalId: item.externalId,
            externalSource: "mal",
            externalRating: item.externalRating,
          });

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
        action: "import.mal",
        target: `mal:@${cleanUsername}`,
        details: {
          total,
          imported,
          updated,
          skipped,
          failed,
        },
      });

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
