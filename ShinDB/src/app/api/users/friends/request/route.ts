import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

const SendRequestSchema = z.object({
  username: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = SendRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Target username is required" },
        { status: 400 }
      );
    }

    const targetUsername = parsed.data.username.trim();

    // Prevent self-friending
    if (targetUsername.toLowerCase() === user.username.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Self-connection prohibited. Cannot friend yourself." },
        { status: 400 }
      );
    }

    // Look up target user
    const targetUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: targetUsername,
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: `Operator '@${targetUsername}' not found in registry` },
        { status: 404 }
      );
    }

    // Check existing friendship
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: user.id, addresseeId: targetUser.id },
          { requesterId: targetUser.id, addresseeId: user.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json(
          { success: false, error: "Operator is already an authorized friend" },
          { status: 409 }
        );
      }
      if (existing.status === "pending") {
        if (existing.requesterId === user.id) {
          return NextResponse.json(
            { success: false, error: "Connection request already pending dispatch" },
            { status: 409 }
          );
        } else {
          return NextResponse.json(
            { success: false, error: "Pending incoming request from this operator exists" },
            { status: 409 }
          );
        }
      }
    }

    // Create pending friendship
    const friendship = await prisma.friendship.create({
      data: {
        requesterId: user.id,
        addresseeId: targetUser.id,
        status: "pending",
      },
      include: {
        addressee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Friend connection request transmitted to @${targetUser.username}`,
        friendship: {
          id: friendship.id,
          targetUser: friendship.addressee,
          status: friendship.status,
          createdAt: friendship.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[FRIEND_REQUEST_SEND_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to dispatch friend request" },
      { status: 500 }
    );
  }
}
