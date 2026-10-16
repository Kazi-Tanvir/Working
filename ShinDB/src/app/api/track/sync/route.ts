// src/app/api/track/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncEntryMetadata } from "@/utils/syncHelpers";
import { MediaType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, type, mode = "airing" } = body;

    // 1. Sync specific item if ID provided
    if (id) {
      try {
        const result = await syncEntryMetadata(id);
        return NextResponse.json({
          success: true,
          ...result,
        });
      } catch (err: any) {
        if (err.message === "Media entry not found") {
          return NextResponse.json({ success: false, error: "Media entry not found" }, { status: 404 });
        }
        throw err;
      }
    }

    // 2. Batch sync entries (airing/unknown or all entries in category)
    const filterType =
      type && ["anime", "manga", "series", "movie", "game"].includes(type) ? (type as MediaType) : undefined;

    const isAllMode = mode === "all";

    const entriesToSync = await prisma.media.findMany({
      where: {
        ...(filterType && { type: filterType }),
        ...(!isAllMode && { totalEpisodes: null }),
      },
      select: { id: true, title: true, type: true },
      take: isAllMode ? 50 : 25,
    });

    const results = [];
    for (const item of entriesToSync) {
      try {
        const res = await syncEntryMetadata(item.id);
        if (res.updated) {
          results.push({ id: item.id, title: item.title, newTotal: res.newTotal });
        }
      } catch (err: any) {
        console.warn(`[SYNC] Failed to sync ${item.title}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      mode: isAllMode ? "all" : "airing",
      checkedCount: entriesToSync.length,
      updatedCount: results.length,
      updatedItems: results,
      message:
        results.length > 0
          ? `Successfully synchronized ${results.length} item(s) from external databases.`
          : isAllMode
          ? `Checked all ${entriesToSync.length} entries: metadata is up to date.`
          : "Checked airing entries: all announced counts are up to date.",
    });
  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync metadata" },
      { status: 500 }
    );
  }
}
