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

    // 1. Incoming requests: addressee is currentUser
    const incomingFriendships = await prisma.friendship.findMany({
      where: {
        addresseeId: user.id,
        status: "pending",
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Outgoing requests: requester is currentUser
    const outgoingFriendships = await prisma.friendship.findMany({
      where: {
        requesterId: user.id,
        status: "pending",
      },
      include: {
        addressee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            customBadge: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const incoming = incomingFriendships.map((f) => ({
      requestId: f.id,
      sentAt: f.createdAt,
      user: f.requester,
    }));

    const outgoing = outgoingFriendships.map((f) => ({
      requestId: f.id,
      sentAt: f.createdAt,
      user: f.addressee,
    }));

    return NextResponse.json({
      success: true,
      incoming,
      outgoing,
      pendingCount: incoming.length,
    });
  } catch (error) {
    console.error("[FRIEND_REQUESTS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve pending requests" },
      { status: 500 }
    );
  }
}
