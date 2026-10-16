import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const query = searchParams.get("q")?.trim() || "";
  const typeFilter = searchParams.get("type");
  const sort = searchParams.get("sort") || "tracked";

  const skip = (page - 1) * limit;

  const whereClause: any = {};
  if (query) {
    whereClause.title = { contains: query };
  }
  if (
    typeFilter &&
    ["anime", "manga", "game", "movie", "series"].includes(typeFilter)
  ) {
    whereClause.type = typeFilter as MediaType;
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "title") {
    orderBy = { title: "asc" };
  } else if (sort === "year") {
    orderBy = { releaseYear: "desc" };
  } else if (sort === "tracked") {
    orderBy = { userEntries: { _count: "desc" } };
  }

  try {
    const [total, mediaItems] = await Promise.all([
      prisma.media.count({ where: whereClause }),
      prisma.media.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { userEntries: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const formattedMedia = mediaItems.map((m) => ({
      id: m.id,
      title: m.title,
      type: m.type,
      coverImage: m.coverImage,
      releaseYear: m.releaseYear,
      genres: m.genres,
      externalRating: m.externalRating,
      totalEpisodes: m.totalEpisodes,
      progressUnit: m.progressUnit,
      externalId: m.externalId,
      externalSource: m.externalSource,
      trackedCount: m._count.userEntries,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    return NextResponse.json({
      media: formattedMedia,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ADMIN_MEDIA_GET_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to fetch master media catalog" },
      { status: 500 }
    );
  }
}
