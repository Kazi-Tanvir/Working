import React from "react";
import fs from "fs/promises";
import path from "path";
import { MediaItem } from "@/components/common/MediaCard";
import SeriesClientView from "./SeriesClientView";

// Load local series JSON dataset
async function loadSeriesData(): Promise<MediaItem[]> {
  try {
    const filePath = path.join(process.cwd(), "src", "database", "series.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent) as MediaItem[];
  } catch (e) {
    console.error("Failed to load series.json", e);
    return [];
  }
}

export default async function SeriesPage() {
  const initialItems = await loadSeriesData();

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <SeriesClientView initialItems={initialItems} />
    </div>
  );
}
