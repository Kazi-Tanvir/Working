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
    });

    if (!friendship) {
      return NextResponse.json(
        { success: false, error: "Friendship request not found" },
        { status: 404 }
      );
    }

    // Only addressee can reject incoming request
    if (friendship.addresseeId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Not authorized to reject this request" },
        { status: 403 }
      );
    }

    // Delete the pending friendship record
    await prisma.friendship.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Friend request rejected and purged",
    });
  } catch (error) {
    console.error("[FRIEND_REJECT_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reject friend request" },
      { status: 500 }
    );
  }
}
