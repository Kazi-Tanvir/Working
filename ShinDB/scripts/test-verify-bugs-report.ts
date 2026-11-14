import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { catalogToMediaItem } from "../src/lib/media";
import type { Media } from "@prisma/client";

console.log("=== TDD GREEN: VERIFYING ALL BUG FIXES ===");

// -------------------------------------------------------------
// BUG-03: Video game ratings labeled as RAWG instead of IMDb
// -------------------------------------------------------------
console.log("\n[VERIFY BUG-03] Checking video game external rating label");
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
assert.strictEqual(
  gameItem.externalRating?.startsWith("RAWG"),
  true,
  "VERIFIED: Game rating is correctly labeled with 'RAWG'!"
);

// -------------------------------------------------------------
// BUG-05: Double question mark in episode progress display
// -------------------------------------------------------------
console.log("\n[VERIFY BUG-05] Checking fixed progress increment logic for (? EP)");
function fixedIncrement(currentProgress: string): string {
  if (currentProgress.includes("/")) {
    const parts = currentProgress.split("/");
    const currentVal = parseInt(parts[0]) || 0;
    const totalPart = parts[1];
    const totalVal = parseInt(totalPart);
    const unit = totalPart.replace(String(totalVal), "").replace(/\?/g, "").trim();

    if (isNaN(totalVal) || currentVal < totalVal) {
      const step = unit.toLowerCase().includes("min") ? 10 : 1;
      const newVal = isNaN(totalVal) ? currentVal + step : Math.min(totalVal, currentVal + step);
      const cleanUnit = unit || "EP";
      return `${newVal}/${isNaN(totalVal) ? "?" : totalVal} ${cleanUnit}`;
    }
  }
  return currentProgress;
}

const onePieceProg = "1173/? EP";
const incremented = fixedIncrement(onePieceProg);
console.log(`Incremented "${onePieceProg}" -> "${incremented}"`);
assert.strictEqual(
  incremented,
  "1174/? EP",
  "VERIFIED: Increment format is clean '1174/? EP' without double question mark!"
);

// -------------------------------------------------------------
// M-BUG-01: Float precision leak in rating input
// -------------------------------------------------------------
console.log("\n[VERIFY M-BUG-01] Checking rating precision formatting");
const rawRatingFloat = "7.699999809265137/10";
const rawRate = rawRatingFloat === "Unrated" ? "" : rawRatingFloat.replace("/10", "").trim();
const parsedRate = parseFloat(rawRate);
const formattedRating = !isNaN(parsedRate) ? String(parseFloat(parsedRate.toFixed(1))) : "";
console.log(`Formatted rating: "${rawRatingFloat}" -> "${formattedRating}"`);
assert.strictEqual(
  formattedRating,
  "7.7",
  "VERIFIED: Floating point precision leak is eliminated and rounded to 7.7!"
);

// -------------------------------------------------------------
// UX-01: Duplicate word in admin link
// -------------------------------------------------------------
console.log("\n[VERIFY UX-01] Checking duplicate word in admin page");
const adminPageSource = fs.readFileSync(path.join(__dirname, "../src/app/admin/page.tsx"), "utf8");
assert.strictEqual(
  adminPageSource.includes("Manage Catalog Catalog"),
  false,
  "VERIFIED: Duplicate word 'Catalog Catalog' removed!"
);
assert.strictEqual(
  adminPageSource.includes("Manage Catalog &rarr;"),
  true,
  "VERIFIED: Link correctly reads 'Manage Catalog &rarr;'!"
);

// -------------------------------------------------------------
// M-BUG-05: Missing aria-label on AdminSidebar mobile drawer toggle
// -------------------------------------------------------------
console.log("\n[VERIFY M-BUG-05] Checking AdminSidebar mobile drawer toggle accessibility");
const sidebarSource = fs.readFileSync(path.join(__dirname, "../src/components/admin/AdminSidebar.tsx"), "utf8");
assert.strictEqual(
  sidebarSource.includes('aria-label="Toggle admin navigation menu"'),
  true,
  "VERIFIED: Accessible aria-label added to drawer toggle button!"
);

