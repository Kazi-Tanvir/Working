import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Map search result types to the correct JSON filename
function getDbFilename(type: string): string {
  switch (type) {
    case "anime": return "anime.json";
    case "manga": return "manga.json";
    case "game":  return "games.json";
    case "movie": return "movies.json";
    case "series": return "series.json";
    default: return "anime.json";
  }
}

// Map search result types to a sensible default status
function getDefaultStatus(type: string): string {
  switch (type) {
    case "anime":
    case "series":
    case "movie":  return "Plan to Watch";
    case "manga":  return "Plan to Read";
    case "game":   return "Plan to Play";
    default:       return "Plan to Watch";
  }
}

// Map search result types to a sensible default progress string
function getDefaultProgress(type: string): string {
  switch (type) {
    case "anime":  return "0/? EP";
    case "manga":  return "0/? CH";
    case "game":   return "0 hrs";
    case "movie":  return "0 mins";
    case "series": return "S1E01";
    default:       return "0/?";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, releaseYear, coverImage, rating, status, progress, genres } = body;

    if (!title || !type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title and type" },
        { status: 400 }
      );
    }

    const filename = getDbFilename(type);
    const filePath = path.join(process.cwd(), "src", "database", filename);

    // Read the existing collection
    let collection: any[] = [];
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      collection = JSON.parse(fileContent);
    } catch {
      // If file doesn't exist or is corrupt, start fresh
      collection = [];
    }

    // Check for duplicates by title (case-insensitive)
    const alreadyExists = collection.some(
      (item) => item.title.toLowerCase() === title.toLowerCase()
    );

    if (alreadyExists) {
      return NextResponse.json(
        { success: false, error: "Item already exists in your local database" },
        { status: 409 }
      );
    }

    // Generate a unique ID based on the type prefix and a timestamp
    const prefix = type.charAt(0);
    const uniqueSuffix = Date.now().toString(36);
    const newId = `${prefix}-${uniqueSuffix}`;

    // Build the new entry matching the MediaItem schema
    const newEntry = {
      id: newId,
      title,
      rating: rating || "N/A",
      status: status || getDefaultStatus(type),
      coverImage: coverImage || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
      progress: progress || getDefaultProgress(type),
      genres: genres || [],
      releaseYear: releaseYear ? parseInt(releaseYear, 10) : new Date().getFullYear(),
      type: type === "game" ? "game" : type, // Ensure type matches schema
    };

    // Append to collection and write back
    collection.push(newEntry);
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: `"${title}" added to ${filename}`,
      entry: newEntry,
    });
  } catch (error: any) {
    console.error("[TRACK_API] Failed to add item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, status, progress, rating, title, releaseYear, genres, coverImage } = body;

    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: id and type" },
        { status: 400 }
      );
    }

    const filename = getDbFilename(type);
    const filePath = path.join(process.cwd(), "src", "database", filename);

    // Read the existing collection
    let collection: any[] = [];
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      collection = JSON.parse(fileContent);
    } catch {
      return NextResponse.json(
        { success: false, error: `Database file ${filename} not found` },
        { status: 404 }
      );
    }

    // Find the item index
    const index = collection.findIndex((item) => item.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: `Item with id ${id} not found in ${filename}` },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (status !== undefined) collection[index].status = status;
    if (progress !== undefined) collection[index].progress = progress;
    if (rating !== undefined) collection[index].rating = rating;
    if (title !== undefined) collection[index].title = title;
    if (releaseYear !== undefined) collection[index].releaseYear = parseInt(releaseYear, 10);
    if (genres !== undefined) collection[index].genres = genres;
    if (coverImage !== undefined) collection[index].coverImage = coverImage;

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: `Item ${id} updated in ${filename}`,
      entry: collection[index],
    });
  } catch (error: any) {
    console.error("[TRACK_API_UPDATE] Failed to update item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameters: id and type" },
        { status: 400 }
      );
    }

    const filename = getDbFilename(type);
    const filePath = path.join(process.cwd(), "src", "database", filename);

    // Read the existing collection
    let collection: any[] = [];
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      collection = JSON.parse(fileContent);
    } catch {
      return NextResponse.json(
        { success: false, error: `Database file ${filename} not found` },
        { status: 404 }
      );
    }

    const initialLength = collection.length;
    const filtered = collection.filter((item) => item.id !== id);

    if (filtered.length === initialLength) {
      return NextResponse.json(
        { success: false, error: `Item with id ${id} not found in ${filename}` },
        { status: 404 }
      );
    }

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(filtered, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: `Item ${id} deleted from ${filename}`
    });
  } catch (error: any) {
    console.error("[TRACK_API_DELETE] Failed to delete item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

