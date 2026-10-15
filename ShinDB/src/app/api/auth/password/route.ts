import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, verifyPassword, hashPassword } from "@/lib/auth";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = ChangePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;

    // Fetch user with password hash
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "User password cannot be updated directly (OAuth account)." },
        { status: 400 }
      );
    }

    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect current password" },
        { status: 403 }
      );
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[AUTH_CHANGE_PASSWORD_ERROR]:", error);
    return NextResponse.json(
      { error: "Internal server error changing password" },
      { status: 500 }
    );
  }
}