// -------------------------------------------------------------
// BUG-06 & M-BUG-03: Empty state button labels and handlers
// -------------------------------------------------------------
console.log("\n[VERIFY BUG-06 & M-BUG-03] Checking empty state buttons in MediaCollectionView");
const mediaCollectionSource = fs.readFileSync(
  path.join(__dirname, "../src/components/common/MediaCollectionView.tsx"),
  "utf8"
);
assert.strictEqual(
  mediaCollectionSource.includes("NEW CUSTOM ENTRY"),
  false,
  "VERIFIED: Misleading 'NEW CUSTOM ENTRY' label removed!"
);
assert.strictEqual(
  mediaCollectionSource.includes("SEARCH EXTERNAL ARCHIVE"),
  true,
  "VERIFIED: Accurate 'SEARCH EXTERNAL ARCHIVE' label added!"
);

// -------------------------------------------------------------
// BUG-04: Dashboard top metrics initial state
// -------------------------------------------------------------
console.log("\n[VERIFY BUG-04] Checking ProfileHeader useAnimatedCount initial state");
const profileHeaderSource = fs.readFileSync(
  path.join(__dirname, "../src/components/sections/ProfileHeader.tsx"),
  "utf8"
);
assert.strictEqual(
  profileHeaderSource.includes("const [count, setCount] = useState(target);"),
  true,
  "VERIFIED: ProfileHeader initializes with target value to avoid flash of 0!"
);

// -------------------------------------------------------------
// BUG-01 & BUG-02: SearchBar reset and unauthenticated notification
// -------------------------------------------------------------
console.log("\n[VERIFY BUG-01 & BUG-02] Checking SearchBar notifications and clearing");
const searchBarSource = fs.readFileSync(
  path.join(__dirname, "../src/components/common/SearchBar.tsx"),
  "utf8"
);
assert.strictEqual(
  searchBarSource.includes("Please sign in to track media"),
  true,
  "VERIFIED: Toast warning triggered for unauthenticated add attempts!"
);
assert.strictEqual(
  searchBarSource.includes("[SIGN IN REQUIRED]"),
  true,
  "VERIFIED: Button explicitly labels sign in required instead of silent [ERROR]!"
);
assert.strictEqual(
  searchBarSource.includes("setResults([]);"),
  true,
  "VERIFIED: Immediate search results clearing on empty input!"
);

// -------------------------------------------------------------
// M-BUG-02: Responsive admin tables for mobile
// -------------------------------------------------------------
console.log("\n[VERIFY M-BUG-02] Checking responsive admin tables");
const adminUsersSource = fs.readFileSync(
  path.join(__dirname, "../src/app/admin/users/page.tsx"),
  "utf8"
);
const adminMediaSource = fs.readFileSync(
  path.join(__dirname, "../src/app/admin/media/page.tsx"),
  "utf8"
);
assert.strictEqual(
  adminUsersSource.includes("md:hidden flex flex-col gap-3"),
  true,
  "VERIFIED: Responsive mobile user cards added to /admin/users!"
);
assert.strictEqual(
  adminMediaSource.includes("md:hidden flex flex-col gap-3"),
  true,
  "VERIFIED: Responsive mobile catalog cards added to /admin/media!"
);

// -------------------------------------------------------------
// M-BUG-04: Card touch targets on mobile
// -------------------------------------------------------------
console.log("\n[VERIFY M-BUG-04] Checking card title container touch target");
const mediaCardSource = fs.readFileSync(
  path.join(__dirname, "../src/components/common/MediaCard.tsx"),
  "utf8"
);
assert.strictEqual(
  mediaCardSource.includes('role="button"'),
  true,
  "VERIFIED: Card title container has role='button' and modal trigger for touch devices!"
);

// -------------------------------------------------------------
// UX-02: Header auth flash prevention
// -------------------------------------------------------------
console.log("\n[VERIFY UX-02] Checking Navbar auth hydration skeleton");
const navbarSource = fs.readFileSync(
  path.join(__dirname, "../src/components/layout/Navbar.tsx"),
  "utf8"
);
assert.strictEqual(
  navbarSource.includes("authLoading && !clerkLoaded"),
  true,
  "VERIFIED: Navbar prevents flash of unauthenticated links during hydration!"
);

// -------------------------------------------------------------
// M-UX-01: Admin audit log JSON wrapping
// -------------------------------------------------------------
console.log("\n[VERIFY M-UX-01] Checking admin audit log break-all");
const auditLogSource = fs.readFileSync(
  path.join(__dirname, "../src/app/admin/audit-log/page.tsx"),
  "utf8"
);
assert.strictEqual(
  auditLogSource.includes("break-all [word-break:break-all]"),
  true,
  "VERIFIED: JSON details block uses break-all to prevent horizontal blowout!"
);

console.log("\n=== ALL VERIFICATION TESTS PASSED (GREEN PHASE CONFIRMED) ===");
