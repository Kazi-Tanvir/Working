import React from "react";
import fs from "fs/promises";
import path from "path";
import { MediaItem } from "@/components/common/MediaCard";
import GamesClientView from "./GamesClientView";

// Load local games JSON dataset
async function loadGamesData(): Promise<MediaItem[]> {
  try {
    const filePath = path.join(process.cwd(), "src", "database", "games.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent) as MediaItem[];
  } catch (e) {
    console.error("Failed to load games.json", e);
    return [];
  }
}

export default async function GamesPage() {
  const initialItems = await loadGamesData();

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <GamesClientView initialItems={initialItems} />
    </div>
  );
}
