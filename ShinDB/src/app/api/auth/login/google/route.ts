import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth";

const GoogleAuthSchema = z.object({
  code: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  providerId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = GoogleAuthSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid OAuth payload", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // In a live environment with GOOGLE_CLIENT_ID & SECRET, exchange 'code' for tokens.
    // For local dev/demo or token payload verification:
    const email = result.data.email || "google.pilot@shindb.io";
    const name = result.data.name || "Google Pilot";
    const avatarUrl =
      result.data.avatarUrl ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";
    const providerId = result.data.providerId || "google_usr_9988";

    // 1. Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { providerId }],
      },
    });

    if (!user) {
      // Auto-generate clean unique username
      const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || "user";
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${baseName}_${randomSuffix}`;

      user = await prisma.user.create({
        data: {
          username,
          email,
          displayName: name,
          avatarUrl,
          authProvider: "google",
          providerId,
        },
      });
    } else if (user.authProvider !== "google") {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: "google",
          providerId,
          avatarUrl: user.avatarUrl || avatarUrl,
        },
      });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    };

    const accessToken = await signAccessToken(safeUser);
    const refreshToken = await signRefreshToken(safeUser);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const response = NextResponse.json(
      {
        message: "Google authentication successful",
        user: safeUser,
        token: accessToken,
      },
      { status: 200 }
    );

    response.cookies.set(ACCESS_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[AUTH_GOOGLE_ERROR]:", error);
    return NextResponse.json(
      { error: "Internal server error during Google OAuth" },
      { status: 500 }
    );
  }
}
