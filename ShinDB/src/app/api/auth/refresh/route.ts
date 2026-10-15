import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyToken,
  signAccessToken,
  signRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    let refreshToken: string | undefined;

    // 1. Try reading cookie
    const cookie = request.cookies.get(REFRESH_COOKIE_NAME);
    if (cookie) {
      refreshToken = cookie.value;
    }

    // 2. Fallback to body
    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body.refreshToken;
      } catch {
        // empty body
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is missing" },
        { status: 401 }
      );
    }

    // Verify token
    const payload = await verifyToken(refreshToken);
    if (!payload || payload.type !== "refresh") {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Verify user in DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json(
        { error: "Refresh token has been revoked or expired" },
        { status: 401 }
      );
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

    // Rotate tokens
    const newAccessToken = await signAccessToken(safeUser);
    const newRefreshToken = await signRefreshToken(safeUser);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    const response = NextResponse.json(
      {
        message: "Token refreshed successfully",
        token: newAccessToken,
        user: safeUser,
      },
      { status: 200 }
    );

    response.cookies.set(ACCESS_COOKIE_NAME, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    response.cookies.set(REFRESH_COOKIE_NAME, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[AUTH_REFRESH_ERROR]:", error);
    return NextResponse.json(
      { error: "Internal server error during token refresh" },
      { status: 500 }
    );
  }
}
