import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAuditEvent } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { id } = await params;

  try {
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        _count: { select: { userEntries: true } },
        userEntries: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          take: 20,
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 });
    }

    return NextResponse.json({
      media: {
        id: media.id,
        title: media.title,
        type: media.type,
        coverImage: media.coverImage,
        releaseYear: media.releaseYear,
        genres: media.genres,
        externalRating: media.externalRating,
        totalEpisodes: media.totalEpisodes,
        progressUnit: media.progressUnit,
        externalId: media.externalId,
        externalSource: media.externalSource,
        createdAt: media.createdAt,
        updatedAt: media.updatedAt,
        trackedCount: media._count.userEntries,
        recentTrackers: media.userEntries.map((e) => ({
          user: e.user,
          status: e.status,
          rating: e.rating,
          progressCurrent: e.progressCurrent,
          updatedAt: e.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error("[ADMIN_MEDIA_ITEM_GET_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to load media catalog item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const {
      title,
      coverImage,
      releaseYear,
      genres,
      totalEpisodes,
      externalRating,
    } = body;

    const existing = await prisma.media.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (typeof title === "string" && title.trim().length > 0) {
      updateData.title = title.trim();
    }
    if (typeof coverImage === "string") {
      updateData.coverImage = coverImage.trim();
    }
    if (typeof releaseYear === "number" || typeof releaseYear === "string") {
      const year = parseInt(String(releaseYear), 10);
      if (!isNaN(year)) updateData.releaseYear = year;
    }
    if (Array.isArray(genres)) {
      updateData.genres = genres;
    }
    if (totalEpisodes !== undefined) {
      updateData.totalEpisodes =
        totalEpisodes === null ? null : parseInt(String(totalEpisodes), 10);
    }
    if (externalRating !== undefined) {
      updateData.externalRating =
        externalRating === null ? null : parseFloat(String(externalRating));
    }

    const updated = await prisma.media.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      userId: authCheck.user.id,
      action: "admin.media.update",
      target: `media:${id}`,
      details: {
        title: updated.title,
        updatedFields: Object.keys(updateData),
      },
    });

    return NextResponse.json({
      success: true,
      media: updated,
      message: "Media entry metadata saved to catalog",
    });
  } catch (error) {
    console.error("[ADMIN_MEDIA_PUT_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to update media item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { id } = await params;

  try {
    const existing = await prisma.media.findUnique({
      where: { id },
      select: { id: true, title: true, type: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    await prisma.media.delete({ where: { id } });

    await logAuditEvent({
      userId: authCheck.user.id,
      action: "admin.media.delete",
      target: `media:${id}`,
      details: {
        title: existing.title,
        type: existing.type,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Media "${existing.title}" deleted from catalog.`,
    });
  } catch (error) {
    console.error("[ADMIN_MEDIA_DELETE_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to delete media item" },
      { status: 500 }
    );
  }
}
