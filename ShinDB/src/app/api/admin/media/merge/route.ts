import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAuditEvent } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const body = await request.json();
    const { sourceId, targetId } = body;

    if (!sourceId || !targetId) {
      return NextResponse.json(
        { error: "Both sourceId and targetId are required for deduplication merge" },
        { status: 400 }
      );
    }

    if (sourceId === targetId) {
      return NextResponse.json(
        { error: "Source and target media cannot be the identical record" },
        { status: 400 }
      );
    }

    const [sourceMedia, targetMedia] = await Promise.all([
      prisma.media.findUnique({ where: { id: sourceId } }),
      prisma.media.findUnique({ where: { id: targetId } }),
    ]);

    if (!sourceMedia || !targetMedia) {
      return NextResponse.json(
        { error: "One or both media entities do not exist in the catalog" },
        { status: 404 }
      );
    }

    // Fetch all user entries for source and target
    const [sourceEntries, targetEntries] = await Promise.all([
      prisma.userMediaEntry.findMany({ where: { mediaId: sourceId } }),
      prisma.userMediaEntry.findMany({ where: { mediaId: targetId } }),
    ]);

    const targetUserIds = new Set(targetEntries.map((e) => e.userId));

    let movedCount = 0;
    let reconciledCount = 0;

    // Use a transaction to perform migration and deletion
    await prisma.$transaction(async (tx) => {
      for (const entry of sourceEntries) {
        if (targetUserIds.has(entry.userId)) {
          // User tracks both: delete the duplicate entry from source
          await tx.userMediaEntry.delete({ where: { id: entry.id } });
          reconciledCount++;
        } else {
          // User only tracked source: re-link entry to target
          await tx.userMediaEntry.update({
            where: { id: entry.id },
            data: { mediaId: targetId },
          });
          movedCount++;
        }
      }

      // Finally delete the source media from catalog
      await tx.media.delete({ where: { id: sourceId } });
    });

    await logAuditEvent({
      userId: authCheck.user.id,
      action: "admin.media.merge",
      target: `media:${targetId}`,
      details: {
        sourceTitle: sourceMedia.title,
        sourceId: sourceMedia.id,
        targetTitle: targetMedia.title,
        targetId: targetMedia.id,
        entriesMoved: movedCount,
        duplicatesRemoved: reconciledCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Merged "${sourceMedia.title}" into "${targetMedia.title}". ${movedCount} tracking records shifted, ${reconciledCount} duplicate links resolved.`,
      sourceTitle: sourceMedia.title,
      targetTitle: targetMedia.title,
      entriesMoved: movedCount,
      duplicatesRemoved: reconciledCount,
    });
  } catch (error) {
    console.error("[ADMIN_MEDIA_MERGE_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to execute catalog deduplication merge" },
      { status: 500 }
    );
  }
}
