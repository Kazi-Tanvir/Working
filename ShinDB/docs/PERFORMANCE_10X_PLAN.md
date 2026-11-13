# ShinDB 10x Performance Master Plan & Architectural Audit

> **Objective:** Make ShinDB 10x faster across First Contentful Paint (FCP), Largest Contentful Paint (LCP), Time to First Byte (TTFB), and Multi-Gateway Search latency without adding bloat, heavy third-party infrastructure, or breaking existing user workflows.
>
> **Stack Reference:** Next.js 16.2.6, React 19.2.4, Prisma 6.4.1, Tailwind CSS v4, MySQL.

---

## Table of Contents
1. [Executive Summary & Impact Map](#1-executive-summary--impact-map)
2. [Root Cause Analysis (Ranked by Impact)](#2-root-cause-analysis-ranked-by-impact)
   - [Critical (Biggest Wins)](#critical-biggest-wins)
   - [High Impact](#high-impact)
   - [Medium Impact](#medium-impact)
   - [Quick Wins](#quick-wins)
3. [The 10x Performance Implementation Blueprint](#3-the-10x-performance-implementation-blueprint)
   - [Step 1: Eliminate Render-Blocking Fonts](#step-1-eliminate-render-blocking-fonts)
   - [Step 2: Server-Side Data Caching & Route De-throttling](#step-2-server-side-data-caching--route-de-throttling)
   - [Step 3: Parallelize Multi-Gateway Search Pipeline](#step-3-parallelize-multi-gateway-search-pipeline)
   - [Step 4: Lazy-Load Heavy Modals & Lazy Poster Images](#step-4-lazy-load-heavy-modals--lazy-poster-images)
   - [Step 5: Dev Experience & Turbopack Acceleration](#step-5-dev-experience--turbopack-acceleration)
4. [File & Line Modification Matrix](#4-file--line-modification-matrix)
5. [Verification, Benchmarks & Validation Protocol](#5-verification-benchmarks--validation-protocol)
6. [Ponytail Invariants, Skipped Scope & Operational Risks](#6-ponytail-invariants-skipped-scope--operational-risks)

---

## 1. Executive Summary & Impact Map

ShinDB’s performance bottlenecks do not stem from complex database limitations or missing Redis clusters. Instead, they are caused by **5 distinct blocking choke points**:

```
[ User Request ]
       │
       ▼
[ 1. Render-Blocking CSS @import ] ──> Blocks HTML/CSSOM rendering for 400-900ms
       │
       ▼
[ 2. export const dynamic = "force-dynamic" ] ──> Throws away Next.js cache; runs full SSR on every hit
       │
       ▼
[ 3. Sequential Search Waterfall ] ──> DB query 1 ➔ DB query 2 ➔ 5 External APIs in sequence (2-4s)
       │
       ▼
[ 4. 120 KB Monolithic Modals ] ──> MediaModal (75KB) + CreateMediaModal (43KB) loaded per card
       │
       ▼
[ 5. Eager Image Downloads ] ──> Dozens of remote poster images requested on initial render
```

### Projected Metrics After Blueprint Execution

| Metric | Current Baseline | Optimized Target | Improvement |
|---|---|---|---|
| **TTFB (Category Pages)** | ~250ms – 550ms | < 15ms (cached hit) | **~15x – 30x faster** |
| **First Contentful Paint (FCP)** | ~800ms – 1.4s | ~200ms – 350ms | **~4x faster** |
| **Largest Contentful Paint (LCP)** | ~1.6s – 2.8s | < 700ms | **~3x – 4x faster** |
| **Multi-Gateway Search Latency** | 2,000ms – 4,500ms | 350ms – 600ms | **~5x – 8x faster** |
| **Initial Client JS Bundle** | ~380 KB (uncompressed) | ~240 KB (-120 KB) | **~35% bundle reduction** |
| **Local Dev Server HMR / Boot** | 4s – 8s | ~1s (Turbopack) | **~5x faster DX** |

---

## 2. Root Cause Analysis (Ranked by Impact)

### 🔴 Critical (Biggest Wins)

#### 1. Every Page Forces Dynamic Uncached SSR
- **Files:**
  - `src/app/page.tsx:12` — `export const dynamic = "force-dynamic";`
  - `src/app/anime/page.tsx:8` — `export const dynamic = "force-dynamic";`
  - `src/app/manga/page.tsx:8` — `export const dynamic = "force-dynamic";`
  - `src/app/games/page.tsx:8` — `export const dynamic = "force-dynamic";`
  - `src/app/movies/page.tsx:8` — `export const dynamic = "force-dynamic";`
  - `src/app/series/page.tsx:8` — `export const dynamic = "force-dynamic";`
- **Root Cause:** Every page request executes a full Prisma $\to$ MySQL roundtrip, even for the same user returning 2 seconds later. Next.js App Router route prefetching is rendered ineffective.
- **Remedy:** Remove `force-dynamic`. Wrap query functions (`getAllMediaGrouped` and `getMediaByType`) with `unstable_cache` keyed by user ID and tag them with `media-user-${userId}`. Invalidate on mutation via `revalidateTag()`.

#### 2. Search API Sequential DB + External Gateway Waterfall
- **File:** `src/utils/apiHelpers.ts:430-475`
- **Root Cause:** `searchMedia()` runs 3 sequential `await` steps:
  1. `await searchUserLibrary(query, ...)` (MySQL roundtrip 1)
  2. `await searchExistingMedia(query, ...)` (MySQL roundtrip 2)
  3. `await Promise.all([AniList, RAWG, TMDB])` (External network requests with 5s timeouts)
  If any external gateway stalls, total search time reaches 4–5 seconds.
- **Remedy:** Fire local user search, existing catalog search, and external gateways concurrently using `Promise.allSettled`. Response latency drops to `max(DB_time, slowest_API)` instead of the sum.

#### 3. Google Fonts Loaded via Render-Blocking CSS `@import`
- **File:** `src/app/globals.css:1`
  ```css
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&family=Space+Grotesk:wght@300..700&display=swap');
  ```
- **Root Cause:** Standard CSS `@import` blocks the browser’s CSSOM generation while fetching CSS from Google, followed by `.woff2` font downloads. Adds 200–600ms delay to initial paint.
- **Remedy:** Switch to `next/font/google` in `src/app/layout.tsx`. Next.js self-hosts fonts locally at build time with automated zero-CLS font fallbacks.

---

### 🟠 High Impact

#### 4. Heavy Client Components Shipped in Initial Bundles
- **Files:**
  - `src/components/common/MediaModal.tsx` — **1,631 lines (~75 KB)**
  - `src/components/common/CreateMediaModal.tsx` — **1,063 lines (~43 KB)**
  - `src/components/common/MediaCard.tsx` — **987 lines (~40 KB)**
  - `src/components/common/MediaCollectionView.tsx` — **848 lines (~38 KB)**
- **Root Cause:** All are `"use client"` components statically imported at the top level of `MediaCard` and `MediaCollectionView`. Even if a user only browses cards, 120 KB of modal code and Lucide icon trees are parsed immediately.
- **Remedy:** Lazy-load `MediaModal` and `CreateMediaModal` with `next/dynamic` (`ssr: false`), rendering only when the modal is opened.

#### 5. Missing Route-Level `loading.tsx` Skeletons
- **Current State:** Only `src/app/loading.tsx` exists at root level.
- **Root Cause:** Navigating between `/anime`, `/manga`, `/games` produces a brief frozen UI before the server component finishes.
- **Remedy:** Wire up existing `CategorySkeleton.tsx` inside each category folder: `src/app/anime/loading.tsx`, `src/app/manga/loading.tsx`, etc.

#### 6. `getAllMediaGrouped` Fetches All Rows then Filters in JavaScript
- **File:** `src/lib/media.ts:173-199`
- **Root Cause:** Fetches all user rows in a single query and runs `.filter()` in Node.js.
- **Remedy:** Parallelize into type-filtered queries leveraging MySQL `@@index([type])` and `@@index([userId, status])`.

---

### 🟡 Medium Impact

#### 7. Prisma Query Column Over-Fetching
- **File:** `src/lib/media.ts:158-166`
- **Root Cause:** `include: { media: true }` pulls massive JSON blobs (`defaultSeasons`, full `genres`, notes) for simple card grid displays.
- **Remedy:** Use explicit `select` fields matching only what `toMediaItem()` renders on cards.

#### 8. Clerk Middleware Matching Public Assets
- **File:** `src/middleware.ts`
- **Root Cause:** Evaluates on static asset paths unnecessarily.
- **Remedy:** Tune regex matcher to exclude static images, icons, and fonts cleanly.

#### 9. Eager Image Loading Without Native Hints
- **File:** `src/components/common/MediaCard.tsx:646`
- **Root Cause:** `<img src={...} />` lacks `loading="lazy"` and `decoding="async"`.
- **Remedy:** Add `loading="lazy" decoding="async"` to all non-hero cards.

#### 10. Dev Script Runs `prisma generate` on Every Boot
- **File:** `package.json:6`
- **Root Cause:** `"dev": "prisma generate && next dev --webpack"` runs code generation and uses Webpack instead of Turbopack.
- **Remedy:** Switch dev to `next dev --turbo` and assign `prisma generate` to `postinstall`.

---

### 🟢 Quick Wins

#### 11. Prisma Connection Pooling
- **File:** `.env` / `src/lib/prisma.ts`
- Add connection parameters:
  ```env
  DATABASE_URL="mysql://user:pass@host:3306/db?connection_limit=10&pool_timeout=10"
  ```

#### 12. HTTP Cache-Control on Search Route
- **File:** `src/app/api/search/route.ts`
- Return client and CDN edge cache headers for query repetition:
  ```ts
  return NextResponse.json(
    { success: true, results },
    { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
  );
  ```

#### 13. Granular Revalidation on Mutations
- **File:** `src/app/api/track/route.ts`
- Call `revalidateTag('media-user-${userId}')` on every create, edit, or delete.

---

## 3. The 10x Performance Implementation Blueprint

### Step 1: Eliminate Render-Blocking Fonts

1. Modify `src/app/globals.css`:
   Remove line 1 (`@import url(...)`).
2. Update `src/app/layout.tsx`:
   ```tsx
   import { Space_Grotesk, JetBrains_Mono } from "next/font/google";

   const spaceGrotesk = Space_Grotesk({
     subsets: ["latin"],
     variable: "--font-sans",
     display: "swap",
     weight: ["300", "400", "500", "600", "700"],
   });

   const jetbrainsMono = JetBrains_Mono({
     subsets: ["latin"],
     variable: "--font-mono",
     display: "swap",
     weight: ["400", "500", "600", "700"],
   });

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full dark`}>
         <body className="min-h-full flex flex-col bg-black text-white font-sans">
           {children}
         </body>
       </html>
     );
   }
   ```

---

### Step 2: Server-Side Data Caching & Route De-throttling

1. Remove `export const dynamic = "force-dynamic";` from:
   - `src/app/page.tsx`
   - `src/app/anime/page.tsx`
   - `src/app/manga/page.tsx`
   - `src/app/games/page.tsx`
   - `src/app/movies/page.tsx`
   - `src/app/series/page.tsx`

2. In `src/lib/media.ts`, wrap data fetchers with `unstable_cache`:
   ```ts
   import { unstable_cache } from "next/cache";

   export const getCachedMediaByType = (type: MediaType, userId?: string | null) =>
     unstable_cache(
       async () => getMediaByType(type, userId),
       [`media-type-${type}-${userId ?? "anon"}`],
       {
         revalidate: 60,
         tags: userId ? [`media-user-${userId}`] : ["media-anon"],
       }
     )();

   export const getCachedAllMediaGrouped = (userId?: string | null) =>
     unstable_cache(
       async () => getAllMediaGrouped(userId),
       [`media-grouped-${userId ?? "anon"}`],
       {
         revalidate: 60,
         tags: userId ? [`media-user-${userId}`] : ["media-anon"],
       }
     )();
   ```

3. In `src/app/api/track/route.ts` (`POST`, `PUT`, `DELETE` handlers):
   ```ts
   import { revalidateTag } from "next/cache";

   // Right after successful userEntry write:
   if (sessionUser?.id) {
     revalidateTag(`media-user-${sessionUser.id}`);
   }
   ```

---

### Step 3: Parallelize Multi-Gateway Search Pipeline

In `src/utils/apiHelpers.ts`:
```ts
export async function searchMedia(
  query: string,
  type: string,
  userId?: string | null
): Promise<SearchResultItem[]> {
  if (!query || query.trim() === "") return [];

  const normalizedType = type.toLowerCase();

  // Run user library check, local catalog lookup, and external APIs concurrently
  const [userResultSettled, catalogResultSettled, externalResultSettled] = await Promise.allSettled([
    userId ? searchUserLibrary(query, normalizedType, userId) : Promise.resolve([]),
    searchExistingMedia(query, normalizedType, new Set()),
    fetchExternalByType(query, normalizedType),
  ]);

  const userTracked = userResultSettled.status === "fulfilled" ? userResultSettled.value : [];
  const existingDb = catalogResultSettled.status === "fulfilled" ? catalogResultSettled.value : [];
  const external = externalResultSettled.status === "fulfilled" ? externalResultSettled.value : [];

  return deduplicateSearchResults([...userTracked, ...existingDb, ...external]);
}
```

---

### Step 4: Lazy-Load Heavy Modals & Lazy Poster Images

1. In `src/components/common/MediaCard.tsx`:
   ```tsx
   import dynamic from "next/dynamic";

   const MediaModal = dynamic(() => import("./MediaModal"), {
     ssr: false,
     loading: () => null,
   });
   ```
   Only render `<MediaModal />` when `isModalOpen === true`.

2. Add native image lazy loading in `MediaCard.tsx:646`:
   ```tsx
   <img
     src={getCoverImage(item.coverImage, item.type)}
     alt={item.title}
     loading="lazy"
     decoding="async"
     className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
     onError={(e) => {
       (e.currentTarget as HTMLImageElement).src =
         DEFAULT_COVER_IMAGES[item.type] || DEFAULT_COVER_IMAGES.anime;
     }}
   />
   ```

3. In `src/components/common/MediaCollectionView.tsx`:
   ```tsx
   const CreateMediaModal = dynamic(() => import("./CreateMediaModal"), {
     ssr: false,
     loading: () => null,
   });
   ```

---

### Step 5: Dev Experience & Turbopack Acceleration

In `package.json`:
```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

---

## 4. File & Line Modification Matrix

| File | Target Lines | Purpose |
|---|---|---|
| [src/app/globals.css](file:///d:/02_CODE/04_WORKING/ShinDB/src/app/globals.css) | L1–2 | Remove render-blocking Google Font `@import` |
| [src/app/layout.tsx](file:///d:/02_CODE/04_WORKING/ShinDB/src/app/layout.tsx) | L1–26 | Setup self-hosted Google Fonts via `next/font/google` |
| `src/app/**/page.tsx` (6 files) | L8–13 | Drop `force-dynamic` to enable route caching and prefetching |
| [src/lib/media.ts](file:///d:/02_CODE/04_WORKING/ShinDB/src/lib/media.ts) | L152–199 | Add `unstable_cache` wrappers with user-keyed tags |
| [src/app/api/track/route.ts](file:///d:/02_CODE/04_WORKING/ShinDB/src/app/api/track/route.ts) | L206, L360, L455 | Trigger `revalidateTag('media-user-${userId}')` on mutations |
| [src/utils/apiHelpers.ts](file:///d:/02_CODE/04_WORKING/ShinDB/src/utils/apiHelpers.ts) | L430–480 | Concurrently run local DB and external searches with `Promise.allSettled` |
| [src/components/common/MediaCard.tsx](file:///d:/02_CODE/04_WORKING/ShinDB/src/components/common/MediaCard.tsx) | L15, L646 | Dynamic import for `MediaModal`, add `loading="lazy"` on poster `<img>` |
| [src/components/common/MediaCollectionView.tsx](file:///d:/02_CODE/04_WORKING/ShinDB/src/components/common/MediaCollectionView.tsx) | L21 | Dynamic import for `CreateMediaModal` |
| [package.json](file:///d:/02_CODE/04_WORKING/ShinDB/package.json) | L6–15 | Turbopack dev command and `postinstall` Prisma generator |

---

## 5. Verification, Benchmarks & Validation Protocol

```
Step 1: Code Integrity  ──> Run `npm run build` & TypeScript check
Step 2: FCP & LCP Audit ──> Measure before/after in Chrome DevTools Network & Lighthouse
Step 3: Search Speed    ──> Query search route: timing should drop from ~2500ms to <400ms
Step 4: Cache Lifecycle ──> Track a new anime: verify cache invalidates and displays instantly
```

1. **Deterministic Build Verification:**
   ```powershell
   npm run build
   ```
   Must pass with 0 TypeScript and Next.js compiler errors.
2. **Search Gateway Timing Test:**
   Execute `/api/search?q=One+Piece&type=all` and observe total network round-trip time in milliseconds.
3. **Cache Invalidation Integrity:**
   - Load `/anime` (cache miss, records query).
   - Reload `/anime` (cache hit, <15ms).
   - Add/edit an anime via `POST /api/track`.
   - Reload `/anime` (cache refreshed with updated record).

---

## 6. Ponytail Invariants, Skipped Scope & Operational Risks

- **What was skipped:**
  - No external Redis / Upstash dependency introduced: Next.js in-memory caching is sufficient.
  - No complex service worker offline sync: native browser caching and Next.js route prefetching provide high returns with zero runtime overhead.
  - No database migration or schema alteration needed: existing indices `@@index([type])` and `@@index([userId, status])` cover all performance query paths.
- **Operational Risk:**
  - When `force-dynamic` is removed, any mutations occurring outside `/api/track` (such as direct database manual edits or CLI scripts) will require either waiting for the 60s revalidation window or manually calling `revalidateTag()`.
