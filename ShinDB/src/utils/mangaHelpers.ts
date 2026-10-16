// src/utils/mangaHelpers.ts

/**
 * Calculates average chapters per volume for a manga.
 * If total chapters and total volumes are known: totalChapters / totalVolumes rounded.
 * Otherwise defaults to standard tankōbon average (9 chapters per volume).
 */
export function getChaptersPerVolume(
  totalChapters?: number | null,
  totalVolumes?: number | null
): number {
  if (totalChapters && totalVolumes && totalVolumes > 0) {
    return Math.max(1, Math.round(totalChapters / totalVolumes));
  }
  return 9;
}

/**
 * Converts chapter progress to completed volume count using floor.
 * In-progress volume is represented as Math.floor(chapter / chaptersPerVolume).
 */
export function chapterToVolume(
  chapter: number,
  chaptersPerVolume: number
): number {
  if (chapter <= 0) return 0;
  return Math.floor(chapter / chaptersPerVolume);
}

/**
 * Converts volume progress to total chapters read.
 * Reading through Volume V means reading up to V * chaptersPerVolume.
 */
export function volumeToChapter(
  volume: number,
  chaptersPerVolume: number,
  totalChapters?: number | null
): number {
  if (volume <= 0) return 0;
  const target = volume * chaptersPerVolume;
  return totalChapters && totalChapters > 0 ? Math.min(totalChapters, target) : target;
}
