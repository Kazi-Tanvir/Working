import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  signGoogleOnboardingToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  GOOGLE_ONBOARDING_COOKIE,
} from "@/lib/auth";

const GoogleAuthSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).default("Google User"),
  avatarUrl: z.string().optional().nullable(),
  providerId: z.string().optional(),
});

// GET: Initiates Google OAuth redirect to Google's consent screen
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  if (!clientId) {
    // If client ID is not configured yet in .env, redirect to login with query param
    return NextResponse.redirect(new URL("/login?google_missing_client=true", request.url));
  }

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("access_type", "offline");
  googleUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(googleUrl.toString());
}

// POST: Direct / Dev verification of Google profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = GoogleAuthSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid Google OAuth payload", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, name, avatarUrl, providerId } = result.data;
    const cleanEmail = email.toLowerCase().trim();
    const resolvedProviderId = providerId || `google_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`;

    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { providerId: resolvedProviderId }],
      },
    });

    // CASE 1: First time Google Login -> User needs to choose their username!
    if (!user) {
      const onboardingToken = await signGoogleOnboardingToken({
        email: cleanEmail,
        name: name.trim(),
        avatarUrl: avatarUrl || null,
        providerId: resolvedProviderId,
      });

      const response = NextResponse.json({
        success: true,
        needsUsername: true,
        redirect: "/auth/choose-username",
      });

      // Set temporary 20-minute onboarding cookie
      response.cookies.set(GOOGLE_ONBOARDING_COOKIE, onboardingToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 20, // 20 minutes
        path: "/",
      });

      return response;
    }

    // CASE 2: User already exists -> Log them in!
    if (user.authProvider !== "google") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: "google",
          providerId: resolvedProviderId,
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
        needsUsername: false,
        user: safeUser,
        redirect: "/",
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
