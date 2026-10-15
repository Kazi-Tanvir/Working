import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { user, authenticated: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("[AUTH_ME_ERROR]:", error);
    return NextResponse.json(
      { error: "Internal server error fetching session user" },
      { status: 500 }
    );
  }
}
