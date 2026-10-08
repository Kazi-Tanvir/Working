# SYS_TRACKER — Complete Improvement Blueprint

> An exhaustive, brutally honest critique and feature roadmap for transforming SYS_TRACKER from a functional MVP into a **production-grade media tracking dashboard** comparable to MyAnimeList, AniList, Letterboxd, Backloggd, and IMDB.

---

## Table of Contents

1. [Architecture & Data Layer (The Foundation)](#1-architecture--data-layer-the-foundation)
2. [Authentication & User System](#2-authentication--user-system)
3. [Data Model Redesign](#3-data-model-redesign)
4. [Dashboard Layout Overhaul](#4-dashboard-layout-overhaul)
5. [Category List Pages (Complete Rebuild)](#5-category-list-pages-complete-rebuild)
6. [Individual Detail Pages (New)](#6-individual-detail-pages-new)
7. [Search System (Major Upgrade)](#7-search-system-major-upgrade)
8. [Component Architecture & Code Quality](#8-component-architecture--code-quality)
9. [Performance, SEO & Accessibility](#9-performance-seo--accessibility)
10. [Feature Parity Roadmap vs. Industry Leaders](#10-feature-parity-roadmap-vs-industry-leaders)

---

## 1. Architecture & Data Layer (The Foundation)

### 🔴 CRITICAL: You're Using JSON Files as a Database

This is the single biggest architectural flaw. Every read/write operation does `fs.readFile → JSON.parse → modify → JSON.stringify → fs.writeFile` on flat files inside `src/database/`. This means:

- **No concurrent safety**: Two simultaneous writes will corrupt data (last write wins, earlier write is lost).
- **No indexing**: Every search is a full-file scan. With 100+ movies, this is already slow. At 1,000+ items it becomes painful.
- **No relational queries**: You can't ask "show me all anime rated > 8 that I completed in 2024" without loading everything into memory.
- **Deployment impossible**: On Vercel/Netlify, the filesystem is read-only. Your app literally cannot write data in production.
- **No backup/versioning**: One bad write and your entire collection is gone.

**What you should use instead:**

| Option | Best For | Effort |
|--------|----------|--------|
| **SQLite + Drizzle ORM** | Self-hosted, single-user, zero cost | Medium |
| **PostgreSQL + Prisma** | Multi-user, deployed on Vercel/Railway | Medium-High |
| **Supabase** (Postgres + Auth + Realtime) | Fastest to production, free tier generous | Low-Medium |
| **PlanetScale** (MySQL) | Scale-focused, serverless-friendly | Medium |

**My recommendation:** **Supabase**. It gives you Postgres, authentication, real-time subscriptions, row-level security, and an admin dashboard — all free tier. You would:

1. Create tables matching your data model (see Section 3)
2. Replace all `fs.readFile/writeFile` calls with Supabase client queries
3. Get instant production deployment capability

> [!CAUTION]
> Your current `src/database/*.json` files are inside `src/` — they get bundled by Next.js at build time. This means the data you see at runtime is the **build-time snapshot**, not live data. Any writes during `next dev` modify the source files, but a deployed build would serve stale data.

---

### 🔴 API Route Architecture is Fragile

Your [route.ts](file:///d:/02_CODE/04_TEST/imdb-gemini/src/app/api/track/route.ts) handles POST, PUT, and DELETE in a single file with no validation library, no middleware, and no error typing.

**What to fix:**

- **Add input validation** with `zod`:
  ```ts
  const CreateMediaSchema = z.object({
    title: z.string().min(1).max(200),
    type: z.enum(["anime", "manga", "game", "movie", "series"]),
    releaseYear: z.number().int().min(1900).max(2100).optional(),
    rating: z.string().optional(),
    // ...
  });
  ```
- **Separate concerns**: Split into `route.ts` (HTTP handling) and `services/media.ts` (business logic) and `lib/db.ts` (data access).
- **Add rate limiting**: Anyone can spam your API and corrupt your JSON files right now.
- **Add proper error types**: Replace `catch (e: any)` with typed error handling.

---

## 2. Authentication & User System

### Current State: No Authentication Whatsoever

Anyone who can access the URL can view, edit, and delete your entire media collection. The profile is hardcoded to "SENPAI_09" with a stock avatar.

### What You Need (Inspired by MAL/AniList):

**Tier 1 — Basic Auth (Do First):**

| Feature | Implementation |
|---------|---------------|
| Email/Password login | Supabase Auth or NextAuth.js |
| OAuth (Google, Discord, GitHub) | Same — most tracker users expect Discord login |
| Protected API routes | Middleware that checks `session` before allowing writes |
| User profile stored in DB | Username, avatar URL, bio, join date |

**Tier 2 — User Features:**

| Feature | Inspiration |
|---------|-------------|
| Public profile pages | AniList: `anilist.co/user/username` — shows stats, lists, favorites |
| Privacy settings | MAL: Choose what's public (list, stats, favorites) |
| Custom list names | AniList: Users can create custom lists beyond "Watching/Completed" |
| Import/Export | MAL XML import, AniList JSON import, CSV export |

**Tier 3 — Social:**

| Feature | Inspiration |
|---------|-------------|
| Activity feed | AniList: "User X completed Attack on Titan and rated it 9/10" |
| Following system | See friends' activity |
| Comments/Reviews | Letterboxd: Per-item reviews with likes |

**Architecture recommendation:**

```
middleware.ts → Check auth on all /api/* routes and /dashboard/*
├── Public routes: /, /login, /register, /user/[username] (read-only)
├── Protected routes: /dashboard, /settings, /api/track/*
└── Auth provider: Supabase Auth (comes with RLS for free)
```

---

## 3. Data Model Redesign

### Current Data Model is Too Flat

Your `MediaItem` interface:
```ts
interface MediaItem {
  id: string;
  title: string;
  rating: string;        // "9.0/10" — a STRING, not a number
  status: string;        // Free-form string, no enum
  coverImage: string;
  progress: string;      // "18/28 EP" — unparseable without regex
  genres: string[];      // Sometimes contains writer credits
  releaseYear: number;
  type: "anime" | "manga" | "game" | "movie" | "series";
}
```

**Problems:**

1. **`rating` is a string** like `"9.0/10"`. Every component must parse it with `split("/")`. Should be a nullable `number` (0-10 scale).
2. **`progress` is an unparseable string**. `"18/28 EP"`, `"S3E06"`, `"120 hrs"`, `"147 mins"` — four totally different formats crammed into one field. Every component has a regex spaghetti parser for this.
3. **`status` is a free-form string** — no TypeScript enum. Typos like `"plan to watch"` vs `"Plan to Watch"` will silently break filters.
4. **No timestamps** — no `createdAt`, `updatedAt`, `completedAt`. You can't build "recently completed" properly, activity feeds, or time-based statistics.
5. **No notes/review field** — every tracker (MAL, AniList, Letterboxd) lets you write personal notes.
6. **No `totalEpisodes`/`totalChapters`** — progress tracking is a guess.
7. **No tags or custom labels**.
8. **No `startDate` / `endDate`** for tracking when you started/finished something.
9. **Genres are polluted** — your `movies.json` has writer credits stored as genres.

### Proposed New Data Model:

```ts
// ═══════════════════════════════════════
// CORE TYPES (use as DB schema too)
// ═══════════════════════════════════════

type MediaType = "anime" | "manga" | "game" | "movie" | "series";

type MediaStatus = 
  | "watching" | "reading" | "playing"  // Active
  | "completed"                          // Done
  | "on_hold"                            // Paused (MAL has this, you don't)
  | "dropped"                            // Abandoned
  | "plan_to_consume";                   // Backlog

interface MediaEntry {
  id: string;                  // UUID or CUID
  userId: string;              // Foreign key to users table
  
  // ── Core Identity ──
  title: string;
  type: MediaType;
  externalId?: string;         // AniList ID, TMDB ID, RAWG ID
  externalSource?: string;     // "anilist" | "tmdb" | "rawg"
  
  // ── Media Metadata ──
  coverImage: string;
  releaseYear: number | null;
  genres: string[];
  synopsis?: string;           // From external API
  studio?: string;             // Animation studio / Developer / Director
  
  // ── User Tracking ──
  status: MediaStatus;
  rating: number | null;       // 0-10, one decimal. null = unrated
  
  // ── Progress (structured, not string) ──
  progressCurrent: number;     // Episodes watched, chapters read, hours played
  progressTotal: number | null;// Total episodes/chapters. null = unknown/ongoing
  progressUnit: string;        // "ep" | "ch" | "hrs" | "mins" | "seasons"
  
  // ── Personal ──
  notes: string;               // User's personal notes/review
  isFavorite: boolean;
  tags: string[];              // User-defined tags
  
  // ── Timestamps ──
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // ── Rewatches/Replays ──
  rewatchCount: number;
}
```

> [!IMPORTANT]
> Notice how `progress` is now **three separate numeric fields** instead of one unparseable string. This eliminates the regex spaghetti in `MediaCard.tsx`, `CategoryStats.tsx`, and every other component that tries to parse `"18/28 EP"`.

---

## 4. Dashboard Layout Overhaul

### Current Dashboard: Information Architecture Problems

Your current dashboard layout is:
```
1. Terminal Welcome Header (cosmetic)
2. Search Bar
3. Profile Header (stats cards)
4. Category Stats (778 lines, 5 identical blocks)
5. Currently Consuming (all active items, no limit)
6. Recently Completed (hard-capped at 8)
```

**What's wrong:**

1. **The terminal header is pure decoration** — it takes prime screen real estate to say "SESSION: ACTIVE_DEV". This is wasted space that should show actionable information.
2. **Search is not sticky** — on MAL/AniList, search is in the navbar and always accessible. Yours is in the page body and scrolls away.
3. **Category Stats is 778 lines of copy-paste** — same JSX repeated 5 times. But more importantly, it shows statistics that are not particularly useful at a glance (total episodes watched, chapters read) without context.
4. **No activity timeline** — AniList's dashboard centers around "what did I do recently?". Yours has no concept of time. You can't see "I watched 3 anime this week" or "I haven't played any games in 2 months".
5. **Currently Consuming shows ALL items** — if you have 30 active items, it dumps all 30 in a grid. AniList shows only 5-6 per category, with a "View All" link.
6. **No quick-add from dashboard** — you have to navigate to a category page to add items. MAL's dashboard has a prominent "Add to List" button.
7. **No personalized recommendations** — Every modern tracker suggests "based on your history, you might like...".

### Proposed Dashboard Layout (Inspired by AniList + Letterboxd + Notion):

```
┌─────────────────────────────────────────────────┐
│  NAVBAR (with integrated search, always visible) │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Profile Card  │  │  Quick Stats Overview    │ │
│  │ Avatar        │  │  ┌──────┐ ┌──────┐      │ │
│  │ Username      │  │  │ 142  │ │  23  │ ...  │ │
│  │ Join date     │  │  │Total │ │Active│      │ │
│  │ Level/Rank    │  │  └──────┘ └──────┘      │ │
│  └──────────────┘  │  Mean Score: 7.4/10      │ │
│                     └──────────────────────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │ 📊 Activity Feed / Timeline                 │ │
│  │ "You completed Interstellar • 2h ago"       │ │
│  │ "You started reading Chainsaw Man • 1d ago" │ │
│  │ "You rated Attack on Titan 9/10 • 3d ago"   │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │ ▶ Currently Watching (3)    [View All →]    │ │
│  │ [card] [card] [card]                         │ │
│  ├─────────────────────────────────────────────┤ │
│  │ 📖 Currently Reading (2)    [View All →]    │ │
│  │ [card] [card]                                │ │
│  ├─────────────────────────────────────────────┤ │
│  │ 🎮 Currently Playing (1)    [View All →]    │ │
│  │ [card]                                       │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │ ✅ Recently Completed         [View All →]  │ │
│  │ [card] [card] [card] [card] [card] [card]   │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │ 📈 Stats at a Glance (Compact)              │ │
│  │ ┌─Anime──┐ ┌─Manga──┐ ┌─Games──┐ ┌─Film──┐ │ │
│  │ │ 45 ttl │ │ 12 ttl │ │ 8 ttl  │ │67 ttl │ │ │
│  │ │ 7.8 avg│ │ 8.1 avg│ │ 7.2 avg│ │7.4 avg│ │ │
│  │ │ 389 ep │ │ 847 ch │ │ 120 hr │ │95 hrs │ │ │
│  │ └────────┘ └────────┘ └────────┘ └────────┘ │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │ ⭐ Favorites (pinned by user)               │ │
│  │ [card] [card] [card] [card]                 │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key differences from your current layout:**

1. **Activity feed is front-and-center** — this is what AniList does right. The dashboard is about *recent activity*, not static stats.
2. **Active items are grouped by type** — "Currently Watching" separate from "Currently Reading" separate from "Currently Playing". Your current layout dumps them all together.
3. **Stats are compact** — one row of 4-5 small cards instead of 778 lines of repeated JSX.
4. **Favorites section** — let users pin their all-time favorites. Letterboxd has this prominently.
5. **"View All" links everywhere** — nothing is a dead-end.

---

## 5. Category List Pages (Complete Rebuild)

### Current: Barebones Table with Limited Filtering

Your category pages (e.g., `/anime`) are a grid of cards with:
- Sort (by title only)
- Filter (by status only)
- Search (by title only)
- No pagination

**What MAL/AniList/Letterboxd do differently:**

### Multi-Criteria Filtering:
```
Filter by: Status | Rating Range | Genre | Year | Score | Tags
Sort by: Title | Score | Date Added | Date Completed | Release Year | Progress
View as: Grid | List | Compact List
```

### View Modes:
- **Grid View** (what you have) — cover art focused, visual browsing
- **List View** (MAL-style) — table with columns: Title, Score, Progress, Type, Status — good for scanning
- **Compact View** — dense list without cover art, maximum information density

### Pagination / Infinite Scroll:
Your pages load ALL items at once. With 100+ movies, this means:
- Huge initial payload
- Slow render
- No lazy loading

**Fix:** Implement cursor-based pagination or infinite scroll with `IntersectionObserver`.

### Batch Operations:
MAL allows selecting multiple items and:
- Changing status in bulk
- Deleting in bulk
- Adding tags in bulk

### Advanced Sorting:
Currently you only sort by title alphabetically. Add:
- By score (highest first)
- By date added (newest first)
- By release year
- By progress (% completed)
- By last updated

---

## 6. Individual Detail Pages (New)

### You Don't Have Item Detail Pages At All

This is a huge gap. Every media tracker has dedicated pages like:
- MAL: `myanimelist.net/anime/5114/Fullmetal_Alchemist__Brotherhood`
- AniList: `anilist.co/anime/5114`
- Letterboxd: `letterboxd.com/film/parasite-2019/`
- Backloggd: `backloggd.com/games/hollow-knight/`

Currently, clicking a card opens a **modal**. Modals are fine for quick edits, but you need full pages for:

### What a Detail Page Should Have:

```
/anime/[id] or /media/[type]/[id]
┌─────────────────────────────────────────────────┐
│  ┌─────────┐  Title: Steins;Gate                │
│  │         │  Type: Anime | Episodes: 24        │
│  │  Cover  │  Studio: White Fox                  │
│  │  Image  │  Year: 2011                         │
│  │ (large) │  Genres: Sci-Fi, Thriller          │
│  │         │  Your Score: ★★★★★★★★★☆ 9/10      │
│  │         │  Status: Completed                  │
│  └─────────┘  Progress: 24/24 EP                │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │ Synopsis                                     │ │
│  │ "Rintaro Okabe, a self-proclaimed 'mad      │ │
│  │ scientist', runs the Future Gadget Lab..."   │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │ Your Notes / Review                          │ │
│  │ "One of the best time travel stories..."    │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │ Characters & Staff (from AniList API)        │ │
│  │ [avatar] Okabe Rintarou • VA: Miyano Mamoru │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │ Relations & Recommendations                  │ │
│  │ Sequel: Steins;Gate 0                        │ │
│  │ Similar: Re:Zero, Madoka Magica             │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │ Your Activity Log                            │ │
│  │ May 15 — Started watching                   │ │
│  │ May 22 — Episode 12                          │ │
│  │ May 28 — Completed, rated 9/10              │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**You can fetch rich metadata from:**
- AniList GraphQL API → synopsis, characters, staff, relations, recommendations
- TMDB API → synopsis, cast, crew, similar movies, trailers
- RAWG API → description, screenshots, stores, metacritic score

These are **free APIs** you're already using for search but not leveraging for detail enrichment.

---

## 7. Search System (Major Upgrade)

### Current Search is Good But Has Gaps

**What works well:**
- Debounced input (400ms)
- Multi-source search (AniList + TMDB + RAWG + local)
- De-duplication by title
- Type filter tabs
- Click-outside-to-close

**What needs improvement:**

1. **Search should be in the navbar**, not the page body. It should be accessible from *any* page via `Ctrl+K` or `/` keyboard shortcut (like Discord, Notion, GitHub).

2. **No fuzzy matching** — searching "steins gate" won't find "Steins;Gate" because you use `.includes()`. Use a fuzzy search library like `fuse.js` for local results.

3. **The fallback mock database is misleading** — `apiHelpers.ts` contains 15 hardcoded mock entries that appear when APIs fail. Users might think these are real search results. Either clearly label them as "suggested" or remove them.

4. **No recent searches** — store the last 5-10 searches in `localStorage` and show them when the search input is focused.

5. **No keyboard navigation** — you can't arrow-key through results and press Enter to select.

6. **Search results don't link to detail pages** — clicking a result should either add it *or* open its detail page, not just add it.

---

## 8. Component Architecture & Code Quality

### 🟠 Massive Code Duplication

| Problem | Lines Wasted | Fix |
|---------|-------------|-----|
| 5 nearly identical `*ClientView.tsx` files | ~1,000 lines | Single `MediaCollectionView<T>` component with config props |
| `CategoryStats.tsx` repeats same block 5x | ~600 lines | Extract `CategoryStatCard` sub-component |
| `getTypeMeta()` defined in 3 separate files | ~200 lines | Shared `utils/mediaTypes.ts` |
| `DEFAULT_COVER_IMAGES` in 2 files | ~14 lines | Shared `constants/defaults.ts` |
| `loadCollection()` copied across 6 page files | ~60 lines | Shared `lib/data.ts` utility |

This isn't just aesthetic — it's a **maintenance nightmare**. Every bug fix must be replicated across 5 files. Every feature addition must be done 5 times. You've already experienced this.

### 🟠 Inconsistent Type Safety

- `status` is `string` everywhere. Use a TypeScript enum or union type.
- `rating` is `string` ("9.0/10"). Use `number | null`.
- `catch (e: any)` appears ~10 times. Use proper error typing.
- Many `any` types in API responses. Define proper interfaces.

### 🟠 No State Management

Every client component manages its own state with `useState`. When you update an item in `MediaModal`, the change doesn't propagate to `CurrentlyConsuming`, `RecentlyCompleted`, or `CategoryStats` until `router.refresh()` triggers a full server re-render.

**Options:**
- **React Context** for shared media state (simplest)
- **Zustand** for lightweight global state (recommended)
- **TanStack Query** (React Query) for server state management with caching, optimistic updates, and automatic revalidation (best for your use case)

### 🟠 No Optimistic Updates

When you click "+1 episode" on a card, the UI updates locally but the API call happens in the background with no feedback. If the API fails, the UI shows wrong data. Use TanStack Query's `useMutation` with optimistic updates.

---

## 9. Performance, SEO & Accessibility

### Performance

| Issue | Impact | Fix |
|-------|--------|-----|
| All `<img>` tags instead of `next/image` | No lazy loading, no WebP, no srcSet | Migrate to `next/image` with `remotePatterns` |
| CSS `@import` for Google Fonts | Render-blocking | Use `next/font/google` |
| Footer re-renders every second | Unnecessary | Use `requestAnimationFrame` + ref |
| All items loaded at once | Huge payloads on category pages | Pagination + ISR |
| No image blur placeholders | Layout shift on load | `next/image` with `placeholder="blur"` |
| No `next.config.ts` image config | External images not optimized | Add `remotePatterns` for TMDB, AniList, MAL CDN |

### SEO

| Missing | What to Add |
|---------|-------------|
| No per-page `<title>` | Dynamic titles: "Anime List — SYS_TRACKER" |
| No Open Graph tags | Preview cards when sharing links |
| No sitemap | `next-sitemap` package |
| No structured data | JSON-LD for media items |
| No canonical URLs | Prevents duplicate content |

### Accessibility

| Issue | Fix |
|-------|-----|
| Icon-only buttons lack `aria-label` | Add `aria-label` to every icon button |
| No skip-to-content link | Add hidden skip link at top of page |
| Color contrast on dark backgrounds | Several `text-gray-600` on `bg-black` fail WCAG AA |
| No focus management in modals | Use `focus-trap` or the HTML `<dialog>` element |
| Keyboard navigation incomplete | Arrow keys don't work in search results |
| No `role="dialog"` on modals | Screen readers can't identify modals |
| No `<main>`, `<nav>`, `<aside>` landmarks used properly | Improve semantic HTML |

---

## 10. Feature Parity Roadmap vs. Industry Leaders

### Features Every Tracker Has That You Don't:

| Feature | MAL | AniList | Letterboxd | Backloggd | You |
|---------|-----|---------|------------|-----------|-----|
| User authentication | ✅ | ✅ | ✅ | ✅ | ❌ |
| Detail pages | ✅ | ✅ | ✅ | ✅ | ❌ |
| Synopsis/Description | ✅ | ✅ | ✅ | ✅ | ❌ |
| Notes/Reviews | ✅ | ✅ | ✅ | ✅ | ❌ |
| "On Hold" status | ✅ | ✅ | ✅ | ✅ | ❌ |
| Start/End dates | ✅ | ✅ | ✅ | ✅ | ❌ |
| Favorites list | ✅ | ✅ | ✅ | ✅ | ❌ |
| Activity timeline | ❌ | ✅ | ✅ | ✅ | ❌ |
| Recommendations | ✅ | ✅ | ✅ | ❌ | ❌ |
| Public profiles | ✅ | ✅ | ✅ | ✅ | ❌ |
| Score distribution chart | ✅ | ✅ | ✅ | ❌ | ❌ |
| Genre breakdown chart | ❌ | ✅ | ❌ | ✅ | ❌ |
| Year-in-review stats | ❌ | ✅ | ✅ | ❌ | ❌ |
| Import from other trackers | ✅ | ✅ | ✅ | ✅ | ❌ |
| Export data | ✅ | ✅ | ✅ | ✅ | ❌ |
| Multiple list views | ✅ | ✅ | ✅ | ✅ | ❌ |
| Advanced filtering | ✅ | ✅ | ✅ | ✅ | ❌ (basic) |
| Multi-criteria sorting | ✅ | ✅ | ✅ | ✅ | ❌ (title only) |
| Tags/custom labels | ❌ | ✅ | ✅ | ✅ | ❌ |
| Rewatch/Replay tracking | ✅ | ✅ | ✅ | ✅ | ❌ |
| Keyboard shortcuts | ❌ | ✅ | ❌ | ❌ | ❌ |
| Dark/Light theme toggle | ❌ | ✅ | ✅ | ✅ | ❌ (dark only) |

### Unique Features You Could Build That Others Don't Have:

1. **Cross-media correlation** — "People who liked this anime also played this game" — no tracker crosses media boundaries like you do.
2. **Unified watchtime dashboard** — "This week: 14 hrs anime, 3 hrs movies, 8 hrs gaming" — a single time tracker across all media.
3. **AI-powered recommendations** — Use the Gemini API (you named the project `imdb-gemini`) to analyze your watch history and suggest what to watch/read/play next.
4. **Mood-based discovery** — "I want something: [Dark] [Short] [Highly Rated]" → filters across all media types.
5. **Streak tracking** — "You've watched anime for 30 days straight!" (like Duolingo's streak system).

---

## Summary: Priority Implementation Order

### Phase 1 — Foundation (Must Do Before Anything Else)
1. Migrate from JSON files to Supabase/Postgres
2. Redesign data model with proper types
3. Add authentication (Supabase Auth)
4. Add input validation (zod)

### Phase 2 — Core UX
5. Build individual detail pages (`/media/[type]/[id]`)
6. Move search to navbar with `Ctrl+K` shortcut
7. Rebuild dashboard with activity feed + grouped active items
8. Consolidate 5 `ClientView` files into 1 reusable component
9. Add list view + grid view toggle
10. Add multi-criteria filtering and sorting

### Phase 3 — Polish
11. Migrate to `next/image` and `next/font`
12. Add proper accessibility (ARIA, keyboard nav, focus traps)
13. Add import/export functionality
14. Add personal notes/reviews per item
15. Add favorites and custom tags

### Phase 4 — Differentiation
16. Activity timeline on dashboard
17. Statistics visualizations (charts, distributions)
18. AI-powered recommendations via Gemini
19. Year-in-review page
20. Public shareable profiles

---

> [!WARNING]
> **Don't skip Phase 1.** Everything else depends on having a real database and proper data model. Building features on top of JSON files is building on quicksand — every feature will be harder, buggier, and more fragile than it needs to be.

> [!TIP]
> **Your design system is genuinely excellent.** The cyber-neobrutalist aesthetic is cohesive, memorable, and distinctive. Most indie trackers look like Bootstrap templates. Yours has real visual identity. Protect and evolve this identity as you rebuild the architecture underneath it.
