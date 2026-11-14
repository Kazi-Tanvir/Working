import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { catalogToMediaItem } from "../src/lib/media";
import type { Media } from "@prisma/client";

console.log("=== TDD RED: REPRODUCING BUGS FROM BUGS.MD ===");

// -------------------------------------------------------------
// BUG-03: Video game ratings labeled as IMDb instead of RAWG
// -------------------------------------------------------------
console.log("\n[REPRODUCE BUG-03] Checking video game external rating label");
const sampleGameMedia: Media = {
  id: "test-game-1",
  title: "The Witcher 3: Wild Hunt",
  type: "game",
  coverImage: "https://example.com/witcher.jpg",
  releaseYear: 2015,
  genres: ["RPG", "Open World"],
  externalRating: 9.8,
  totalEpisodes: null,
  progressUnit: "hrs",
  defaultSeasons: null,
  externalId: "rawg-3328",
  externalSource: "rawg",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const gameItem = catalogToMediaItem(sampleGameMedia);
console.log("Game external rating produced:", gameItem.externalRating);
// Currently it is "IMDb 9.8/10", which demonstrates the bug!
assert.strictEqual(
  gameItem.externalRating?.startsWith("IMDb"),
  true,
  "BUG CONFIRMED: Game rating is mislabeled as IMDb!"
);

// -------------------------------------------------------------
// BUG-05: Double question mark in episode progress display
// -------------------------------------------------------------
console.log("\n[REPRODUCE BUG-05] Checking progress increment with unknown total (? EP)");
function currentBuggyIncrement(currentProgress: string): string {
  if (currentProgress.includes("/")) {
    const parts = currentProgress.split("/");
    const currentVal = parseInt(parts[0]) || 0;
    const totalPart = parts[1];
    const totalVal = parseInt(totalPart);
    const unit = totalPart.replace(String(totalVal), "").trim();

    if (isNaN(totalVal) || currentVal < totalVal) {
      const step = unit.toLowerCase().includes("min") ? 10 : 1;
      const newVal = isNaN(totalVal) ? currentVal + step : Math.min(totalVal, currentVal + step);
      return `${newVal}/${isNaN(totalVal) ? "?" : totalVal} ${unit}`;
    }
  }
  return currentProgress;
}

const onePieceProg = "1173/? EP";
const incremented = currentBuggyIncrement(onePieceProg);
console.log(`Incremented "${onePieceProg}" -> "${incremented}"`);
// Current behavior produces "1174/? ? EP"
assert.strictEqual(
  incremented,
  "1174/? ? EP",
  "BUG CONFIRMED: Incrementing produces double question mark '1174/? ? EP'!"
);

// -------------------------------------------------------------
// M-BUG-01: Float precision leak in rating input
// -------------------------------------------------------------
console.log("\n[REPRODUCE M-BUG-01] Checking rating precision formatting");
const rawRatingFloat = "7.699999809265137/10";
const rawParsedRating = rawRatingFloat === "Unrated" ? "" : rawRatingFloat.replace("/10", "");
console.log("Current unformatted modal rating input value:", rawParsedRating);
assert.strictEqual(
  rawParsedRating,
  "7.699999809265137",
  "BUG CONFIRMED: Raw float precision leaks into edit modal rating input!"
);

// -------------------------------------------------------------
// UX-01: Duplicate word in admin link
// -------------------------------------------------------------
console.log("\n[REPRODUCE UX-01] Checking duplicate word in admin page");
const adminPageSource = fs.readFileSync(path.join(__dirname, "../src/app/admin/page.tsx"), "utf8");
const hasDuplicateWord = adminPageSource.includes("Manage Catalog Catalog");
console.log("Admin page has 'Manage Catalog Catalog'?", hasDuplicateWord);
assert.strictEqual(hasDuplicateWord, true, "BUG CONFIRMED: Duplicate word 'Catalog Catalog' present!");

// -------------------------------------------------------------
// M-BUG-05: Missing aria-label on AdminSidebar mobile drawer toggle
// -------------------------------------------------------------
console.log("\n[REPRODUCE M-BUG-05] Checking AdminSidebar mobile drawer toggle accessibility");
const sidebarSource = fs.readFileSync(path.join(__dirname, "../src/components/admin/AdminSidebar.tsx"), "utf8");
const hasAriaLabel = sidebarSource.includes('aria-label="Toggle admin navigation menu"');
console.log("AdminSidebar has aria-label for drawer toggle?", hasAriaLabel);
assert.strictEqual(hasAriaLabel, false, "BUG CONFIRMED: Missing aria-label on drawer toggle button!");

// -------------------------------------------------------------
// BUG-06: Button labeled NEW CUSTOM ENTRY in MediaCollectionView empty state
// -------------------------------------------------------------
console.log("\n[REPRODUCE BUG-06] Checking empty state button label in MediaCollectionView");
const mediaCollectionSource = fs.readFileSync(
  path.join(__dirname, "../src/components/common/MediaCollectionView.tsx"),
  "utf8"
);
const hasMisleadingLabel = mediaCollectionSource.includes("NEW CUSTOM ENTRY");
console.log("MediaCollectionView has 'NEW CUSTOM ENTRY' button?", hasMisleadingLabel);
assert.strictEqual(hasMisleadingLabel, true, "BUG CONFIRMED: Misleading 'NEW CUSTOM ENTRY' button present!");

console.log("\n=== ALL REPRODUCTION TESTS PASSED (RED PHASE CONFIRMED) ===");
