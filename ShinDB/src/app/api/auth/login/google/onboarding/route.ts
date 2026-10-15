import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GOOGLE_ONBOARDING_COOKIE, verifyGoogleOnboardingToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(GOOGLE_ONBOARDING_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No active Google onboarding session found. Please sign in with Google again." },
        { status: 401 }
      );
    }

    const payload = await verifyGoogleOnboardingToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Google onboarding session has expired or is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    // Generate suggested username from name/email
    const suggested =
      payload.name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/^_+|_+$/g, "").slice(0, 20) ||
      payload.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20) ||
      "operator";

    return NextResponse.json({
      success: true,
      data: {
        email: payload.email,
        name: payload.name,
        avatarUrl: payload.avatarUrl,
        suggestedUsername: suggested,
      },
    });
  } catch (err: any) {
    console.error("[GOOGLE_ONBOARDING_GET_ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to retrieve onboarding session" },
      { status: 500 }
    );
  }
}
