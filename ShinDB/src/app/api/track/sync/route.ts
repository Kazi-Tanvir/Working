// src/app/api/track/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncEntryMetadata } from "@/utils/syncHelpers";
import { MediaType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, type } = body;

    // 1. Sync specific item if ID provided
    if (id) {
      const result = await syncEntryMetadata(id);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // 2. Batch sync entries where total is unknown (progressTotal === null)
    const filterType =
      type && ["anime", "manga", "series"].includes(type) ? (type as MediaType) : undefined;

    const entriesToSync = await prisma.mediaEntry.findMany({
      where: {
        ...(filterType && { type: filterType }),
        progressTotal: null,
      },
      select: { id: true, title: true, type: true },
      take: 20, // process batch of airing/unknown entries
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
      checkedCount: entriesToSync.length,
      updatedCount: results.length,
      updatedItems: results,
      message:
        results.length > 0
          ? `Successfully updated ${results.length} item(s) with new episode/chapter counts.`
          : "Checked entries: All currently announced counts are already up to date.",
    });
  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync metadata" },
      { status: 500 }
    );
  }
}
