import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, invalidateUserCache } from "@/lib/auth";
import { toMediaItem } from "@/lib/media";

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  customBadge: z.string().max(50).optional(),
  avatarUrl: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch full user record with library entries
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        library: {
          include: { media: true },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Aggregate statistics
    const totalEntries = fullUser.library.length;
    const animeCount = fullUser.library.filter((e) => e.media.type === "anime").length;
    const mangaCount = fullUser.library.filter((e) => e.media.type === "manga").length;
    const gameCount = fullUser.library.filter((e) => e.media.type === "game").length;
    const movieCount = fullUser.library.filter((e) => e.media.type === "movie").length;
    const seriesCount = fullUser.library.filter((e) => e.media.type === "series").length;

    const completedCount = fullUser.library.filter((e) => e.status === "completed").length;
    const inProgressCount = fullUser.library.filter(
      (e) => e.status === "watching" || e.status === "reading" || e.status === "playing"
    ).length;
    const planCount = fullUser.library.filter((e) => e.status === "plan_to_consume").length;
    const onHoldCount = fullUser.library.filter((e) => e.status === "on_hold").length;
    const droppedCount = fullUser.library.filter((e) => e.status === "dropped").length;
    const favoritesCount = fullUser.library.filter((e) => e.isFavorite).length;

    const ratedEntries = fullUser.library.filter((e) => e.rating !== null && e.rating !== undefined);
    const averageRating =
      ratedEntries.length > 0
        ? parseFloat(
            (ratedEntries.reduce((acc, curr) => acc + (curr.rating || 0), 0) / ratedEntries.length).toFixed(1)
          )
        : null;

    // Friends count
    const friendsCount = await prisma.friendship.count({
      where: {
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
        status: "accepted",
      },
    });

    // Favorites items
    const favorites = fullUser.library
      .filter((e) => e.isFavorite)
      .slice(0, 10)
      .map(toMediaItem);

    // Currently consuming items
    const currentlyConsuming = fullUser.library
      .filter((e) => e.status === "watching" || e.status === "reading" || e.status === "playing")
      .slice(0, 8)
      .map(toMediaItem);

    return NextResponse.json({
      success: true,
      user: {
        id: fullUser.id,
        username: fullUser.username,
        email: fullUser.email,
        displayName: fullUser.displayName,
        avatarUrl: fullUser.avatarUrl,
        bio: fullUser.bio,
        customBadge: fullUser.customBadge,
        authProvider: fullUser.authProvider,
        createdAt: fullUser.createdAt,
      },
      stats: {
        totalEntries,
        animeCount,
        mangaCount,
        gameCount,
        movieCount,
        seriesCount,
        completedCount,
        inProgressCount,
        planCount,
        onHoldCount,
        droppedCount,
        favoritesCount,
        averageRating,
        friendsCount,
      },
      favorites,
      currentlyConsuming,
    });
  } catch (error) {
    console.error("[PROFILE_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = UpdateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(parsed.data.displayName !== undefined && { displayName: parsed.data.displayName }),
        ...(parsed.data.bio !== undefined && { bio: parsed.data.bio }),
        ...(parsed.data.customBadge !== undefined && { customBadge: parsed.data.customBadge }),
        ...(parsed.data.avatarUrl !== undefined && { avatarUrl: parsed.data.avatarUrl }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        customBadge: true,
        authProvider: true,
        createdAt: true,
      },
    });

    invalidateUserCache(user.id);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("[PROFILE_UPDATE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
