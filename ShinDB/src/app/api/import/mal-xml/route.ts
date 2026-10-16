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
import { MediaType } from "@prisma/client";

// -------------------------------------------------------
// MAL XML Export Parser
// MAL exports two types: type 1 = animelist, type 2 = mangalist
// Both use the same structure, just <anime> vs <manga> tags.
// -------------------------------------------------------

interface ParsedMALEntry {
  title: string;
  type: "anime" | "manga";
  malId: string;
  status: string;
  score: number | null;
  progress: number;
  totalEpisodes: number | null;
  rewatchCount: number;
  notes: string | undefined;
}

function parseMALXml(xmlText: string): {
  entries: ParsedMALEntry[];
  exportType: number;
  username: string;
  error?: string;
} {
  try {
    // Extract <myinfo> metadata
    const usernameMatch = xmlText.match(/<user_name>([^<]*)<\/user_name>/);
    const exportTypeMatch = xmlText.match(/<user_export_type>(\d+)<\/user_export_type>/);
    const username = usernameMatch?.[1]?.trim() || "unknown";
    const exportType = exportTypeMatch ? parseInt(exportTypeMatch[1], 10) : 1;
    const tagName = exportType === 2 ? "manga" : "anime";
    const mediaType: "anime" | "manga" = exportType === 2 ? "manga" : "anime";

    const entries: ParsedMALEntry[] = [];

    // Match each <anime>…</anime> or <manga>…</manga> block
    const blockRegex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "gi");
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(xmlText)) !== null) {
      const block = match[1];

      const getText = (tag: string): string => {
        const m = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "s"));
        return m?.[1]?.trim() ?? "";
      };

      const title = getText(mediaType === "anime" ? "series_title" : "manga_title");
      const malId = getText("series_animedb_id") || getText("manga_animedb_id");
      const rawStatus = getText("my_status");
      const score = parseFloat(getText("my_score")) || 0;
      const progress = mediaType === "anime"
        ? parseInt(getText("my_watched_episodes"), 10) || 0
        : parseInt(getText("my_read_chapters"), 10) || 0;
      const totalEpsRaw = parseInt(getText("series_episodes") || getText("series_chapters"), 10);
      const totalEpisodes = isNaN(totalEpsRaw) || totalEpsRaw === 0 ? null : totalEpsRaw;
      const rewatchCount = parseInt(getText("my_times_watched") || getText("my_times_read"), 10) || 0;
      const notes = getText("my_comments") || undefined;

      if (!title) continue;

      entries.push({
        title,
        type: mediaType,
        malId,
        status: rawStatus,
        score: score > 0 ? score : null,
        progress,
        totalEpisodes,
        rewatchCount,
        notes: notes || undefined,
      });
    }

    return { entries, exportType, username };
  } catch (err: any) {
    return { entries: [], exportType: 1, username: "", error: err.message };
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to import MAL XML" },
      { status: 401 }
    );
  }

  let xmlText: string;
  let overwriteExisting = false;
  let preview = false;

  // Accept multipart/form-data (file upload)
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
      }
      if (!file.name.endsWith(".xml") && file.type !== "text/xml" && file.type !== "application/xml") {
        return NextResponse.json(
          { error: "File must be a .xml MAL export file" },
          { status: 400 }
        );
      }
      xmlText = await file.text();
      overwriteExisting = formData.get("overwriteExisting") === "true";
      preview = formData.get("preview") === "true";
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to read uploaded file: ${err.message}` }, { status: 400 });
    }
  } else {
    // Accept JSON body with base64 or raw XML
    try {
      const body = await request.json();
      xmlText = body.xmlContent;
      overwriteExisting = body.overwriteExisting ?? false;
      preview = body.preview ?? false;
      if (!xmlText) {
        return NextResponse.json({ error: "xmlContent is required" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
  }

  // Parse XML
  const { entries, exportType, username, error: parseError } = parseMALXml(xmlText);

  if (parseError) {
    return NextResponse.json({ error: `XML parse error: ${parseError}` }, { status: 400 });
  }

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "No valid anime/manga entries found in this XML file. Make sure it's a valid MAL export." },
      { status: 400 }
    );
  }

  const mediaType = exportType === 2 ? "manga" : "anime";

  // PREVIEW MODE
  if (preview) {
    return NextResponse.json({
      preview: true,
      username,
      exportType,
      mediaType,
      totalEntries: entries.length,
      animeCount: entries.filter((e) => e.type === "anime").length,
      mangaCount: entries.filter((e) => e.type === "manga").length,
      statusBreakdown: {
        watching: entries.filter((e) => e.status === "Watching" || e.status === "Reading").length,
        completed: entries.filter((e) => e.status === "Completed").length,
        onHold: entries.filter((e) => e.status === "On-Hold").length,
        dropped: entries.filter((e) => e.status === "Dropped").length,
        planToWatch: entries.filter((e) => e.status === "Plan to Watch" || e.status === "Plan to Read").length,
      },
      sample: await (async () => {
        const topSample = entries.slice(0, 12);
        try {
          const sampleMap = await batchResolveMalMetadata(topSample);
          return topSample.map((e) => {
            const resolved = sampleMap.get(e.malId);
            return {
              title: resolved?.title || e.title,
              type: e.type,
              status: e.status,
              score: e.score,
              progress: e.progress,
              totalEpisodes: resolved?.totalEpisodes || e.totalEpisodes,
              coverImage: resolved?.coverImage || "",
            };
          });
        } catch {
          return topSample.map((e) => ({
            title: e.title,
            type: e.type,
            status: e.status,
            score: e.score,
            progress: e.progress,
            totalEpisodes: e.totalEpisodes,
          }));
        }
      })(),
    });
  }

  // STREAMING IMPORT
  const encoder = new TextEncoder();
  const total = entries.length;

  const stream = new ReadableStream({
    async start(controller) {
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      let failed = 0;

      // Pre-resolve all entries in batches via AniList to acquire English titles and actual cover images
      let metadataMap = new Map();
      try {
        metadataMap = await batchResolveMalMetadata(entries);
      } catch (err) {
        console.warn("[MAL_XML_METADATA_BATCH_WARN]:", err);
      }

      for (let i = 0; i < total; i++) {
        const item = entries[i];
        const resolved = metadataMap.get(item.malId);
        const finalTitle = resolved?.title || item.title;
        const finalCover = resolved?.coverImage || "";
        const finalYear = resolved?.releaseYear || new Date().getFullYear();
        const finalGenres = resolved?.genres || [mediaType === "anime" ? "Anime" : "Manga"];
        const finalEpisodes = resolved?.totalEpisodes || item.totalEpisodes;

        try {
          const mappedStatus = mapExternalStatus(item.status, mediaType as "anime" | "manga");
          const mappedScore = item.score !== null ? mapExternalScore(item.score, 10) : null;

          const media = await findOrCreateMedia({
            title: finalTitle,
            type: item.type as MediaType,
            coverImage: finalCover,
            releaseYear: finalYear,
            genres: finalGenres,
            totalEpisodes: finalEpisodes,
            externalId: item.malId || undefined,
            externalSource: "mal",
            externalRating: mappedScore,
          });

          const action = await upsertUserMediaEntry({
            userId: user.id,
            mediaId: media.id,
            status: mappedStatus,
            progressCurrent: item.progress,
            rating: mappedScore,
            notes: item.notes,
            overwrite: overwriteExisting,
            rewatchCount: item.rewatchCount,
          });

          if (action === "imported") imported++;
          else if (action === "updated") updated++;
          else if (action === "skipped") skipped++;

          const chunk =
            JSON.stringify({
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
          const errChunk =
            JSON.stringify({
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
        action: "import.mal_xml",
        target: `mal_xml:@${username}`,
        details: { total, imported, updated, skipped, failed, exportType },
      });

      const completeChunk =
        JSON.stringify({
          type: "complete",
          summary: { total, imported, updated, skipped, failed },
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
