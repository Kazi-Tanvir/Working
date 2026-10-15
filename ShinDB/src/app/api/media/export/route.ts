import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { toMediaItem } from "@/lib/media";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        library: {
          include: { media: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const exportData = {
      system: "ShinDB",
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      user: {
        username: fullUser.username,
        displayName: fullUser.displayName,
        email: fullUser.email,
        customBadge: fullUser.customBadge,
        memberSince: fullUser.createdAt,
      },
      summary: {
        totalEntries: fullUser.library.length,
        anime: fullUser.library.filter((e) => e.media.type === "anime").length,
        manga: fullUser.library.filter((e) => e.media.type === "manga").length,
        games: fullUser.library.filter((e) => e.media.type === "game").length,
        movies: fullUser.library.filter((e) => e.media.type === "movie").length,
        series: fullUser.library.filter((e) => e.media.type === "series").length,
        completed: fullUser.library.filter((e) => e.status === "completed").length,
      },
      library: fullUser.library.map(toMediaItem),
    };

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `shindb-export-${fullUser.username}-${dateStr}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[DATA_EXPORT_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export data archive" },
      { status: 500 }
    );
  }
}
