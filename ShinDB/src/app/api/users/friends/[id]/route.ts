import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function DELETE(
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
        { success: false, error: "Friendship not found" },
        { status: 404 }
      );
    }

    // Must be either requester or addressee
    if (friendship.requesterId !== user.id && friendship.addresseeId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Not authorized to remove this connection" },
        { status: 403 }
      );
    }

    await prisma.friendship.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Friend connection removed successfully",
    });
  } catch (error) {
    console.error("[FRIEND_DELETE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove friend" },
      { status: 500 }
    );
  }
}
