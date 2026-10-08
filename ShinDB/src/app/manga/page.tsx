import React from "react";
import fs from "fs/promises";
import path from "path";
import { MediaItem } from "@/components/common/MediaCard";
import MangaClientView from "./MangaClientView";

// Load local manga JSON dataset
async function loadMangaData(): Promise<MediaItem[]> {
  try {
    const filePath = path.join(process.cwd(), "src", "database", "manga.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent) as MediaItem[];
  } catch (e) {
    console.error("Failed to load manga.json", e);
    return [];
  }
}

export default async function MangaPage() {
  const initialItems = await loadMangaData();

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <MangaClientView initialItems={initialItems} />
    </div>
  );
}
