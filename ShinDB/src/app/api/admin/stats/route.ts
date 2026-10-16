import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      userCount,
      entryCount,
      mediaCount,
      friendshipCount,
      signups24h,
      signups7d,
      signups30d,
      topMedia,
      mediaByTypeGroup,
      entriesByStatusGroup,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.userMediaEntry.count(),
      prisma.media.count(),
      prisma.friendship.count({ where: { status: "accepted" } }),
      prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.media.findMany({
        select: {
          id: true,
          title: true,
          type: true,
          coverImage: true,
          releaseYear: true,
          _count: { select: { userEntries: true } },
        },
        orderBy: { userEntries: { _count: "desc" } },
        take: 10,
      }),
      prisma.media.groupBy({
        by: ["type"],
        _count: { id: true },
      }),
      prisma.userMediaEntry.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const mediaByType = mediaByTypeGroup.reduce((acc, curr) => {
      acc[curr.type] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    const entriesByStatus = entriesByStatusGroup.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      stats: {
        totalUsers: userCount,
        totalEntries: entryCount,
        totalMedia: mediaCount,
        totalFriendships: friendshipCount,
        signups: {
          past24h: signups24h,
          past7d: signups7d,
          past30d: signups30d,
        },
        mediaByType,
        entriesByStatus,
        topMedia: topMedia.map((m) => ({
          id: m.id,
          title: m.title,
          type: m.type,
          coverImage: m.coverImage,
          releaseYear: m.releaseYear,
          trackedCount: m._count.userEntries,
        })),
      },
    });
  } catch (error) {
    console.error("[ADMIN_STATS_ERROR]:", error);
    return NextResponse.json(
      { error: "Internal server error fetching telemetry stats" },
      { status: 500 }
    );
  }
}
