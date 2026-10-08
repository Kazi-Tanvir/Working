import React from "react";
import fs from "fs/promises";
import path from "path";
import { MediaItem } from "@/components/common/MediaCard";
import AnimeClientView from "./AnimeClientView";

// Load local anime JSON dataset
async function loadAnimeData(): Promise<MediaItem[]> {
  try {
    const filePath = path.join(process.cwd(), "src", "database", "anime.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent) as MediaItem[];
  } catch (e) {
    console.error("Failed to load anime.json", e);
    return [];
  }
}

export default async function AnimePage() {
  const initialItems = await loadAnimeData();

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <AnimeClientView initialItems={initialItems} />
    </div>
  );
}
