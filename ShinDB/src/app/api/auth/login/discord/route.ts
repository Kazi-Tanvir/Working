import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth";

const DiscordAuthSchema = z.object({
  code: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  providerId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = DiscordAuthSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid OAuth payload", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const email = result.data.email || "discord.commander@shindb.io";
    const name = result.data.name || "Discord Commander";
    const avatarUrl =
      result.data.avatarUrl ||
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80";
    const providerId = result.data.providerId || "discord_usr_7766";

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { providerId }],
      },
    });

    if (!user) {
      const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || "discord_user";
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${baseName}_${randomSuffix}`;

      user = await prisma.user.create({
        data: {
          username,
          email,
          displayName: name,
          avatarUrl,
          authProvider: "discord",
          providerId,
        },
      });
    } else if (user.authProvider !== "discord") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: "discord",
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
        message: "Discord authentication successful",
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
    console.error("[AUTH_DISCORD_ERROR]:", error);
    return NextResponse.json(
      { error: "Internal server error during Discord OAuth" },
      { status: 500 }
    );
  }
}
