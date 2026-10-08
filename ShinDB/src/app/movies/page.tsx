import React from "react";
import fs from "fs/promises";
import path from "path";
import { MediaItem } from "@/components/common/MediaCard";
import MoviesClientView from "./MoviesClientView";

// Load local movies JSON dataset
async function loadMoviesData(): Promise<MediaItem[]> {
  try {
    const filePath = path.join(process.cwd(), "src", "database", "movies.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent) as MediaItem[];
  } catch (e) {
    console.error("Failed to load movies.json", e);
    return [];
  }
}

export default async function MoviesPage() {
  const initialItems = await loadMoviesData();

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <MoviesClientView initialItems={initialItems} />
    </div>
  );
}
