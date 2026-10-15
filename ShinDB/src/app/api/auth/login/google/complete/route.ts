import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  GOOGLE_ONBOARDING_COOKIE,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  verifyGoogleOnboardingToken,
  signAccessToken,
  signRefreshToken,
} from "@/lib/auth";

const CompleteUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric characters and underscores")
    .transform((val) => val.toLowerCase()),
  displayName: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(GOOGLE_ONBOARDING_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No active Google onboarding session. Please sign in with Google again." },
        { status: 401 }
      );
    }

    const payload = await verifyGoogleOnboardingToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Google onboarding session has expired. Please sign in with Google again." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = CompleteUsernameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid username" },
        { status: 400 }
      );
    }

    const { username, displayName } = parsed.data;

    // Check if username is already taken
    const existingUsername = await prisma.user.findFirst({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: `Username "${username}" is already taken. Please choose another.` },
        { status: 409 }
      );
    }

    // Check if user with this email already exists
    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (user) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: "google",
          providerId: payload.providerId,
          avatarUrl: user.avatarUrl || payload.avatarUrl,
        },
      });
    } else {
      // Create new user with chosen username
      user = await prisma.user.create({
        data: {
          username,
          email: payload.email,
          displayName: displayName?.trim() || payload.name,
          avatarUrl: payload.avatarUrl,
          authProvider: "google",
          providerId: payload.providerId,
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

    // Issue standard tokens
    const accessToken = await signAccessToken(safeUser);
    const refreshToken = await signRefreshToken(safeUser);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const response = NextResponse.json({
      success: true,
      message: "Identity initialized successfully",
      user: safeUser,
    });

    // Set auth cookies
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

    // Clear onboarding cookie
    response.cookies.set(GOOGLE_ONBOARDING_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("[GOOGLE_COMPLETE_ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to complete Google registration" },
      { status: 500 }
    );
  }
}
