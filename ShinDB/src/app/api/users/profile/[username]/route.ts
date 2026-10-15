import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { toMediaItem } from "@/lib/media";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const currentUser = await getUserFromRequest(request);

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username parameter is required" },
        { status: 400 }
      );
    }

    // Lookup target user
    const targetUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
        },
      },
      include: {
        library: {
          include: { media: true },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Target user dossier not found" },
        { status: 404 }
      );
    }

    const isSelf = currentUser?.id === targetUser.id;

    // Check friendship status if not self
    let isFriend = isSelf;
    let friendStatus: string | null = null;
    let friendshipId: string | null = null;

    if (!isSelf && currentUser) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: currentUser.id, addresseeId: targetUser.id },
            { requesterId: targetUser.id, addresseeId: currentUser.id },
          ],
        },
      });

      if (friendship) {
        friendStatus = friendship.status;
        friendshipId = friendship.id;
        if (friendship.status === "accepted") {
          isFriend = true;
        }
      }
    }

    // Public dossier snippet
    const publicUser = {
      id: targetUser.id,
      username: targetUser.username,
      displayName: targetUser.displayName,
      avatarUrl: targetUser.avatarUrl,
      customBadge: targetUser.customBadge,
      bio: targetUser.bio,
      createdAt: targetUser.createdAt,
    };

    // Calculate aggregated stats
    const totalEntries = targetUser.library.length;
    const animeCount = targetUser.library.filter((e) => e.media.type === "anime").length;
    const mangaCount = targetUser.library.filter((e) => e.media.type === "manga").length;
    const gameCount = targetUser.library.filter((e) => e.media.type === "game").length;
    const movieCount = targetUser.library.filter((e) => e.media.type === "movie").length;
    const seriesCount = targetUser.library.filter((e) => e.media.type === "series").length;

    const completedCount = targetUser.library.filter((e) => e.status === "completed").length;
    const inProgressCount = targetUser.library.filter(
      (e) => e.status === "watching" || e.status === "reading" || e.status === "playing"
    ).length;
    const planCount = targetUser.library.filter((e) => e.status === "plan_to_consume").length;
    const favoritesCount = targetUser.library.filter((e) => e.isFavorite).length;

    const ratedEntries = targetUser.library.filter((e) => e.rating !== null && e.rating !== undefined);
    const averageRating =
      ratedEntries.length > 0
        ? parseFloat(
            (ratedEntries.reduce((acc, curr) => acc + (curr.rating || 0), 0) / ratedEntries.length).toFixed(1)
          )
        : null;

    const stats = {
      totalEntries,
      animeCount,
      mangaCount,
      gameCount,
      movieCount,
      seriesCount,
      completedCount,
      inProgressCount,
      planCount,
      favoritesCount,
      averageRating,
    };

    // If not friends and not self, enforce security barrier
    if (!isFriend) {
      return NextResponse.json(
        {
          success: false,
          error: "FRIENDSHIP_REQUIRED",
          message: "Classified dossier. Mutual friendship authorization required.",
          isFriend: false,
          isSelf: false,
          friendStatus,
          friendshipId,
          user: publicUser,
          stats: {
            totalEntries,
            completedCount,
          },
        },
        { status: 403 }
      );
    }

    // If accepted friends or self, return complete dossier with library
    const library = targetUser.library.map(toMediaItem);

    return NextResponse.json({
      success: true,
      isFriend: true,
      isSelf,
      friendStatus: "accepted",
      friendshipId,
      user: publicUser,
      stats,
      library,
    });
  } catch (error) {
    console.error("[PROFILE_BY_USERNAME_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to query operator profile" },
      { status: 500 }
    );
  }
}
