# ShinDB — Product Requirement Document (PRD)

> **Version**: 1.0.0  
> **Last Updated**: 2026-10-16  
> **Status**: Complete (v1.0.0 Production Ready)  
> **Product Name**: ShinDB  
> **Internal Codename**: `[SYS_TRACKER::MVP]`

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Target Users](#2-target-users)
3. [Product Vision](#3-product-vision)
4. [Core Features (v1.0)](#4-core-features-v10)
5. [Feature Details](#5-feature-details)
6. [External Integrations](#6-external-integrations)
7. [Authentication & User Management](#7-authentication--user-management)
8. [Data & Storage](#8-data--storage)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Out of Scope (v1.0)](#10-out-of-scope-v10)
11. [Success Criteria](#11-success-criteria)
12. [Development Phases](#12-development-phases)
13. [Deployment Strategy](#13-deployment-strategy)
14. [Future Roadmap (Post-v1.0)](#14-future-roadmap-post-v10)
15. [Versioning & Release Strategy](#15-versioning--release-strategy)
16. [Glossary](#16-glossary)

---

## 1. Problem Statement

### The Fragmentation Problem

Media enthusiasts who consume content across multiple formats — anime, manga, movies, TV series, and video games — are forced to use **separate, disconnected tracking platforms** for each medium:

| Medium | Current Solution | Limitation |
|--------|-----------------|------------|
| Anime | MyAnimeList, AniList | Anime/manga only |
| Manga | MyAnimeList, AniList | Same as above |
| Movies | Letterboxd, IMDb | Film only, no anime/games |
| TV Series | Trakt, TV Time | Series only |
| Games | RAWG, HowLongToBeat | Games only |

**The result**: A user's complete media consumption footprint is scattered across 3-5 different platforms, each with its own login, UI, rating scale, and data silo. There is no single place to answer: *"How much media have I consumed across all formats?"*

### What ShinDB Solves

ShinDB is a **centralized, self-hostable personal media tracker** that unifies all five media types into a single application with:
- One dashboard showing aggregated statistics across all media
- One search interface querying multiple external databases
- One consistent tracking workflow regardless of media type
- Full data ownership — no dependency on third-party platform availability

---

## 2. Target Users

### Primary User

**The Multi-Format Media Enthusiast** — A person who actively consumes content across anime, manga, movies, series, and games, and wants a unified view of their media consumption.

### User Profile

| Attribute | Description |
|-----------|-------------|
| **Group Size** | Small circle — the primary user (you) + 5-20 trusted friends |
| **Access Model** | Invite-only / self-hosted. Not a public SaaS product |
| **Technical Level** | Comfortable with self-hosting or cloud deployment |
| **Primary Device** | Desktop-first, but needs to be usable on mobile (responsive web) |
| **Language** | English primary, with support for Japanese titles (romaji + native script) |

### User Personas

#### Persona 1: The Core Operator (You)
- Tracks 200+ anime, dozens of manga, 100+ movies/series, and 25+ games
- Wants a command-console aesthetic that feels personal and premium
- Needs rich statistics: days watched, mean scores, completion rates
- Values data ownership and self-hosting capability

#### Persona 2: The Friend
- Invited to the platform to share media consumption
- Browses your profile, sees what you're watching
- Tracks their own media in a lighter capacity
- Discovers new content through your tracked entries

---

## 3. Product Vision

### One-Liner

> A centralized, dark-themed media tracking command console for the multi-format media enthusiast who refuses to fragment their data across five different platforms.

### Design Identity

ShinDB uses the **"Obsidian Terminal"** design language — a cyberpunk-inspired, dark-mode-only interface that feels like a personal command console for archiving media. The full design system is documented in [DESIGN.md](file:///d:/02_CODE/04_WORKING/ShinDB/src/notes/DESIGN.md).

### Technical Architecture

ShinDB is built as a **Turborepo-powered monorepo** with microservices architecture. The complete architecture is documented in [SYS_Tracker.md](file:///d:/02_CODE/04_WORKING/ShinDB/src/notes/SYS_Tracker.md).

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js (App Router) |
| **API Gateway** | Hono |
| **Backend Services** | 4 microservices (auth, tracker, user, search) |
| **Database** | PostgreSQL (Prisma ORM) |
| **Cache** | Redis (sessions + search cache) |
| **Package Manager** | pnpm (workspaces) |
| **Build System** | Turborepo |

---

## 4. Core Features (v1.0)

### Feature Priority Matrix

| Priority | Feature | Category |
|----------|---------|----------|
| 🔴 P0 | Multi-media tracking (5 types: anime, manga, movie, series, game) | Core |
| 🔴 P0 | Full CRUD operations on media entries | Core |
| 🔴 P0 | External search (AniList + TMDB + RAWG) | Core |
| 🔴 P0 | Dashboard with aggregated statistics | Core |
| 🔴 P0 | User authentication (email/password + Google + Discord OAuth) | Auth |
| 🟡 P1 | Media list pages with grid view, filtering, and sorting | Core |
| 🟡 P1 | Full progress tracking (current/total, dates, rewatch count) | Core |
| 🟡 P1 | Rating system (0-10 scale) | Core |
| 🟡 P1 | Favorites system | Core |
| 🟡 P1 | Currently consuming section | Dashboard |
| 🟡 P1 | Recently completed section | Dashboard |
| 🟡 P1 | User profiles (avatar, bio, display name, stats) | Social |
| 🟡 P1 | Notes & tags on entries | Core |
| 🟢 P2 | Friends list (search by username, send/accept requests) | Social |
| 🟢 P2 | View friend's profile and their media lists | Social |
| 🟢 P2 | Data export (JSON backup) | Data |
| 🟢 P2 | Mobile-responsive layout | UI |

---

## 5. Feature Details

### 5.1 Multi-Media Tracking

The core of ShinDB. Users can track media entries across 5 types, each with type-appropriate metadata:

#### Supported Media Types

| Type | Status Options | Progress Unit | External Source |
|------|---------------|--------------|----------------|
| **Anime** | Watching, Completed, Plan to Watch, On-Hold, Dropped | Episodes (`ep`) | AniList |
| **Manga** | Reading, Completed, Plan to Read, On-Hold, Dropped | Chapters (`ch`) | AniList |
| **Movie** | Watched (Completed), Plan to Watch , Dropped | N/A (binary) | TMDB |
| **Series** | Watching, Completed, Plan to Watch, On-Hold, Dropped | Episodes (`ep`) | TMDB |
| **Game** | Playing, Completed, Plan to Play, On-Hold, Dropped | Hours (`hrs`) | RAWG |

#### Media Entry Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✅ | Supports English + Japanese (romaji/native) |
| `type` | enum | ✅ | anime, manga, movie, series, game |
| `status` | enum | ✅ | Type-dependent status options |
| `coverImage` | URL | ✅ | Pulled from external API on add |
| `rating` | float (0-10) | ❌ | Nullable; 1 increments |
| `progressCurrent` | int | ✅ | Current episode/chapter/hours |
| `progressTotal` | int | ❌ | Nullable (ongoing series) |
| `progressUnit` | enum | ✅ | ep, ch, hrs, mins |
| `startDate` | date | ❌ | When user started consuming |
| `endDate` | date | ❌ | When user finished |
| `rewatchCount` | int | ❌ | Default: 0 |
| `notes` | text | ❌ | Personal annotations |
| `tags` | string[] | ❌ | User-defined tags |
| `isFavorite` | boolean | ❌ | Default: false |
| `genres` | string[] | ❌ | Pulled from external API |
| `releaseYear` | int | ❌ | Pulled from external API |
| `externalId` | string | ❌ | ID from source API |
| `externalSource` | enum | ❌ | anilist, tmdb, rawg |

#### CRUD Operations

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| **Create** | `POST /media/entries` | Add a new media entry (from search or manual) |
| **Read** | `GET /media/entries` | List entries with filters (type, status, sort, search) |
| **Read** | `GET /media/entries/:id` | Get single entry detail |
| **Update** | `PUT /media/entries/:id` | Update any entry fields |
| **Delete** | `DELETE /media/entries/:id` | Remove entry permanently |
| **Progress** | `PATCH /media/entries/:id/progress` | Increment or set progress |
| **Sync Metadata** | `POST /api/track/sync` | Sync airing / unannounced entries with external databases (Kitsu, TVmaze) |

#### Airing & Announced Metadata Sync
When media (especially anime, manga, or TV series) is added while currently airing or newly announced, total episode/chapter counts are unknown (`progressTotal: null`, rendered as `0/? EP`). ShinDB features an active metadata synchronization engine:
- **Single-Entry Sync**: Triggered on demand via `[🔄 Sync Metadata]` in the `MediaModal` or inline via the `Sync Airing` prompt on indeterminate progress cards.
- **Batch Airing Sync**: Triggered via `[🔄 Sync Airing]` in the category toolbar (`MediaCollectionView`). Automatically queries external database records for all items where `progressTotal === null` and updates the database records once the show concludes or the count is officially published.
- **External Data Providers**: Multi-tier fallback incorporating Kitsu REST API (anime/manga) and TVmaze (series) with retry agents and graceful error handling.

---

### 5.2 Dashboard

The central command console. Displays aggregated statistics across all tracked media.

#### Dashboard Sections

1. **System Banner** — Branded header with system status, session info
2. **Search Bar** — Unified search across external databases (keyboard shortcut: `Ctrl + k`)
3. **Profile Card** — User avatar, role badge, username, bio, status
4. **Stat Cards** (4 cards) — Total count per media type with color-coded accent borders:
   - Total Anime (purple `#8b5cf6`)
   - Total Manga (orange `#f97316`)
   - Total Games (green `#10b981`)
   - Total Movies+Series (cyan `#06b6d4`)
5. **Summary Stats** — Total tracked items, active/completed/backlog breakdown, compilation rate
6. **Per-Type Statistics** — For each media type: days consumed, mean score, status distribution, last updates
7. **Currently Consuming** — Horizontal scrolling row of currently active entries
8. **Recently Completed** — Grid of recently completed entries with poster thumbnails

#### Statistics Calculated

| Stat | Formula |
|------|---------|
| Total Entries | Count of all entries per type |
| Completion Rate | `(completed / total) × 100` |
| Mean Score | Average of all non-null ratings per type |
| Days Watched/Read | `Σ(progressCurrent × avgDuration)` — estimated |
| Active Count | Entries with status = watching/reading/playing |
| Backlog Count | Entries with status = plan_to_* |

---

### 5.3 Media List Pages

Five dedicated pages (`/anime`, `/manga`, `/movies`, `/series`, `/games`) sharing identical layout with type-specific accent colors and filter options.

#### Page Structure

1. **Page Header** — Category icon, title, result count, toolbar (Sort, Filter, Properties, Search, + New)
2. **Filter Pills** — Status-based filter row (ALL, WATCHING, COMPLETED, PLAN TO WATCH, DROPPED, etc.)
3. **Media Grid** — 7-column poster grid (responsive: 8 on XL, 4-5 on tablet, 3 on mobile)

#### Filtering & Sorting

| Filter | Type | Options |
|--------|------|---------|
| Status | Enum | All type-specific statuses |
| Rating | Range | 0-10 |
| Genre | Multi-select | Pulled from entry genres |
| Year | Range | Release year |
| Favorites | Boolean | Show favorites only |
| Tags | Multi-select | User-defined tags |

| Sort | Direction | Default |
|------|-----------|---------|
| Title | A-Z / Z-A | — |
| Rating | High-Low / Low-High | — |
| Date Added | Newest / Oldest | ✅ (default: newest first) |
| Progress | % complete | — |
| Release Year | Newest / Oldest | — |

#### Loading Strategy

Media entries use **lazy loading with progressive rendering**:
1. Initially load the first 50 entries with intersection observer
2. Load subsequent batches of 50 as the user scrolls
3. Once all entries are loaded, client-side filtering/sorting operates on the full dataset
4. Virtualized rendering (e.g., `react-window`) to prevent DOM bloat with large collections (200+ entries per type)

---

### 5.4 External Search

Unified search interface querying multiple external databases to add media entries.

#### API Sources (v1.0)

| API | Media Types | Protocol | Rate Limit |
|-----|------------|----------|-----------|
| **AniList** | Anime, Manga | GraphQL | 90 req/min |
| **TMDB** | Movies, Series | REST | ~40 req/10s |
| **RAWG** | Games | REST | 20 req/sec |

#### Search Flow

1. User types query in search bar
2. System determines media type context (from current page or user selection)
3. Request sent to search-service via API gateway
4. Search-service checks Redis cache (TTL: 1 hour)
5. On cache miss: queries appropriate external API
6. Results returned with cover image, title, year, genres, external ID
7. User clicks "Add to List" → creates entry with pre-filled metadata

#### Future API Strategy (Post-v1.0)

> **Note for future implementation**: The architecture should be designed to support:
> - **Fallback APIs** — If AniList is unavailable, fall back to Jikan (MAL REST API) for anime/manga
> - **User-selectable API source** — Advanced search option letting users choose which API to query
> - **Multiple results merging** — Search across multiple APIs simultaneously and deduplicate
> 
> These features are NOT part of v1.0 but the search-service interface should be designed with extensibility in mind (strategy pattern for API providers).

---

### 5.5 Rating System

- **Scale**: 0 to 10 with 1 increments (e.g., 7, 8, 9)
- **Display**: Numeric value, monospace font, accent-colored
- **Nullable**: Users are not forced to rate — unrated entries show `—`
- **Mean Score**: Calculated per media type and overall, ignoring unrated entries

---

### 5.6 Favorites System

- Toggle `isFavorite` on any entry
- Favorites filter available on media list pages
- Favorites section on user profile (visible to friends)
- Visual indicator: star/heart icon overlay on poster card

---

### 5.7 Notes & Tags

#### Notes
- Free-text field per entry (no character limit, but reasonable — suggest max 2000 chars in UI)
- Private by default (not visible to friends viewing your profile)
- Supports plain text only (no markdown rendering in v1.0)

#### Tags
- User-defined string tags per entry (e.g., `comfort-rewatch`, `masterpiece`, `dropped-midway`)
- Filterable on media list pages
- No global tag management — tags are per-entry, auto-suggested from existing tags
- Max 10 tags per entry

---

### 5.8 User Profiles

#### Profile Fields

| Field | Editable | Visible to Friends |
|-------|---------|-------------------|
| Avatar | ✅ (upload) | ✅ |
| Display Name | ✅ | ✅ |
| Username | ❌ (set at registration) | ✅ |
| Bio | ✅ | ✅ |
| Stats (total entries, mean scores, etc.) | Auto-calculated | ✅ |
| Email | ✅ | ❌ |

#### Profile Stats Display
- Total entries per media type
- Overall completion rate
- Mean score per type
- Currently consuming list (top 5)
- Favorites list

---

### 5.9 Friends System

#### Capabilities

| Feature | Description |
|---------|-------------|
| **Search Users** | Search by username to find friends |
| **Send Request** | Send a friend request to another user |
| **Accept/Reject** | Manage incoming friend requests |
| **View Profile** | View a friend's profile page with their stats and lists |
| **View Lists** | Browse a friend's tracked media (read-only) |
| **Remove Friend** | Unfriend a user |

#### Access Control

- Media lists are **private by default** — only visible to accepted friends
- No public profile links in v1.0
- No blocking feature in v1.0 (trusted small circle)

---

### 5.10 Data Export

- **Format**: JSON
- **Scope**: All user data (profile, all media entries, tags, notes, favorites)
- **Access**: Settings page → Export Data button
- **Trigger**: On-demand, generates a downloadable `.json` file
- **Schema**: Matches the `@sys-tracker/types` TypeScript interfaces for easy re-import in future versions

---

## 6. External Integrations

### Integration Architecture

```
┌──────────────────────────────────────────────────┐
│  search-service                                   │
│                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │
│  │  AniList     │  │  TMDB       │  │  RAWG    │  │
│  │  Provider    │  │  Provider   │  │  Provider│  │
│  └──────┬──────┘  └──────┬──────┘  └─────┬────┘  │
│         │                │               │        │
│         └────────────────┼───────────────┘        │
│                          │                         │
│                  ┌───────┴───────┐                 │
│                  │  Search       │                 │
│                  │  Aggregator   │                 │
│                  └───────┬───────┘                 │
│                          │                         │
│                  ┌───────┴───────┐                 │
│                  │  Redis Cache  │                 │
│                  │  (TTL: 1hr)   │                 │
│                  └───────────────┘                 │
└──────────────────────────────────────────────────┘
```

### API Configuration

| API | Env Variable | Required |
|-----|-------------|----------|
| AniList | None (public API) | ✅ |
| TMDB | `TMDB_API_KEY` | ✅ |
| RAWG | `RAWG_API_KEY` | ✅ |

### Search Result Schema (Normalized)

All external API results are normalized to a common shape before returning to the client:

```typescript
interface SearchResult {
  externalId: string;
  externalSource: "anilist" | "tmdb" | "rawg";
  title: string;
  titleNative?: string;      // Japanese/original title
  titleRomaji?: string;      // Romanized title
  coverImage: string;
  releaseYear: number | null;
  genres: string[];
  type: MediaType;
  description?: string;
  totalEpisodes?: number;    // For anime/series
  totalChapters?: number;    // For manga
  averageScore?: number;     // Source platform's score
}
```

---

## 7. Authentication & User Management

### Authentication Methods

| Method | Provider | Priority |
|--------|----------|----------|
| Email + Password | Internal (bcrypt hashing) | 🔴 P0 |
| Google OAuth | Google Identity Services | 🟡 P1 |
| Discord OAuth | Discord OAuth2 | 🟡 P1 |

### Session Management

| Aspect | Implementation |
|--------|---------------|
| Token Type | JWT (access token) + Refresh token |
| Access Token Expiry | 24 hours |
| Refresh Token Expiry | 30 days |
| Storage | Access token in memory, refresh token in httpOnly cookie |
| Session Cache | Redis (for token blacklisting on logout) |

### Registration Flow

1. User provides: username, email, password (or OAuth)
2. Username validation: 3-30 chars, alphanumeric + underscores, unique
3. Email validation: valid format, unique
4. Password requirements: min 8 chars, at least 1 uppercase, 1 number
5. On success: auto-login, redirect to dashboard

### Access Model

- **Invite-only / self-hosted** — No public registration page in v1.0
- Registration can be enabled/disabled via environment variable (`ALLOW_REGISTRATION=true/false`)
- No email verification in v1.0 (trusted circle)

---

## 8. Data & Storage

### Database

- **Engine**: PostgreSQL 16+
- **ORM**: Prisma 6.x
- **Migrations**: Prisma Migrate (auto-generated from schema)
- **Schema**: Defined in `@sys-tracker/db` package (see [SYS_Tracker.md](file:///d:/02_CODE/04_WORKING/ShinDB/src/notes/SYS_Tracker.md) §3.5 for ER diagram)

### Key Tables

| Table | Owner Service | Description |
|-------|--------------|-------------|
| `users` | auth-service | User accounts (credentials, profile data) |
| `media_entries` | tracker-service | All tracked media entries |
| `friendships` | user-service | Friend relationships and requests |
| `activity_log` | tracker-service | Audit trail of entry changes |

### Caching (Redis)

| Cache Key Pattern | TTL | Purpose |
|-------------------|-----|---------|
| `session:{userId}` | 24h | JWT session state |
| `search:{type}:{query}` | 1h | External API search results |
| `stats:{userId}` | 5min | Dashboard statistics |

### Data Retention

- No automatic data deletion
- Users can delete individual entries or their entire account
- Export available before account deletion

---

## 9. Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| Initial page load (dashboard) | < 3 seconds |
| Search response time | < 2 seconds (cached), < 5 seconds (uncached) |
| Media list page load | < 2 seconds (first 50 entries) |
| Entry CRUD operations | < 500ms response |

### Scalability

- **Target scale**: 5-20 concurrent users
- **Max entries per user**: No hard limit (handled via lazy loading + virtualization)
- **Database**: Single PostgreSQL instance sufficient for target scale

### Responsive Design

| Breakpoint | Width | Grid Columns |
|------------|-------|-------------|
| Desktop XL | ≥1440px | 8 posters/row |
| Desktop | 1024–1439px | 7 posters/row |
| Tablet | 768–1023px | 4-5 posters/row |
| Mobile | <768px | 3 posters/row |

- Navigation collapses to hamburger menu on mobile
- Stat cards stack vertically on mobile
- Dashboard sections reflow to single column on mobile

### Internationalization (i18n)

- **UI Language**: English only (v1.0)
- **Title Support**: UTF-8 encoding for Japanese titles (kanji, hiragana, katakana)
- **Title Fields**: `title` (primary/English), with `titleNative` and `titleRomaji` from external APIs stored in metadata
- **Date Format**: ISO 8601 internally, localized display

### Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |

---

## 10. Out of Scope (v1.0)

The following features are **explicitly excluded** from the v1.0 release:

| Feature | Reason | When |
|---------|--------|------|
| AI-powered recommendations | Complexity, not core to tracking | v2.0+ |
| Community features / forums / comments | Out of scope for small-circle app | v2.0+ |
| Native mobile app (React Native / PWA) | Desktop-first, responsive web is sufficient | v2.0+ |
| Light mode / theme toggle | Dark-mode is the identity (per DESIGN.md) | Never (by design) |
| Data import (MAL XML, AniList export) | Complex parsing, defer to post-launch | v1.1 or v1.2 |
| Fallback API sources (Jikan for anime) | Nice-to-have, not essential for launch | v1.1+ |
| User-selectable API source in search | Advanced feature, not MVP | v1.2+ |
| Public shareable profile links | Not needed for invite-only model | v1.1+ |
| Friend activity feed | Social feature, lower priority | v1.1+ |
| Blocking users | Not needed for trusted small circle | If needed |
| Email verification | Not needed for invite-only model | If public registration opens |
| Advanced search (multi-API, deduplication) | Complexity, defer | v1.2+ |

---

## 11. Success Criteria

### Launch Readiness Checklist

The v1.0 release is considered **ready** when ALL of the following are true:

| # | Criterion | Validation Method |
|---|-----------|-------------------|
| 1 | All 5 media types (anime, manga, movie, series, game) can be tracked with full CRUD | Manual testing of create/read/update/delete for each type |
| 2 | External search works for all 3 APIs (AniList, TMDB, RAWG) | Search for a known title from each API, verify results |
| 3 | Dashboard shows accurate aggregated statistics across all media types | Add entries, verify counts, mean scores, and breakdowns match |
| 4 | Users can register and log in via email/password AND Google/Discord OAuth | Test all 3 auth flows end-to-end |
| 5 | Friends can view each other's profiles and tracked media | Create 2 accounts, friend them, verify profile visibility |
| 6 | UI matches the Obsidian Terminal design system from DESIGN.md | Visual review against design spec |

### Quality Gates

| Gate | Requirement |
|------|------------|
| **No critical bugs** | Zero P0 bugs (data loss, auth bypass, crash) |
| **API reliability** | All 3 external APIs return results >95% of the time |
| **Responsive** | Layout is usable on mobile (≥375px width) |
| **Data integrity** | No orphaned entries, no data corruption on concurrent edits |

---

## 12. Development Phases

### Phase 1: Foundation (Core Tracking) — ✅ COMPLETE

> **Goal**: A working media tracker for a single user with no auth.  
> **Status**: ✅ Complete & Verified (2026-10-15)

| Task | Details | Status |
|------|---------|--------|
| Full-stack scaffold | Next.js 16 App Router, TypeScript, Tailwind v3 | [x] Complete |
| Database setup | MySQL via Prisma ORM, migrations, seeded with 360+ items | [x] Complete |
| Core utilities | `seasonHelpers`, `apiHelpers`, `syncHelpers`, `media` | [x] Complete |
| Tracker API (`/api/track`) | CRUD endpoints, structured progress, multi-season recalculations | [x] Complete |
| Search API (`/api/search`) | Multi-provider AniList + RAWG + TV/Movie search integration | [x] Complete |
| Airing sync API (`/api/track/sync`) | Kitsu and TVmaze metadata sync engine (single & batch) | [x] Complete |
| Frontend UI | Dashboard with Central Console, 5 media collection pages, quick modals | [x] Complete |
| Automated testing | 20/20 unit & integration tests passing with 100% success rate | [x] Complete |

**Exit Criteria**: [x] Can search for media across providers, add to list, track multi-season progress, and view aggregated dashboard statistics. All criteria met and tested.

---

### Phase 2: Authentication & User Identity

> **Goal**: Multi-user support with secure authentication

| Task | Details |
|------|---------|
| `auth-service` | Register, login, JWT issuance, refresh tokens |
| Google OAuth | OAuth2 flow integration |
| Discord OAuth | OAuth2 flow integration |
| `AuthProvider` in frontend | Protected routes, session management |
| User profiles | Profile page, avatar upload, bio editing |
| Registration gating | `ALLOW_REGISTRATION` env toggle |

**Exit Criteria**: Multiple users can register, log in, and each see only their own data.

---

### Phase 3: Social Features

> **Goal**: Friends can discover and view each other's media consumption

| Task | Details |
|------|---------|
| `user-service` | Friends endpoints (send, accept, reject, list, remove) |
| User search | Search by username |
| Friend profiles | View friend's profile + their media lists (read-only) |
| Friends page | Friends list UI with request management |
| Data export | JSON export from settings page |

**Exit Criteria**: Two users can friend each other and browse each other's media lists.

---

### Phase 4: Polish & Responsive

> **Goal**: Production-ready quality with responsive design

| Task | Details |
|------|---------|
| Responsive layout | All breakpoints per DESIGN.md §10 |
| Animations & micro-interactions | Per DESIGN.md §9 |
| Loading states | Skeleton screens, terminal-style loading text |
| Error handling | Graceful error states, toast notifications |
| Performance optimization | Lazy loading, virtualized lists, image optimization |
| Cross-browser testing | Chrome, Firefox, Safari, Edge |
| Settings page | Profile editing, password change, data export |

**Exit Criteria**: All success criteria from §11 are met. Ready to deploy.

---

## 13. Deployment Strategy

Both deployment paths should be supported. The choice depends on user preference and operational comfort.

### Option A: Cloud Platform

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend (`web`) | Vercel | Optimized for Next.js, free tier |
| Backend services | Railway / Render / Fly.io | One service per dyno/container |
| PostgreSQL | Supabase / Neon | Managed Postgres, free tier available |
| Redis | Upstash | Serverless Redis, free tier |

**Pros**: Zero ops, auto-scaling, free tiers available  
**Cons**: Vendor lock-in, potential cold starts on free tiers

### Option B: Self-Hosted (Docker Compose)

| Component | Container | Notes |
|-----------|-----------|-------|
| All services | Docker Compose | Single `docker-compose.prod.yml` |
| PostgreSQL | `postgres:16-alpine` | Persistent volume |
| Redis | `redis:7-alpine` | Session + cache |
| Reverse proxy | Nginx | SSL termination, routing |

**Pros**: Full control, data sovereignty, single-machine simplicity  
**Cons**: Requires VPS, manual SSL setup, self-managed backups

### Environment Variables Required

| Variable | Used By | Description |
|----------|---------|-------------|
| `DATABASE_URL` | db package | PostgreSQL connection string |
| `REDIS_URL` | auth, search | Redis connection string |
| `JWT_SECRET` | auth-service | JWT signing secret |
| `TMDB_API_KEY` | search-service | TMDB API key |
| `RAWG_API_KEY` | search-service | RAWG API key |
| `GOOGLE_CLIENT_ID` | auth-service | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | auth-service | Google OAuth secret |
| `DISCORD_CLIENT_ID` | auth-service | Discord OAuth client ID |
| `DISCORD_CLIENT_SECRET` | auth-service | Discord OAuth secret |
| `ALLOW_REGISTRATION` | auth-service | Enable/disable registration (boolean) |
| `NEXT_PUBLIC_API_URL` | web | API gateway URL |

---

## 14. Future Roadmap (Post-v1.0)

### v1.1 — Data Portability
- Import from MAL XML export
- Import from AniList (via API)
- Public shareable profile links (opt-in)
- Friend activity feed

### v1.2 — Advanced Search
- Fallback API sources (Jikan REST API for anime/manga)
- User-selectable API source in search settings
- Multi-API search with deduplication
- Advanced filtering (by season, studio, platform)

### v2.0 — Intelligence & Scale
- AI-powered recommendations based on watch history
- Personalized discovery feeds
- PWA support for mobile
- Community features (if user base grows)

---

## 15. Versioning & Release Strategy

### Semantic Versioning

ShinDB follows **Semantic Versioning 2.0.0** (`MAJOR.MINOR.PATCH`):

| Component | When to Increment | Example |
|-----------|------------------|---------|
| **MAJOR** | Breaking changes to API contracts or database schema | 1.0.0 → 2.0.0 |
| **MINOR** | New features, backward-compatible | 1.0.0 → 1.1.0 |
| **PATCH** | Bug fixes, performance improvements | 1.0.0 → 1.0.1 |

### Changelog

- Maintained in `CHANGELOG.md` at the repository root
- Follows [Keep a Changelog](https://keepachangelog.com/) format
- Updated with every release (not every commit)

### Version Display

- System banner shows version: `OBSIDIAN CORE TRACKING ENVIRONMENT // V{VERSION} STABLE`
- Version available via `GET /health` endpoint on API gateway

---

## 16. Glossary

| Term | Definition |
|------|-----------|
| **Entry** | A single tracked media item (e.g., "Steins;Gate" as an anime entry) |
| **Media Type** | One of: anime, manga, movie, series, game |
| **Status** | Tracking state: watching/reading/playing, completed, plan_to_*, on_hold, dropped |
| **Progress** | Current consumption position (e.g., episode 5 of 24) |
| **External Source** | Third-party API from which metadata was fetched (AniList, TMDB, RAWG) |
| **Obsidian Terminal** | The design language/aesthetic of ShinDB |
| **System Operator** | The UI "voice" — all system text speaks as a terminal operator |
| **Gateway** | The API gateway service that routes frontend requests to backend microservices |
| **Compilation Rate** | Percentage of total entries that are in "completed" status |

---

> **This PRD is the single source of truth for what ShinDB v1.0 must deliver. All design decisions reference [DESIGN.md](file:///d:/02_CODE/04_WORKING/ShinDB/src/notes/DESIGN.md), and all architecture decisions reference [SYS_Tracker.md](file:///d:/02_CODE/04_WORKING/ShinDB/src/notes/SYS_Tracker.md).**
