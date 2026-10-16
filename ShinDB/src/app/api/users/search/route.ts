import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        users: [],
        query,
      });
    }

    // Query users matching username or displayName
    const users = await prisma.user.findMany({
      where: {
        AND: [
          currentUser ? { id: { not: currentUser.id } } : {},
          {
            OR: [
              { username: { contains: query } },
              { displayName: { contains: query } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        customBadge: true,
        bio: true,
        createdAt: true,
        library: {
          select: { id: true },
        },
      },
      take: 20,
    });

    // If currentUser is present, determine friendship relationship with each user
    let userResults = users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      customBadge: u.customBadge,
      bio: u.bio,
      createdAt: u.createdAt,
      totalEntries: u.library.length,
      relationship: "none" as "none" | "pending_sent" | "pending_received" | "accepted",
      friendshipId: null as string | null,
    }));

    if (currentUser && users.length > 0) {
      const targetIds = users.map((u) => u.id);
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: currentUser.id, addresseeId: { in: targetIds } },
            { requesterId: { in: targetIds }, addresseeId: currentUser.id },
          ],
        },
      });

      const friendshipMap = new Map<string, { id: string; status: string; requesterId: string }>();
      for (const f of friendships) {
        const otherId = f.requesterId === currentUser.id ? f.addresseeId : f.requesterId;
        friendshipMap.set(otherId, {
          id: f.id,
          status: f.status,
          requesterId: f.requesterId,
        });
      }

      userResults = userResults.map((u) => {
        const rel = friendshipMap.get(u.id);
        if (!rel) return u;

        let relationship: "none" | "pending_sent" | "pending_received" | "accepted" = "none";
        if (rel.status === "accepted") {
          relationship = "accepted";
        } else if (rel.status === "pending") {
          relationship = rel.requesterId === currentUser.id ? "pending_sent" : "pending_received";
        }

        return {
          ...u,
          relationship,
          friendshipId: rel.id,
        };
      });
    }

    return NextResponse.json({
      success: true,
      users: userResults,
      count: userResults.length,
      query,
    });
  } catch (error) {
    console.error("[USER_SEARCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search user directory" },
      { status: 500 }
    );
  }
}
