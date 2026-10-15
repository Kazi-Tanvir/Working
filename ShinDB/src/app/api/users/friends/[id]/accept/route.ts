import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id },
      include: {
        requester: {
          select: { username: true, displayName: true },
        },
      },
    });

    if (!friendship) {
      return NextResponse.json(
        { success: false, error: "Friendship request not found" },
        { status: 404 }
      );
    }

    // Only addressee can accept the request
    if (friendship.addresseeId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Not authorized to accept this request" },
        { status: 403 }
      );
    }

    if (friendship.status === "accepted") {
      return NextResponse.json(
        { success: true, message: "Friendship already accepted", friendship }
      );
    }

    const updated = await prisma.friendship.update({
      where: { id },
      data: { status: "accepted" },
    });

    return NextResponse.json({
      success: true,
      message: `Friend connection with @${friendship.requester.username} established`,
      friendship: updated,
    });
  } catch (error) {
    console.error("[FRIEND_ACCEPT_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to accept friend request" },
      { status: 500 }
    );
  }
}
