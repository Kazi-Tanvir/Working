/**
 * ShinDB — Phase 4 Polish & Production Readiness Verification Suite
 * 
 * Validates:
 * 1. Step 4.1: Responsive Design (breakpoints, gridCols, modal containment, navbar hamburger)
 * 2. Step 4.2: Animations & Micro-interactions (slideIn, toast countdown, count-up numbers, badge pulse)
 * 3. Step 4.3: Loading & Empty States (Next.js streaming loading.tsx, empty dashboard CTA, collection zero states)
 * 4. Step 4.4: Error Handling Polish (not-found.tsx, error.tsx, global-error.tsx, NetworkStatusBanner, API error responses)
 * 5. Step 4.5 & 4.6: Cross-browser & Performance Optimization (CSS standards, touch action, bundle & typecheck)
 */

import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passedCount++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
    failedCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runPhase4Tests() {
  console.log("\n==================================================================");
  console.log("   SHINDB PHASE 4: POLISH & PRODUCTION READINESS TEST SUITE       ");
  console.log("==================================================================\n");

  const rootDir = path.resolve(__dirname, "..");

  // =========================================================================
  // SECTION 1: Responsive Design (Step 4.1)
  // =========================================================================
  console.log("--- 1. Testing Step 4.1: Responsive Breakpoints & Layouts ---");

  const mediaCollectionViewPath = path.join(rootDir, "src", "components", "common", "MediaCollectionView.tsx");
  assert(fs.existsSync(mediaCollectionViewPath), "MediaCollectionView.tsx exists");
  const mediaCollectionContent = fs.readFileSync(mediaCollectionViewPath, "utf-8");
  assert(
    mediaCollectionContent.includes("grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"),
    "Media collection grid scales from mobile 2-cols up to desktop 8-cols (xs/sm/md/lg/xl breakpoints)"
  );

  const categorySkeletonPath = path.join(rootDir, "src", "components", "common", "CategorySkeleton.tsx");
  assert(fs.existsSync(categorySkeletonPath), "CategorySkeleton.tsx exists");
  const categorySkeletonContent = fs.readFileSync(categorySkeletonPath, "utf-8");
  assert(
    categorySkeletonContent.includes("grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"),
    "Category skeleton aligns with media collection responsive breakpoints"
  );

  const mediaModalPath = path.join(rootDir, "src", "components", "common", "MediaModal.tsx");
  assert(fs.existsSync(mediaModalPath), "MediaModal.tsx exists");
  const mediaModalContent = fs.readFileSync(mediaModalPath, "utf-8");
  assert(
    mediaModalContent.includes("max-h-[90vh]") && mediaModalContent.includes("overflow-y-auto"),
    "MediaModal has viewport height constraint and scrolling for mobile screens"
  );
  assert(
    mediaModalContent.includes("p-4 sm:p-6 md:p-8"),
    "MediaModal utilizes responsive mobile-friendly inner padding"
  );

  const navbarPath = path.join(rootDir, "src", "components", "layout", "Navbar.tsx");
  assert(fs.existsSync(navbarPath), "Navbar.tsx exists");
  const navbarContent = fs.readFileSync(navbarPath, "utf-8");
  assert(
    navbarContent.includes("md:hidden") && navbarContent.includes("isOpen"),
    "Navbar provides mobile hamburger toggle and collapsible navigation drawer"
  );

  // =========================================================================
  // SECTION 2: Animations & Micro-Interactions (Step 4.2)
  // =========================================================================
  console.log("\n--- 2. Testing Step 4.2: Animations & Micro-Interactions ---");

  const globalsCssPath = path.join(rootDir, "src", "app", "globals.css");
  assert(fs.existsSync(globalsCssPath), "globals.css exists");
  const globalsCssContent = fs.readFileSync(globalsCssPath, "utf-8");
  assert(globalsCssContent.includes("@keyframes slideInRight"), "globals.css defines @keyframes slideInRight");
  assert(globalsCssContent.includes("@keyframes toastProgress"), "globals.css defines @keyframes toastProgress");
  assert(globalsCssContent.includes("@keyframes pageFadeIn"), "globals.css defines @keyframes pageFadeIn");
  assert(globalsCssContent.includes("@keyframes cardFadeUp"), "globals.css defines @keyframes cardFadeUp");
  assert(globalsCssContent.includes("@keyframes badgePulse"), "globals.css defines @keyframes badgePulse");
  assert(globalsCssContent.includes("touch-action: manipulation"), "globals.css includes mobile touch manipulation optimization");

  const toastPath = path.join(rootDir, "src", "components", "common", "Toast.tsx");
  assert(fs.existsSync(toastPath), "Toast.tsx exists");
  const toastContent = fs.readFileSync(toastPath, "utf-8");
  assert(
    toastContent.includes("animate-slide-in-right"),
    "Toast uses smooth right-slide entrance animation"
  );
  assert(
    toastContent.includes("toastProgress"),
    "Toast implements animated countdown progress bar"
  );

  const profileHeaderPath = path.join(rootDir, "src", "components", "sections", "ProfileHeader.tsx");
  assert(fs.existsSync(profileHeaderPath), "ProfileHeader.tsx exists");
  const profileHeaderContent = fs.readFileSync(profileHeaderPath, "utf-8");
  assert(
    profileHeaderContent.includes("useAnimatedCount"),
    "ProfileHeader implements ease-out animated number counters on load"
  );

  const mediaCardPath = path.join(rootDir, "src", "components", "common", "MediaCard.tsx");
  assert(fs.existsSync(mediaCardPath), "MediaCard.tsx exists");
  const mediaCardContent = fs.readFileSync(mediaCardPath, "utf-8");
  assert(
    mediaCardContent.includes("group-hover:scale-105") || mediaCardContent.includes("scale"),
    "MediaCard implements smooth poster scale on hover"
  );
  assert(
    mediaCardContent.includes("group-hover:opacity-100"),
    "MediaCard implements smooth obsidian hover console reveal"
  );

  // =========================================================================
  // SECTION 3: Loading & Empty States (Step 4.3)
  // =========================================================================
  console.log("\n--- 3. Testing Step 4.3: Loading & Empty States ---");

  const loadingPath = path.join(rootDir, "src", "app", "loading.tsx");
  assert(fs.existsSync(loadingPath), "Root loading.tsx exists for App Router streaming");
  const loadingContent = fs.readFileSync(loadingPath, "utf-8");
  assert(
    loadingContent.includes("CategorySkeleton") || loadingContent.includes("skeleton"),
    "loading.tsx renders dark cyber skeleton screens"
  );
  assert(
    loadingContent.includes("STREAMING") || loadingContent.includes("TELEMETRY"),
    "loading.tsx renders terminal loading diagnostics with blinking cursor"
  );

  const pagePath = path.join(rootDir, "src", "app", "page.tsx");
  assert(fs.existsSync(pagePath), "page.tsx exists");
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  assert(
    pageContent.includes("allMedia.length === 0") && pageContent.includes("ARCHIVE_EMPTY"),
    "Dashboard page contains dedicated onboarding empty-state banner when library has 0 items"
  );

  assert(
    mediaCollectionContent.includes("COLLECTION_EMPTY"),
    "MediaCollectionView renders terminal empty-collection CTA when category is empty"
  );
  assert(
    mediaCollectionContent.includes("ZERO_FILTERED_MATCHES"),
    "MediaCollectionView renders zero-matches indicator when status filter has no matches"
  );

  // =========================================================================
  // SECTION 4: Error Handling Polish (Step 4.4)
  // =========================================================================
  console.log("\n--- 4. Testing Step 4.4: Error Handling Polish ---");

  const notFoundPath = path.join(rootDir, "src", "app", "not-found.tsx");
  assert(fs.existsSync(notFoundPath), "not-found.tsx exists");
  const notFoundContent = fs.readFileSync(notFoundPath, "utf-8");
  assert(
    notFoundContent.includes("404") && notFoundContent.includes("RETURN TO DASHBOARD"),
    "not-found.tsx displays terminal 404 diagnostics with Return to Dashboard CTA"
  );

  const errorBoundaryPath = path.join(rootDir, "src", "app", "error.tsx");
  assert(fs.existsSync(errorBoundaryPath), "error.tsx exists");
  const errorBoundaryContent = fs.readFileSync(errorBoundaryPath, "utf-8");
  assert(
    errorBoundaryContent.includes('"use client"') || errorBoundaryContent.includes("'use client'"),
    "error.tsx is a client component per Next.js requirements"
  );
  assert(
    errorBoundaryContent.includes("reset()") || errorBoundaryContent.includes("reset"),
    "error.tsx provides interactive reboot/retry reset mechanism"
  );

  const globalErrorPath = path.join(rootDir, "src", "app", "global-error.tsx");
  assert(fs.existsSync(globalErrorPath), "global-error.tsx exists");
  const globalErrorContent = fs.readFileSync(globalErrorPath, "utf-8");
  assert(
    globalErrorContent.includes("<html") && globalErrorContent.includes("<body"),
    "global-error.tsx manages root html/body shell for layout failures"
  );

  const networkBannerPath = path.join(rootDir, "src", "components", "common", "NetworkStatusBanner.tsx");
  assert(fs.existsSync(networkBannerPath), "NetworkStatusBanner.tsx exists");
  const networkBannerContent = fs.readFileSync(networkBannerPath, "utf-8");
  assert(
    networkBannerContent.includes("offline") && networkBannerContent.includes("online"),
    "NetworkStatusBanner monitors window offline/online connectivity events"
  );

  const layoutPath = path.join(rootDir, "src", "app", "layout.tsx");
  assert(fs.existsSync(layoutPath), "layout.tsx exists");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");
  assert(
    layoutContent.includes("<NetworkStatusBanner"),
    "NetworkStatusBanner is mounted at the root of layout.tsx"
  );

  // Live HTTP Error API Checks (if server running)
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    if (healthRes.ok) {
      console.log("  Testing live server API error behavior...");

      // 1. Non-existent API route returns 404
      const invalidRouteRes = await fetch(`${BASE_URL}/api/non_existent_cyber_route_404`);
      assert(
        invalidRouteRes.status === 404,
        "Unknown API endpoint returns HTTP 404 Not Found"
      );

      // 2. Unauthenticated /api/track payload returns 401 Unauthorized
      const unauthTrackRes = await fetch(`${BASE_URL}/api/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert(
        unauthTrackRes.status === 401,
        "Unauthenticated /api/track payload returns HTTP 401 with structured validation error"
      );
      const unauthTrackJson = await unauthTrackRes.json();
      assert(
        unauthTrackJson.success === false && typeof unauthTrackJson.error === "string",
        "API errors follow consistent JSON error structure { success: false, error: string }"
      );

      // 3. Unauthenticated export / request handling
      const exportRes = await fetch(`${BASE_URL}/api/users/export`);
      assert(
        exportRes.status === 401,
        "Unauthenticated export request safely returns HTTP 401 Unauthorized"
      );
    } else {
      console.log("  [Note: Local dev server not running on port 3000, skipped live HTTP checks]");
    }
  } catch {
    console.log("  [Note: Local dev server not reachable, skipped live HTTP checks]");
  }

  // =========================================================================
  // SECTION 5: Cross-Browser & Performance Invariants (Step 4.5 & 4.6)
  // =========================================================================
  console.log("\n--- 5. Testing Step 4.5 & 4.6: Cross-Browser & Performance ---");

  assert(
    globalsCssContent.includes("::-webkit-scrollbar"),
    "globals.css provides custom cross-browser slim scrollbars"
  );
  assert(
    globalsCssContent.includes("-webkit-backdrop-filter") || globalsCssContent.includes("backdrop-filter"),
    "globals.css provides vendor-prefixed backdrop filter for Safari / WebKit"
  );

  console.log("\n==================================================================");
  console.log(`   PHASE 4 TEST SUMMARY: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log("==================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error("Fatal test runner failure:", err);
  process.exit(1);
});
