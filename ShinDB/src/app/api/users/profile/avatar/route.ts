import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, invalidateUserCache } from "@/lib/auth";

const AvatarSchema = z.object({
  avatarUrl: z.string().min(1).max(2000),
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
    const parsed = AvatarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Valid avatarUrl is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: parsed.data.avatarUrl },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });

    invalidateUserCache(user.id);

    return NextResponse.json({
      success: true,
      message: "Avatar synchronized successfully",
      avatarUrl: updated.avatarUrl,
    });
  } catch (error) {
    console.error("[AVATAR_UPDATE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update avatar" },
      { status: 500 }
    );
  }
}
