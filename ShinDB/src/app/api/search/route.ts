import { NextRequest, NextResponse } from "next/server";
import { searchMedia } from "@/utils/apiHelpers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";

  if (!query || query.trim() === "") {
    return NextResponse.json({ success: true, results: [] });
  }

  try {
    const results = await searchMedia(query, type);
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Search API Route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search media" },
      { status: 500 }
    );
  }
}
