import assert from "node:assert";
import { z } from "zod";
import { DEFAULT_COVER_IMAGES } from "../src/utils/mediaDefaults";

console.log("=== TDD REPRODUCTION TESTS ===");

// TEST 1: UpdateTrackSchema with rating: null
console.log("\n[TEST 1] Testing PUT update validation with rating: null (Edit modal save)");
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
const CurrentUpdateSchema = CreateTrackSchema.partial().extend({ id: z.string().min(1) });

const editModalPayload = {
  id: "cm12345",
  type: "movie" as const,
  rating: null,
  status: "Completed",
  progressCurrent: 120,
  coverImage: "https://image.tmdb.org/t/p/w500/test.jpg",
  notes: "Watched with friends",
};

const currentResult = CurrentUpdateSchema.safeParse(editModalPayload);
console.log("Current schema result on rating: null -> success:", currentResult.success);
// This demonstrates the bug!
assert.strictEqual(currentResult.success, false, "Current schema MUST fail on rating: null");

// TEST 2: MAL Manga XML parsing
console.log("\n[TEST 2] Testing MAL Manga XML parsing with standard MAL tags");
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
</myanimelist>`;

// Simulating current buggy parser
function buggyParseMALXml(xmlText: string) {
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
    const title = getText(mediaType === "anime" ? "series_title" : "manga_title");
    // BUG: Looking for manga_animedb_id instead of manga_mangadb_id!
    const malId = getText("series_animedb_id") || getText("manga_animedb_id");
    entries.push({ title, malId, type: mediaType });
  }
  return entries;
}

const buggyParsed = buggyParseMALXml(sampleMangaXml);
console.log("Buggy parser result for malId:", buggyParsed[0]?.malId);
assert.strictEqual(buggyParsed[0]?.malId, "", "Buggy parser fails to extract malId for manga!");

// TEST 3: Default Movie cover image must NOT be a game controller
console.log("\n[TEST 3] Testing DEFAULT_COVER_IMAGES for movie");
console.log("Current movie default cover:", DEFAULT_COVER_IMAGES.movie);
// photo-1509198397868-475647b2a1e5 is the PS4 controller
const isController = DEFAULT_COVER_IMAGES.movie.includes("photo-1509198397868-475647b2a1e5");
console.log("Is current movie cover image a game controller photo?", isController);
assert.strictEqual(isController, true, "Current movie default image is indeed the controller photo!");

console.log("\n✓ All 3 reproduction tests confirmed the bugs!");

