// src/app/api/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { MediaType, MediaStatus, ProgressUnit } from "@prisma/client";
import { toMediaItem } from "@/lib/media";
import { getCanonicalExternalRating } from "@/utils/seasonHelpers";
import { getUserFromRequest } from "@/lib/auth";

const CreateTrackSchema = z.object({
  mediaId: z.string().optional(),
  title: z.string().min(1).max(250),
  type: z.enum(["anime", "manga", "game", "movie", "series"]),
  releaseYear: z.union([z.number(), z.string()]).optional(),
  coverImage: z.string().optional(),
  rating: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
  progress: z.string().optional(),
  genres: z.array(z.string()).optional(),
  seasons: z.array(z.any()).optional(),
  currentSeason: z.number().optional(),
  progressCurrent: z.number().optional(),
  notes: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

const UpdateTrackSchema = CreateTrackSchema.partial().extend({
  id: z.string().min(1),
});

function normalizeStatusInput(status: string | undefined, type: MediaType): MediaStatus {
  if (!status) return "plan_to_consume";
  const s = status.toLowerCase().trim();
  if (s === "completed") return "completed";
  if (s === "dropped") return "dropped";
  if (s === "on hold" || s === "on-hold" || s === "on_hold") return "on_hold";
  if (s.startsWith("plan")) return "plan_to_consume";
  if (type === "manga") return "reading";
  if (type === "game") return "playing";
  return "watching";
}

function parseRatingInput(rating?: string | number): number | null {
  if (rating === undefined || rating === null || rating === "N/A" || rating === "Unrated") return null;
  if (typeof rating === "number") return Math.min(10, Math.max(0, rating));
  const num = parseFloat(String(rating).split("/")[0]);
  return isNaN(num) ? null : Math.min(10, Math.max(0, num));
}

function parseProgressInput(
  progress: string | undefined,
  type: MediaType
): {
  progressCurrent: number;
  progressTotal: number | null;
  progressUnit: ProgressUnit;
} {
  const unit: ProgressUnit =
    type === "manga" ? "ch" : type === "game" ? "hrs" : type === "movie" ? "mins" : "ep";

  if (!progress) return { progressCurrent: 0, progressTotal: null, progressUnit: unit };

  // 1. Structured total parenthetical e.g. "(16/32 Total)"
  const totalMatch = progress.match(/\((\d+)\/(\d+)\s+Total\)/i);
  if (totalMatch) {
    return {
      progressCurrent: parseInt(totalMatch[1], 10) || 0,
      progressTotal: parseInt(totalMatch[2], 10) || null,
      progressUnit: unit,
    };
  }

  // 2. Standard ratio e.g. "8/8 EP" or "S1: 8/8"
  if (progress.includes("/")) {
    const [curr, tot] = progress.split("/");
    const numCurr = curr.match(/\d+/g);
    const lastCurr = numCurr ? numCurr[numCurr.length - 1] : "0";
    const totalMatch = tot.match(/\d+/);
    return {
      progressCurrent: parseInt(lastCurr, 10) || 0,
      progressTotal: totalMatch ? parseInt(totalMatch[0], 10) : null,
      progressUnit: unit,
    };
  }

  // 3. S1E08 pattern
  const seMatch = progress.match(/S(\d+)E(\d+)/i);
  if (seMatch) {
    return {
      progressCurrent: parseInt(seMatch[2], 10) || 0,
      progressTotal: null,
      progressUnit: "ep",
    };
  }

  const numMatch = progress.match(/\d+/);
  return {
    progressCurrent: numMatch ? parseInt(numMatch[0], 10) : 0,
    progressTotal: null,
    progressUnit: unit,
  };
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please authenticate to track media." },
        { status: 401 }
      );
    }
    const userId = sessionUser.id;

    const body = await request.json();
    const parsed = CreateTrackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const {
      mediaId,
      title,
      type,
      releaseYear,
      coverImage,
      rating,
      status,
      progress,
      genres,
      seasons,
      currentSeason,
      progressCurrent,
      notes,
      isFavorite,
    } = parsed.data;

    const cleanTitle = title.trim();
    const prog = parseProgressInput(progress, type);
    const canonicalRating = getCanonicalExternalRating(cleanTitle);

    // 1. Find or create canonical Media metadata
    let media = mediaId
      ? await prisma.media.findUnique({ where: { id: mediaId } })
      : null;

    if (!media) {
      media = await prisma.media.findUnique({
        where: { title_type: { title: cleanTitle, type } },
      });
    }

    if (!media) {
      media = await prisma.media.create({
        data: {
          title: cleanTitle,
          type,
          coverImage:
            coverImage ||
            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
          releaseYear: releaseYear ? Number(releaseYear) : new Date().getFullYear(),
          genres: genres || [],
          externalRating: canonicalRating,
          totalEpisodes: prog.progressTotal,
          progressUnit: prog.progressUnit,
        },
      });
    }

    // 2. Check if THIS user already tracks this media
    const existingEntry = await prisma.userMediaEntry.findUnique({
      where: {
        userId_mediaId: {
          userId,
          mediaId: media.id,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { success: false, error: "Item is already tracked in your personal library" },
        { status: 409 }
      );
    }

    // 3. Create personal tracking entry for this user
    const userEntry = await prisma.userMediaEntry.create({
      data: {
        userId,
        mediaId: media.id,
        status: normalizeStatusInput(status, type),
        rating: parseRatingInput(rating),
        progressCurrent: progressCurrent !== undefined ? progressCurrent : prog.progressCurrent,
        currentSeason: currentSeason || 1,
        seasons: seasons ? (seasons as any) : undefined,
        notes: notes || null,
        isFavorite: isFavorite || false,
      },
      include: { media: true },
    });

    return NextResponse.json({
      success: true,
      entry: toMediaItem(userEntry),
    });
  } catch (error) {
    console.error("[TRACK_API_POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please authenticate to update media." },
        { status: 401 }
      );
    }
    const userId = sessionUser.id;

    const body = await request.json();
    const parsed = UpdateTrackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid update payload" },
        { status: 400 }
      );
    }

    const {
      id,
      type,
      status,
      progress,
      progressCurrent,
      rating,
      title,
      releaseYear,
      genres,
      coverImage,
      seasons,
      currentSeason,
      notes,
      isFavorite,
    } = parsed.data;

    // Look for user tracking entry by userEntry.id OR mediaId strictly for this user
    let userEntry = await prisma.userMediaEntry.findFirst({
      where: {
        userId,
        OR: [{ id }, { mediaId: id }],
      },
      include: { media: true },
    });

    // If item was not yet in user's library, create it for this user!
    if (!userEntry) {
      const media = await prisma.media.findUnique({ where: { id } });
      if (media) {
        userEntry = await prisma.userMediaEntry.create({
          data: {
            userId,
            mediaId: media.id,
            status: normalizeStatusInput(status, media.type),
            rating: parseRatingInput(rating),
            progressCurrent: progressCurrent || 0,
            notes: notes || null,
            isFavorite: isFavorite || false,
          },
          include: { media: true },
        });
      } else {
        return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 });
      }
    }

    const mediaType = (type as MediaType) || userEntry.media.type;
    const prog = progress !== undefined ? parseProgressInput(progress, mediaType) : undefined;

    // Structured season calculation
    let calculatedWatched = userEntry.progressCurrent;
    let validatedSeasons: any = undefined;
    if (Array.isArray(seasons)) {
      validatedSeasons = seasons.map((s: any) => ({
        seasonNumber: Number(s.seasonNumber) || 1,
        title: s.title || `Season ${s.seasonNumber}`,
        episodeCount: Math.max(0, Number(s.episodeCount) || 0),
        episodesWatched: Math.max(0, Math.min(Number(s.episodeCount) || 0, Number(s.episodesWatched) || 0)),
        isCompleted: Boolean(s.isCompleted || (s.episodeCount > 0 && s.episodesWatched >= s.episodeCount)),
      }));
      calculatedWatched = (validatedSeasons as any[]).reduce((sum, s) => sum + s.episodesWatched, 0);
    } else if (progressCurrent !== undefined) {
      calculatedWatched = Math.max(
        0,
        userEntry.media.totalEpisodes
          ? Math.min(userEntry.media.totalEpisodes, progressCurrent)
          : progressCurrent
      );
    } else if (prog !== undefined) {
      calculatedWatched = prog.progressCurrent;
    }

    let finalStatus: MediaStatus =
      status !== undefined ? normalizeStatusInput(status, mediaType) : userEntry.status;

    // If marked as completed: ensure progress reaches max episodes, and all seasons marked completed
    if (finalStatus === "completed") {
      if (Array.isArray(validatedSeasons) && validatedSeasons.length > 0) {
        validatedSeasons = validatedSeasons.map((s: any) => ({
          ...s,
          episodesWatched: s.episodeCount,
          isCompleted: true,
        }));
        calculatedWatched = (validatedSeasons as any[]).reduce((sum, s) => sum + s.episodesWatched, 0);
      } else if (Array.isArray(userEntry.seasons) && (userEntry.seasons as any[]).length > 0 && mediaType === "series") {
        validatedSeasons = (userEntry.seasons as any[]).map((s: any) => ({
          ...s,
          episodesWatched: s.episodeCount,
          isCompleted: true,
        }));
        calculatedWatched = (validatedSeasons as any[]).reduce((sum, s) => sum + s.episodesWatched, 0);
      } else if (userEntry.media.totalEpisodes && userEntry.media.totalEpisodes > 0) {
        calculatedWatched = userEntry.media.totalEpisodes;
      }
    } else {
      // Vice versa: if all episodes or all seasons are completed, auto-mark completed
      if (Array.isArray(validatedSeasons) && validatedSeasons.length > 0) {
        const allCompleted = validatedSeasons.every((s: any) => s.isCompleted);
        if (allCompleted) {
          finalStatus = "completed";
        }
      } else {
        const total = userEntry.media.totalEpisodes;
        if (total && total > 0 && calculatedWatched >= total) {
          finalStatus = "completed";
        }
      }
    }

    // Update UserMediaEntry
    const updated = await prisma.userMediaEntry.update({
      where: { id: userEntry.id },
      data: {
        status: finalStatus,
        ...(rating !== undefined && { rating: parseRatingInput(rating) }),
        progressCurrent: calculatedWatched,
        ...(validatedSeasons !== undefined && { seasons: validatedSeasons }),
        ...(currentSeason !== undefined && { currentSeason }),
        ...(notes !== undefined && { notes }),
        ...(isFavorite !== undefined && { isFavorite }),
      },
      include: { media: true },
    });

    // Optionally update canonical media details if title, genres, coverImage were provided
    if (title || releaseYear || genres || coverImage) {
      await prisma.media.update({
        where: { id: updated.mediaId },
        data: {
          ...(title && { title: title.trim() }),
          ...(releaseYear && { releaseYear: Number(releaseYear) }),
          ...(genres && { genres }),
          ...(coverImage && { coverImage }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      entry: toMediaItem(updated),
    });
  } catch (error) {
    console.error("[TRACK_API_PUT]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const userId = sessionUser.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id parameter" }, { status: 400 });
    }

    // Find user entry strictly for this user
    const existing = await prisma.userMediaEntry.findFirst({
      where: {
        userId,
        OR: [{ id }, { mediaId: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Entry not found in your library" }, { status: 404 });
    }

    // Delete ONLY from this user's personal library
    await prisma.userMediaEntry.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: `Removed entry ${id} from your library` });
  } catch (error) {
    console.error("[TRACK_API_DELETE]", error);
    return NextResponse.json({ success: false, error: "Failed to delete entry" }, { status: 500 });
  }
}

const VALID_MEDIA_TYPES: MediaType[] = ["anime", "manga", "game", "movie", "series"];

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ success: true, items: [] });
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");

    if (typeParam && !VALID_MEDIA_TYPES.includes(typeParam as MediaType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type parameter: "${typeParam}". Must be one of: ${VALID_MEDIA_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const type = typeParam as MediaType | null;

    // Fetch this user's personal library entries
    const userEntries = await prisma.userMediaEntry.findMany({
      where: {
        userId: sessionUser.id,
        ...(type ? { media: { type } } : {}),
      },
      include: { media: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      items: userEntries.map(toMediaItem),
    });
  } catch (error) {
    console.error("[TRACK_API_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch entries" }, { status: 500 });
  }
}
