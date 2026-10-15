import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  signGoogleOnboardingToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  GOOGLE_ONBOARDING_COOKIE,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  if (error || !code) {
    console.warn("[GOOGLE_OAUTH_CALLBACK] Access denied or error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error || "Google authentication was cancelled")}`, baseUrl)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    console.error("[GOOGLE_OAUTH_CALLBACK] Missing Google OAuth credentials in environment");
    return NextResponse.redirect(
      new URL("/login?error=Google OAuth is not configured on the server", baseUrl)
    );
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("[GOOGLE_OAUTH_CALLBACK] Token exchange failed:", errBody);
      return NextResponse.redirect(new URL("/login?error=Failed to exchange Google OAuth code", baseUrl));
    }

    const tokenData = await tokenRes.json();
    const googleAccessToken = tokenData.access_token;

    // 2. Fetch Google User Profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(new URL("/login?error=Failed to fetch Google profile", baseUrl));
    }

    const profile = await profileRes.json();
    const providerId = profile.sub;
    const email = profile.email?.toLowerCase().trim();
    const name = profile.name || "Google User";
    const avatarUrl = profile.picture || null;

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=Google account has no verified email", baseUrl));
    }

    // 3. Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { providerId }],
      },
    });

    // CASE A: FIRST TIME GOOGLE LOGIN -> Require user to choose username!
    if (!user) {
      const onboardingToken = await signGoogleOnboardingToken({
        email,
        name,
        avatarUrl,
        providerId,
      });

      const response = NextResponse.redirect(new URL("/auth/choose-username", baseUrl));

      response.cookies.set(GOOGLE_ONBOARDING_COOKIE, onboardingToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 20, // 20 minutes
        path: "/",
      });

      return response;
    }

    // CASE B: Existing user -> Log them straight in!
    if (user.authProvider !== "google") {
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

    const response = NextResponse.redirect(new URL("/", baseUrl));

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
  } catch (err: any) {
    console.error("[GOOGLE_OAUTH_CALLBACK_ERROR]:", err);
    return NextResponse.redirect(new URL("/login?error=Google authentication process failed", baseUrl));
  }
}
