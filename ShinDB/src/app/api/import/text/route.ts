import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { logAuditEvent } from "@/lib/admin";
import {
  findOrCreateMedia,
  parseTextList,
  resolveTitle,
  upsertUserMediaEntry,
} from "@/lib/import";
import { prisma } from "@/lib/prisma";
import { MediaStatus, MediaType } from "@prisma/client";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to import plain text lists" },
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
    titles: rawTitles,
    type = "anime",
    skipExisting = true,
    preview = false,
  } = body;

  const validTypes = ["anime", "manga", "game", "movie", "series"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid media format. Supported formats: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  const parsedTitles = parseTextList(rawTitles);
  if (parsedTitles.length === 0) {
    return NextResponse.json(
      { error: "No valid titles found. Enter at least one media title." },
      { status: 400 }
    );
  }

  const mediaType = type as MediaType;

  // PREVIEW MODE
  if (preview) {
    const existingEntries = await prisma.userMediaEntry.findMany({
      where: {
        userId: user.id,
        media: { type: mediaType },
      },
      include: {
        media: { select: { title: true } },
      },
    });

    const trackedTitleSet = new Set(
      existingEntries.map((e) => e.media.title.toLowerCase())
    );

    const previewResults: Array<{
      rawTitle: string;
      resolvedTitle: string;
      alreadyTracked: boolean;
      coverImage: string;
      matched: boolean;
    }> = [];

    // Preview up to the first 15 entries for speed
    const sampleTitles = parsedTitles.slice(0, 15);
    for (const raw of sampleTitles) {
      const resolved = await resolveTitle(raw, mediaType);
      const isTracked = trackedTitleSet.has(resolved.title.toLowerCase()) || trackedTitleSet.has(raw.toLowerCase());
      previewResults.push({
        rawTitle: raw,
        resolvedTitle: resolved.title,
        alreadyTracked: isTracked,
        coverImage: resolved.coverImage,
        matched: resolved.matched,
      });
    }

    return NextResponse.json({
      preview: true,
      totalParsed: parsedTitles.length,
      sample: previewResults,
    });
  }

  // LIVE STREAMING IMPORT
  const encoder = new TextEncoder();
  const total = parsedTitles.length;

  const stream = new ReadableStream({
    async start(controller) {
      let imported = 0;
      let skipped = 0;
      let failed = 0;

      for (let i = 0; i < total; i++) {
        const rawTitle = parsedTitles[i];
        try {
          // 1. Resolve title via local DB then external API
          const resolved = await resolveTitle(rawTitle, mediaType);

          // 2. Find or create master catalog record
          const media = await findOrCreateMedia({
            title: resolved.title,
            type: mediaType,
            coverImage: resolved.coverImage,
            releaseYear: resolved.releaseYear,
            genres: resolved.genres,
            totalEpisodes: resolved.totalEpisodes,
            externalRating: resolved.externalRating,
            externalId: resolved.externalId,
            externalSource: resolved.externalSource,
          });

          // 3. Upsert user media entry - ALWAYS plan_to_consume
          const action = await upsertUserMediaEntry({
            userId: user.id,
            mediaId: media.id,
            status: MediaStatus.plan_to_consume,
            progressCurrent: 0,
            rating: null,
            notes: "Imported from plain text list",
            overwrite: !skipExisting,
          });

          if (action === "imported" || action === "updated") {
            imported++;
          } else {
            skipped++;
          }

          // Small rate-limit delay between external searches if many items
          if (i > 0 && i % 5 === 0) {
            await new Promise((r) => setTimeout(r, 150));
          }

          const chunk = JSON.stringify({
            type: "progress",
            current: i + 1,
            total,
            percentage: Math.round(((i + 1) / total) * 100),
            item: {
              rawTitle,
              resolvedTitle: resolved.title,
              type: mediaType,
              action,
              matched: resolved.matched,
              coverImage: resolved.coverImage,
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
              rawTitle,
              type: mediaType,
              action: "failed",
              error: err.message,
            },
          }) + "\n";
          controller.enqueue(encoder.encode(errChunk));
        }
      }

      await logAuditEvent({
        userId: user.id,
        action: "import.text",
        target: `text_list:${mediaType}`,
        details: {
          total,
          imported,
          skipped,
          failed,
        },
      });

      const completeChunk = JSON.stringify({
        type: "complete",
        summary: {
          total,
          imported,
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
