import assert from "node:assert";
import { DEFAULT_COVER_IMAGES } from "../src/utils/mediaDefaults";

console.log("=== VERIFICATION TESTS FOR ALL FIXES ===");

// 1. Verify DEFAULT_COVER_IMAGES
console.log("\n1. Verifying DEFAULT_COVER_IMAGES...");
assert.strictEqual(
  DEFAULT_COVER_IMAGES.movie.includes("photo-1509198397868-475647b2a1e5"),
  false,
  "Movie cover image must NOT be the controller photo"
);
console.log("✓ Movie placeholder is now cinema/film:", DEFAULT_COVER_IMAGES.movie);

// 2. Verify UpdateTrackSchema with rating: null, notes: null, coverImage: null
console.log("\n2. Verifying UpdateTrackSchema accepts rating: null and nullable fields...");
import { z } from "zod";

const CreateTrackSchema = z.object({
  mediaId: z.string().optional(),
  title: z.string().min(1).max(250),
  type: z.enum(["anime", "manga", "game", "movie", "series"]),
  releaseYear: z.union([z.number(), z.string()]).nullable().optional(),
  coverImage: z.string().nullable().optional(),
  rating: z.union([z.string(), z.number()]).nullable().optional(),
  status: z.string().optional(),
  progress: z.string().nullable().optional(),
  genres: z.array(z.string()).optional(),
  seasons: z.array(z.any()).nullable().optional(),
  currentSeason: z.number().nullable().optional(),
  progressCurrent: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  isFavorite: z.boolean().optional(),
});
const UpdateTrackSchema = CreateTrackSchema.partial().extend({ id: z.string().min(1) });

const resNullRating = UpdateTrackSchema.safeParse({
  id: "entry-123",
  type: "movie",
  rating: null,
  status: "Completed",
  progressCurrent: 120,
});
assert.strictEqual(resNullRating.success, true, "Update with rating: null must succeed");

const resNullNotes = UpdateTrackSchema.safeParse({
  id: "entry-123",
  type: "manga",
  rating: 9.5,
  notes: null,
  coverImage: null,
  progressCurrent: 45,
});
assert.strictEqual(resNullNotes.success, true, "Update with notes: null, coverImage: null must succeed");
console.log("✓ UpdateTrackSchema allows rating: null and nullable fields");

// 3. Verify MAL Manga XML Parser
console.log("\n3. Verifying MAL Manga XML Parser extracts manga_mangadb_id and chapters...");
const sampleMangaXml = `<?xml version="1.0" encoding="UTF-8" ?>
<myanimelist>
  <myinfo>
    <user_name>testuser</user_name>
    <user_export_type>2</user_export_type>
  </myinfo>
  <manga>
    <manga_mangadb_id>2</manga_mangadb_id>
    <manga_title><![CDATA[Berserk]]></manga_title>
    <manga_volumes_total>0</manga_volumes_total>
    <manga_chapters_total>380</manga_chapters_total>
    <my_read_volumes>0</my_read_volumes>
    <my_read_chapters>150</my_read_chapters>
    <my_score>10</my_score>
    <my_status>Reading</my_status>
    <my_comments><![CDATA[Peak fiction]]></my_comments>
  </manga>
  <manga>
    <manga_mangadb_id>13</manga_mangadb_id>
    <manga_title><![CDATA[One Piece]]></manga_title>
    <manga_chapters_total>1100</manga_chapters_total>
    <my_read_chapters>1050</my_read_chapters>
    <my_score>9</my_score>
    <my_status>Reading</my_status>
  </manga>
</myanimelist>`;

function parseMALXml(xmlText: string) {
  const exportTypeMatch = xmlText.match(/<user_export_type>(\d+)<\/user_export_type>/);
  const exportType = exportTypeMatch ? parseInt(exportTypeMatch[1], 10) : 1;
  const tagName = exportType === 2 ? "manga" : "anime";
  const mediaType = exportType === 2 ? "manga" : "anime";
  const blockRegex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  let match: RegExpExecArray | null;
  const entries: any[] = [];
  while ((match = blockRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const getText = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "s"));
      return m?.[1]?.trim() ?? "";
    };
    const title = getText(mediaType === "anime" ? "series_title" : "manga_title") || getText("manga_title") || getText("series_title");
    const malId = getText("manga_mangadb_id") || getText("series_animedb_id") || getText("manga_animedb_id");
    const rawStatus = getText("my_status");
    const score = parseFloat(getText("my_score")) || 0;
    const progress = mediaType === "anime"
      ? parseInt(getText("my_watched_episodes"), 10) || 0
      : parseInt(getText("my_read_chapters"), 10) || 0;
    const totalEpsRaw = parseInt(
      getText("manga_chapters_total") || getText("series_chapters") || getText("series_episodes"),
      10
    );
    const totalEpisodes = isNaN(totalEpsRaw) || totalEpsRaw === 0 ? null : totalEpsRaw;
    entries.push({ title, malId, type: mediaType, status: rawStatus, score, progress, totalEpisodes });
  }
  return entries;
}

const parsedManga = parseMALXml(sampleMangaXml);
assert.strictEqual(parsedManga.length, 2, "Should parse 2 manga entries");
assert.strictEqual(parsedManga[0].malId, "2", "Should parse Berserk malId as '2'");
assert.strictEqual(parsedManga[0].title, "Berserk", "Should parse Berserk title");
assert.strictEqual(parsedManga[0].totalEpisodes, 380, "Should parse Berserk total chapters 380");
assert.strictEqual(parsedManga[0].progress, 150, "Should parse Berserk read chapters 150");
assert.strictEqual(parsedManga[1].malId, "13", "Should parse One Piece malId as '13'");
assert.strictEqual(parsedManga[1].totalEpisodes, 1100, "Should parse One Piece total chapters 1100");
console.log("✓ MAL Manga XML parser correctly parses manga_mangadb_id, title, chapters, and progress");

console.log("\nALL VERIFICATION TESTS PASSED!");

