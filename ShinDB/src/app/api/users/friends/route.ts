import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch accepted friendships
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
        status: "accepted",
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            customBadge: true,
            createdAt: true,
            library: {
              select: {
                status: true,
                rating: true,
                progressCurrent: true,
                updatedAt: true,
                media: {
                  select: {
                    id: true,
                    title: true,
                    type: true,
                    coverImage: true,
                    totalEpisodes: true,
                    progressUnit: true,
                  },
                },
              },
              orderBy: { updatedAt: "desc" },
            },
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            customBadge: true,
            createdAt: true,
            library: {
              select: {
                status: true,
                rating: true,
                progressCurrent: true,
                updatedAt: true,
                media: {
                  select: {
                    id: true,
                    title: true,
                    type: true,
                    coverImage: true,
                    totalEpisodes: true,
                    progressUnit: true,
                  },
                },
              },
              orderBy: { updatedAt: "desc" },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const friends = friendships.map((f) => {
      const friendData = f.requesterId === user.id ? f.addressee : f.requester;
      const totalEntries = friendData.library.length;
      
      // Find currently active consumption entry (watching, reading, playing)
      const activeEntry = friendData.library.find(
        (e) => e.status === "watching" || e.status === "reading" || e.status === "playing"
      );

      const currentlyConsuming = activeEntry
        ? {
            title: activeEntry.media.title,
            type: activeEntry.media.type,
            coverImage: activeEntry.media.coverImage,
            status: activeEntry.status,
            progressCurrent: activeEntry.progressCurrent,
            totalEpisodes: activeEntry.media.totalEpisodes,
            unit: activeEntry.media.progressUnit,
          }
        : null;

      const completedCount = friendData.library.filter((e) => e.status === "completed").length;

      return {
        friendshipId: f.id,
        connectedSince: f.createdAt,
        id: friendData.id,
        username: friendData.username,
        displayName: friendData.displayName,
        avatarUrl: friendData.avatarUrl,
        bio: friendData.bio,
        customBadge: friendData.customBadge,
        createdAt: friendData.createdAt,
        totalEntries,
        completedCount,
        currentlyConsuming,
      };
    });

    return NextResponse.json({
      success: true,
      friends,
      totalCount: friends.length,
    });
  } catch (error) {
    console.error("[FRIENDS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve friends network" },
      { status: 500 }
    );
  }
}
