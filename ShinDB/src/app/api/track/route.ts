// src/app/api/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { MediaType, MediaStatus, ProgressUnit } from "@prisma/client";
import { toMediaItem } from "@/lib/media";

const CreateTrackSchema = z.object({
  title: z.string().min(1).max(250),
  type: z.enum(["anime", "manga", "game", "movie", "series"]),
  releaseYear: z.union([z.number(), z.string()]).optional(),
  coverImage: z.string().optional(),
  rating: z.string().optional(),
  status: z.string().optional(),
  progress: z.string().optional(),
  genres: z.array(z.string()).optional(),
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
  if (s === "reading" || type === "manga") return "reading";
  if (s === "playing" || type === "game") return "playing";
  return "watching";
}

function parseRatingInput(rating?: string): number | null {
  if (!rating || rating === "N/A") return null;
  const num = parseFloat(rating.split("/")[0]);
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

  if (progress.includes("/")) {
    const [curr, tot] = progress.split("/");
    const totalMatch = tot.match(/\d+/);
    return {
      progressCurrent: parseInt(curr, 10) || 0,
      progressTotal: totalMatch ? parseInt(totalMatch[0], 10) : null,
      progressUnit: unit,
    };
  }

  const seMatch = progress.match(/S(\d+)E(\d+)/i);
  if (seMatch) {
    return {
      progressCurrent: parseInt(seMatch[2], 10) || 0,
      progressTotal: null,
      progressUnit: "ep",
    };
  }

  return {
    progressCurrent: parseInt(progress, 10) || 0,
    progressTotal: null,
    progressUnit: unit,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateTrackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { title, type, releaseYear, coverImage, rating, status, progress, genres } = parsed.data;
    const prog = parseProgressInput(progress, type);

    const created = await prisma.mediaEntry.create({
      data: {
        title: title.trim(),
        type,
        status: normalizeStatusInput(status, type),
        rating: parseRatingInput(rating),
        progressCurrent: prog.progressCurrent,
        progressTotal: prog.progressTotal,
        progressUnit: prog.progressUnit,
        genres: genres || [],
        coverImage:
          coverImage ||
          "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
        releaseYear: releaseYear ? Number(releaseYear) : new Date().getFullYear(),
      },
    });

    return NextResponse.json({
      success: true,
      entry: toMediaItem(created),
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, error: "Item already exists in your MySQL database" },
        { status: 409 }
      );
    }
    console.error("[TRACK_API_POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = UpdateTrackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid update payload" },
        { status: 400 }
      );
    }

    const { id, type, status, progress, rating, title, releaseYear, genres, coverImage } =
      parsed.data;

    const existing = await prisma.mediaEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 });
    }

    const mediaType = (type as MediaType) || existing.type;
    const prog = progress !== undefined ? parseProgressInput(progress, mediaType) : undefined;

    const updated = await prisma.mediaEntry.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(status !== undefined && { status: normalizeStatusInput(status, mediaType) }),
        ...(rating !== undefined && { rating: parseRatingInput(rating) }),
        ...(prog !== undefined && {
          progressCurrent: prog.progressCurrent,
          ...(prog.progressTotal !== null && { progressTotal: prog.progressTotal }),
        }),
        ...(releaseYear !== undefined && { releaseYear: Number(releaseYear) }),
        ...(genres !== undefined && { genres }),
        ...(coverImage !== undefined && { coverImage }),
      },
    });

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id parameter" }, { status: 400 });
    }

    await prisma.mediaEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: `Deleted entry ${id}` });
  } catch (error) {
    console.error("[TRACK_API_DELETE]", error);
    return NextResponse.json({ success: false, error: "Failed to delete entry" }, { status: 500 });
  }
}
