# ShinDB — Design Specification

> **Version**: 1.0.0  
> **Last Updated**: 2026-10-16  
> **Status**: Complete (v1.0.0 Cyber-Neobrutalist Design System Implemented)  
> Complete visual design system, layout architecture, and interaction guide for the **ShinDB** personal media tracking application.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Visual Identity & Branding](#2-visual-identity--branding)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Layout Architecture](#5-layout-architecture)
6. [Page-by-Page Design Breakdown](#6-page-by-page-design-breakdown)
7. [Component Library](#7-component-library)
8. [Iconography](#8-iconography)
9. [Motion & Animation](#9-motion--animation)
10. [Responsive Behavior](#10-responsive-behavior)
11. [Design Tokens Reference](#11-design-tokens-reference)

---

## 1. Design Philosophy

### Core Aesthetic: "Obsidian Terminal"

SYS_Tracker's design is inspired by **advanced obsidian systems** — a fusion of cyberpunk terminal interfaces with modern dark-mode web design. The result is a UI that feels like a personal command console for archiving media across timelines.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Terminal-Inspired** | Monospace typography for system labels, bracket-wrapped tags like `[SYS_OPERATOR::ELITE]`, terminal-style status messages (`STATUS: SYNC_COMPLETE // OK`) |
| **Dark-First** | Deep black canvas (`#0a0a0f`) with no light mode — the darkness is the identity |
| **Color-Coded Borders** | Each media type has a distinct neon border color (purple for anime, orange for manga, green for games, cyan for movies+series) |
| **Data-Dense** | Dashboard displays statistics prominently — numbers are large, monospaced, and visually dominant |
| **Minimal Chrome** | No heavy shadows, no rounded-corner overuse — clean edges with 1px solid borders and subtle glow effects |
| **Content-Forward** | Media posters are the stars — the UI gets out of the way and lets cover art fill the grid |

---

## 2. Visual Identity & Branding

### Logo & App Name

- **Name**: `[ShinDB::MVP]` — displayed in monospace, uppercase, with bracket notation
- **Logo Icon**: A small purple/lavender `>_` terminal prompt icon (resembling a command cursor) placed to the left of the name
- **Logo Color**: Lavender/soft purple (`#b388ff` / `#a78bfa`)
- **Logo Background**: Subtle rounded-rectangle badge behind the icon

### Brand Voice in UI

The entire interface speaks in a "system operator" voice:

| UI Element | Example Text |
|-----------|-------------|
| Welcome banner | `ShinDB::CENTRAL_CONSOLE` |
| Subtitle | `OBSIDIAN CORE TRACKING ENVIRONMENT // V1.0.0 STABLE` |
| User role badge | `[SYS_OPERATOR::ELITE]` |
| Status indicator | `>_ STATUS: SYNC_COMPLETE // OK` |
| Node info | `IP: 127.0.0.1 // DEV_NODE` |
| Session badge | `>_ SESSION: ACTIVE_DEV` |
| Node state | `NODE_STATE: SECURE` |
| Section labels | `ANIME STATISTICS`, `MANGA STATISTICS` |
| Count labels | `[RECORDS_LOGGED]` |
| Completed count | `>_ 189 ARCHIVES SEALED` |

---

## 3. Color System

### 3.1 Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0a0a0f` | Main page background — near-black |
| `--bg-secondary` | `#111118` | Card backgrounds, content containers |
| `--bg-tertiary` | `#1a1a24` | Statistics section background, hover states |
| `--bg-elevated` | `#16161e` | Navbar, elevated containers |
| `--border-default` | `#2a2a3a` | Default 1px borders on cards and sections |
| `--border-subtle` | `#1e1e2e` | Divider lines, subtle separators |
| `--text-primary` | `#e8e8f0` | Primary text — slightly warm white |
| `--text-secondary` | `#8888a0` | Metadata, labels, descriptions |
| `--text-muted` | `#555566` | Placeholder text, disabled states |

### 3.2 Media Type Accent Colors

Each media type has a unique neon accent used for borders, badges, and section indicators:

| Media Type | Color | Hex | Usage |
|------------|-------|-----|-------|
| **Anime** | Purple | `#8b5cf6` | Card borders, section headers, filter pills |
| **Manga** | Orange | `#f97316` | Card borders, section headers |
| **Games** | Green/Emerald | `#10b981` | Card borders, section headers |
| **Movies+Series** | Cyan | `#06b6d4` | Card borders, section headers |
| **Combined/Total** | Blue (Soft) | `#3b82f6` | Total tracked stats |

### 3.3 Status Colors

| Status | Color | Hex | Context |
|--------|-------|-----|---------|
| Watching / Reading / Playing | Green | `#22c55e` | Active tracking dot, status badges |
| Completed | Blue | `#3b82f6` | Completed state dot and badge |
| Plan to Watch/Read | Gray-blue | `#6b7280` | Backlog state |
| On-Hold | Yellow | `#eab308` | Paused tracking |
| Dropped | Red | `#ef4444` | Abandoned entries |

### 3.4 Accent & Interaction Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-success` | `#22c55e` | Success states, "100% SUCCESS" label, sync OK |
| `--accent-session` | `#ef4444` | Session active badge background (red pulse) |
| `--accent-lavender` | `#a78bfa` | Logo, terminal prompt icon |
| `--accent-filter-active` | `#8b5cf6` | Active filter pill background |
| `--accent-link` | `#60a5fa` | Clickable links, "ALL ANIME STATS →" |

### 3.5 Media Type Card Border Styling

The stat cards on the dashboard use **thick colored top borders** (3-4px) with the rest of the border in the same accent color at reduced opacity:

```css
/* Example: Anime stat card */
.stat-card--anime {
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-top: 3px solid #8b5cf6;
}
```

---

## 4. Typography

### 4.1 Font Stack

| Role | Font | Fallback | Weight |
|------|------|----------|--------|
| **System / Terminal Labels** | `'JetBrains Mono'`, `'Fira Code'` | `monospace` | 400, 500 |
| **UI Text / Body** | `'Inter'`, `'Outfit'` | `system-ui, sans-serif` | 300, 400, 500, 600 |
| **Headings** | Same as terminal labels | `monospace` | 600, 700 |

### 4.2 Typography Scale

| Element | Size | Weight | Transform | Letter-Spacing | Font |
|---------|------|--------|-----------|----------------|------|
| App name `[ShinDB::MVP]` | 16px | 600 | uppercase | 1px | Mono |
| System banner title | 20px | 600 | uppercase | 1.5px | Mono |
| System banner subtitle | 12px | 400 | uppercase | 2px | Mono |
| Dashboard stat numbers | 48-56px | 700 | none | -1px | Mono |
| Section header labels | 14px | 600 | uppercase | 2px | Mono |
| Stat labels `[RECORDS_LOGGED]` | 11px | 400 | uppercase | 1.5px | Mono |
| Status messages | 12px | 400 | uppercase | 1px | Mono |
| Card titles (media names) | 13px | 500 | none | 0 | Sans |
| Metadata (year, progress) | 12px | 400 | none | 0 | Sans |
| Navigation links | 14px | 500 | uppercase | 1px | Mono |
| Filter pill text | 12px | 500 | uppercase | 0.5px | Mono |
| Search placeholder | 14px | 400 | uppercase | 1.5px | Mono |
| User display name | 18px | 600 | uppercase | 1px | Mono |
| User bio text | 13px | 400 | uppercase | 0.5px | Mono |

### 4.3 Text Casing Convention

Nearly all UI text uses **UPPERCASE** to maintain the terminal/system aesthetic. The exceptions:
- Media entry titles (title case, preserving original names)
- Long-form notes/descriptions (if any)
- User-generated content

---

## 5. Layout Architecture

### 5.1 Top Navigation Bar (Fixed)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [>_] [ShinDB::MVP]          ✧ DASHBOARD  ◎ ANIME  □ MANGA  ⊞ GAMES  ◫ MOVIES  ◫ SERIES │
└──────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Position**: Fixed top, full width
- **Height**: 48-56px
- **Background**: `#0a0a0f` with subtle bottom border (`1px solid #2a2a3a`)
- **Layout**: Flexbox — logo left, nav items center-right
- **Active State**: Active nav item has a bordered/highlighted appearance (subtle box outline)
- **Icons**: Each nav item has a small icon to its left (category-specific)

### 5.2 No Sidebar

Unlike the initial design reference, the **prototype uses a horizontal top-nav layout** with no persistent sidebar. All navigation is in the top bar.

### 5.3 Content Area

- **Max Width**: ~1280px, centered
- **Padding**: 24-32px horizontal, 24px vertical
- **Background**: `#0a0a0f` (same as page background — seamless)

### 5.4 Grid System

| Context | Columns | Gap | Card Aspect Ratio |
|---------|---------|-----|-------------------|
| Media poster grid (anime, manga, games, movies, series) | 7 columns (desktop) | 16px | ~2:3 portrait |
| Dashboard stat cards | 4 columns across | 16px | Auto height |
| Statistics sections | Full-width sections stacked vertically | 24px | N/A |
| Recently completed row | Horizontal scroll / 7+ items | 16px | ~2:3 portrait |

---

## 6. Page-by-Page Design Breakdown

### 6.1 Dashboard (`/dashboard`)

The dashboard is the central command console. It has these sections stacked vertically:

#### A. System Banner
```
┌──────────────────────────────────────────────────────────────────────────┐
│  ⊙ ShinDB::CENTRAL_CONSOLE                          NODE_STATE: SECURE │
│    OBSIDIAN CORE TRACKING ENVIRONMENT // V1.0.0 STABLE    >_ SESSION: ACTIVE_DEV │
└──────────────────────────────────────────────────────────────────────────┘
```
- Full-width card with subtle border
- Left: system title + version string
- Right: node state label + red session badge with pulse animation
- Border: 1px solid `#2a2a3a`

#### B. Search Bar
```
┌────────────────────────────────────────────────┐
│  🔍  SEARCH EXTERNAL & LOCAL DATABASES... [/]  │
└────────────────────────────────────────────────┘
```
- Centered, ~60% width
- Monospace placeholder text, uppercase
- `[/]` keyboard shortcut hint on the right
- 1px border, dark background

#### C. Profile Card + Stat Cards Row

```
┌─────────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  [avatar]        │  │ TOTAL    │  │ TOTAL    │  │ TOTAL    │  │ MOVIES+  │
│  [ShinDB::ELITE]│  │ ANIME    │  │ MANGA    │  │ GAMES    │  │ SERIES   │
│  SENPAI_09       │  │          │  │          │  │          │  │          │
│  IP: 127.0.0.1   │  │   211    │  │   10     │  │   26     │  │   116    │
│  ...bio text...  │  │[REC_LOG] │  │[REC_LOG] │  │[REC_LOG] │  │[REC_LOG] │
│  >_ STATUS: OK   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘
└─────────────────┘
```

- **Profile Card**: Left column (~35% width), contains:
  - Glitchy/static avatar image (small, centered)
  - Role badge: `[ShinDB::ELITE]` in a purple bordered pill
  - Username: `SENPAI_09` in bold mono
  - IP address and node type
  - Bio text (dashed separator above)
  - Status line with green "OK" text

- **Stat Cards**: 4 cards in a row, each with:
  - **Colored top border** (purple, orange, green, cyan)
  - **Category icon** in top-right
  - **Label**: `TOTAL ANIME` etc., uppercase mono
  - **Number**: Huge font (~48px), mono
  - **Sublabel**: `[RECORDS_LOGGED]`, tiny uppercase mono

#### D. Summary Stats Row

```
┌────────────────────────────────────┐  ┌──────────────────────────────┐
│  ☑ TOTAL TRACKED                   │  │   135       189        22   │
│     363 ITEMS   COMPILATION RATE   │  │  ACTIVE     DONE    BACKLOG │
│                   100% SUCCESS     │  │   ⊙          ☑         ⏳    │
└────────────────────────────────────┘  └──────────────────────────────┘
```

- Two cards side-by-side
- Left: Total tracked count + compilation rate with green "100% SUCCESS"
- Right: Three sub-stats (Active, Done, Backlog) with icons above each number

#### E. Per-Media-Type Statistics Sections

Each media type (Anime, Manga, Games, Movies+Series) gets its own statistics card:

```
┌─ 📁 ANIME STATISTICS ─────────────────────── ALL ANIME STATS →  ANIME MOVIES ─┐
│                                                                                  │
│  DAYS WATCHED    MEAN SCORE     ● Watching 66      Total Entries    211  │  LAST ANIME UPDATES  │
│     8.0            7.86         ● Completed 115    Episodes Watched 500  │  [Oshi No Ko]        │
│                                 ● On-Hold 0                             │   Watching • 8/11 EP  │
│                                 ● Dropped 13                            │  [Zom 100]            │
│                                 ● Plan to Watch 17                      │   Dropped • 0/12 EP   │
│                                                                         │  [Your Lie in April]  │
│                                                                         │   Plan to Watch       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Section header badge**: Category icon + label in a pill badge with the type's accent color border.
- Anime: Purple border pill `📁 ANIME STATISTICS`
- Manga: Orange border pill `📖 MANGA STATISTICS`
- Games: Green border pill
- Movies+Series: Cyan border pill

**Content layout** (3-column inside the card):
1. **Left**: Days consumed + Mean score (large mono numbers)
2. **Center**: Status breakdown as dot-list with counts + total entries/episodes count
3. **Right**: "LAST ANIME UPDATES" — a list of 3 recent entries with small cover thumbnails, title, status, progress, and score

**Section links**: Top-right corner of each section has links like `ALL ANIME STATS →` and `ANIME MOVIES`

#### F. Currently Watching/Active Section
A horizontal scrolling row of poster cards showing currently active media.

#### G. Recently Completed Section
```
┌─ ■ RECENTLY COMPLETED ──────────────────────── >_ 189 ARCHIVES SEALED ─┐
│  [poster] [poster] [poster] [poster] [poster] [poster] [poster]        │
│  title     title    title    title    title    title    title            │
└─────────────────────────────────────────────────────────────────────────┘
```
- Section header with green accent square icon
- Right side: count badge `>_ 189 ARCHIVES SEALED` in green
- Horizontal grid of 7+ poster thumbnails with titles

---

### 6.2 Media List Pages (`/anime`, `/manga`, `/games`, `/movies`, `/series`)

All 5 media category pages share an identical layout structure with only the content and accent colors changing:

#### Page Header
```
📁 ALL ANIME SERIES  ◇  211 results         ↕ Sort  ▼ Filter  ⚙ Properties  🔍 Search  + New
```
- Left: Category icon + `ALL [TYPE]` label + result count (with refresh icon)
- Right: Toolbar with Sort, Filter (accent colored), Properties, Search, + New buttons
- Filter text uses accent color (e.g., purple `Filter` for anime)

#### Filter Pills
```
[ ALL ]  [ WATCHING ]  [ COMPLETED ]  [ PLAN TO WATCH ]  [ DROPPED ]
```
- Horizontal row of filter pills below the header
- **Active pill**: Filled background with accent color (e.g., purple for anime)
- **Inactive pills**: Outlined/transparent with border
- Pills are adapted per media type:
  - Anime: ALL, WATCHING, COMPLETED, PLAN TO WATCH, DROPPED
  - Manga: ALL, READING, COMPLETED, PLAN TO READ, DROPPED
  - Games: ALL, PLAYING, COMPLETED, PLAN TO WATCH, DROPPED

#### Media Grid
- **7-column grid** of poster cards
- Each card is a **cover image** at ~2:3 aspect ratio
- Below each poster: **title text** (truncated with ellipsis if too long, includes year)
- **No visible ratings, badges, or overlay** in the default grid view — clean poster-only layout
- Grid scrolls vertically with consistent 16px gaps

---

### 6.3 Friends Page (`/friends`) — Future

- Friends list with user cards
- Each card: avatar, username, display name, current activity
- Friend request management (pending/accept/reject)
- Click into a friend to see their profile + tracked media

### 6.4 Profile Page (`/profile`) — Future

- Profile header (avatar, username, role badge, bio, stats summary)
- Media distribution charts
- Recent activity feed
- Edit profile capability

### 6.5 Settings Page (`/settings`) — Future

- Tabbed layout (Profile, Account, Preferences)
- Avatar upload
- Bio editing textarea
- Password change
- Theme preferences

---

## 7. Component Library

### 7.1 Stat Card

```
┌──────────────────────────┐
│  TOTAL ANIME         📁  │  ← Label + icon, uppercase mono
│                          │
│        211               │  ← Large number, mono, accent color
│                          │
│    [RECORDS_LOGGED]      │  ← Sublabel, tiny, muted
└──────────────────────────┘
```

| Property | Value |
|----------|-------|
| Border | `1px solid {accent-color @ 40%}` |
| Border-top | `3px solid {accent-color}` |
| Background | `#111118` |
| Border-radius | `4px` |
| Padding | `20px 24px` |
| Number font-size | `48px` |
| Number font-weight | `700` |
| Number font-family | monospace |

### 7.2 Media Poster Card

```
┌─────────────────┐
│                  │
│  [cover image]   │  ← 2:3 ratio, object-fit: cover
│                  │
│                  │
└─────────────────┘
  Title (Year)         ← Below card, truncated
```

| Property | Value |
|----------|-------|
| Aspect ratio | 2:3 |
| Border-radius | `4px` |
| Overflow | hidden |
| Hover effect | Subtle brightness increase or scale(1.02) |
| Title font-size | `13px` |
| Title truncation | `text-overflow: ellipsis`, single line |
| Title color | `#8888a0` (cyan/muted) |

### 7.3 Section Header Badge

```
┌─ 📁 ANIME STATISTICS ─┐
└────────────────────────┘
```

| Property | Value |
|----------|-------|
| Border | `1px solid {accent-color}` |
| Background | Transparent |
| Border-radius | `4px` |
| Padding | `6px 16px` |
| Font | Mono, 14px, 600, uppercase |
| Letter-spacing | `2px` |
| Icon | Left of text |

### 7.4 Filter Pill

| State | Background | Border | Text Color |
|-------|-----------|--------|------------|
| Active | `{accent-color}` | `1px solid {accent-color}` | White |
| Inactive | Transparent | `1px solid #2a2a3a` | `#8888a0` |
| Hover | `rgba(accent, 0.1)` | `1px solid {accent-color}` | `#e8e8f0` |

| Property | Value |
|----------|-------|
| Border-radius | `4px` |
| Padding | `6px 16px` |
| Font | Mono, 12px, 500, uppercase |
| Cursor | pointer |
| Transition | `all 0.2s ease` |

### 7.5 Navigation Item

| State | Style |
|-------|-------|
| Default | Icon + label, `#8888a0` text |
| Hover | `#e8e8f0` text, subtle background |
| Active | Bordered pill/box outline, white text, icon highlighted |

### 7.6 System Banner Card

| Property | Value |
|----------|-------|
| Background | `#111118` |
| Border | `1px solid #2a2a3a` |
| Border-radius | `6px` |
| Padding | `16px 24px` |
| Layout | Flex, space-between |
| Left content | System title (20px mono bold) + subtitle (12px mono) |
| Right content | Node state label + Session badge |

### 7.7 Session Badge

```
>_ SESSION: ACTIVE_DEV
```
| Property | Value |
|----------|-------|
| Background | `#ef4444` (red) |
| Text | White, mono, 12px, uppercase |
| Border-radius | `4px` |
| Padding | `4px 12px` |
| Animation | Subtle pulse glow |

### 7.8 User Role Badge

```
[ShinDB::ELITE]
```
| Property | Value |
|----------|-------|
| Background | Transparent |
| Border | `1px solid #a78bfa` (lavender) |
| Text | Lavender, mono, 11px |
| Border-radius | `2px` |
| Padding | `2px 8px` |

### 7.9 Status Dot Indicator

Small colored dots (8px diameter) used in statistics breakdown:
- `●` Green = Watching/Reading/Playing
- `●` Blue = Completed  
- `●` Gray = Plan to Watch/Read
- `●` Yellow = On-Hold
- `●` Red = Dropped

### 7.10 Activity Entry (Last Updates)

```
┌────────────────────────────────────────────────────────┐
│  [thumb]  [Oshi No Ko]                                 │
│           Watching • Progress 8/11 EP • Scored 7.8     │
└────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Thumbnail | 40x56px, rounded 2px |
| Title | 14px, sans, 500 weight, white |
| Metadata | 12px, sans, 400 weight, muted text |
| Progress bar | Thin colored line below entry (accent color based on media type) |
| Layout | Flex row, gap 12px |

### 7.11 Search Bar

| Property | Value |
|----------|-------|
| Width | ~60% of content area (centered) |
| Background | `#111118` |
| Border | `1px solid #2a2a3a` |
| Border-radius | `6px` |
| Padding | `12px 20px` |
| Font | Mono, 14px, uppercase |
| Placeholder color | `#555566` |
| Icon | Magnifying glass, left side |
| Shortcut badge | `[/]` on right side, muted |

### 7.12 Toolbar Button

Toolbar items (`Sort`, `Filter`, `Properties`, `Search`, `+ New`):

| Property | Value |
|----------|-------|
| Background | Transparent |
| Text | 13px, mono, `#8888a0` |
| Hover | `#e8e8f0` text |
| Icon | Left of text, same color |
| Special: Filter | Text in accent color when filters active |
| Special: + New | May have accent background |

---

## 8. Iconography

### Icon Style

- **Type**: Line/outline icons (not filled)
- **Size**: 16-20px in navigation, 14px in buttons
- **Color**: Inherits text color (`#8888a0` default, white on active)

### Icon Mapping

| Element | Icon | Description |
|---------|------|-------------|
| Dashboard | `✧` / sparkle | Command/magic wand style |
| Anime | `📁` / folder-open | Folder with play indicator |
| Manga | `📖` / book-open | Open book |
| Games | `🎮` / gamepad | Controller/gamepad |
| Movies | `🎬` / clapperboard | Film clapperboard |
| Series | `📺` / tv | Television/monitor |
| Search | `🔍` / magnifier | Magnifying glass |
| Sort | `↕` / arrows | Up-down arrows |
| Filter | `▼` / funnel | Funnel/filter |
| Properties | `⚙` / gear | Settings gear |
| New | `+` / plus | Plus sign |
| Refresh | `◇` / diamond | Rotating diamond/sync |
| Active | `⊙` / play | Play/circle |
| Done | `☑` / check | Checkbox checked |
| Backlog | `⏳` / clock | Timer/clock |
| Status OK | `>_` / terminal | Terminal prompt |

---

## 9. Motion & Animation

### 9.1 Page Transitions

- **Route change**: Fade-in content area (`opacity: 0 → 1`, `200ms ease`)
- **No page-level sliding** — keep it clean and terminal-like

### 9.2 Component Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Stat card numbers | Count-up on load | 800ms | `ease-out` |
| Session badge | Pulse glow | 2s infinite | `ease-in-out` |
| Poster card hover | `scale(1.02)` + brightness boost | 200ms | `ease` |
| Filter pill click | Background color fill | 150ms | `ease` |
| Status sync message | Typewriter text reveal | 600ms | `steps()` |
| Nav item hover | Text color shift | 150ms | `ease` |
| Search bar focus | Border color accent + subtle glow | 200ms | `ease` |
| Modal overlay | Backdrop fade + card slide-up | 250ms | `ease-out` |
| Activity entries | Staggered fade-in from bottom | 100ms delay each | `ease-out` |

### 9.3 Loading States

- **Skeleton screens**: Dark gradient shimmer (`#111118` → `#1a1a24` → `#111118`)
- **No spinners** — terminal-style loading: `>_ LOADING RECORDS...` with blinking cursor

### 9.4 Micro-Interactions

- **Poster grid scroll**: Smooth scroll, no snap
- **Filter pill toggle**: Instant background fill with color
- **Stat card border**: Subtle glow pulse on the accent-colored border (optional)
- **Status OK text**: Green color with slight text-shadow glow

---

## 10. Responsive Behavior

### Breakpoints

| Breakpoint | Width | Grid Columns | Notes |
|------------|-------|--------------|-------|
| **Desktop XL** | ≥1440px | 8 posters per row | Full stat cards visible |
| **Desktop** | 1024–1439px | 7 posters per row | Default layout |
| **Tablet** | 768–1023px | 4-5 posters per row | Nav collapses to icons |
| **Mobile** | <768px | 3 posters per row | Hamburger menu, stacked stats |

### Responsive Adaptations

| Component | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| Top nav | Full labels + icons | Icons only | Hamburger menu |
| Stat cards | 4 across | 2x2 grid | Stacked vertically |
| Profile card | Left column | Full width above stats | Full width |
| Media grid | 7 columns | 4-5 columns | 3 columns |
| Search bar | 60% width centered | 80% width | Full width |
| Statistics section | 3-column layout | 2 columns | Stacked |
| Section header | Full label | Shortened | Icon only |

---

## 11. Design Tokens Reference

### Complete CSS Custom Properties

```css
:root {
  /* ── Backgrounds ── */
  --bg-primary: #0a0a0f;
  --bg-secondary: #111118;
  --bg-tertiary: #1a1a24;
  --bg-elevated: #16161e;
  --bg-overlay: rgba(0, 0, 0, 0.7);

  /* ── Borders ── */
  --border-default: #2a2a3a;
  --border-subtle: #1e1e2e;
  --border-focus: #8b5cf6;

  /* ── Text ── */
  --text-primary: #e8e8f0;
  --text-secondary: #8888a0;
  --text-muted: #555566;
  --text-accent: #a78bfa;

  /* ── Media Type Accents ── */
  --accent-anime: #8b5cf6;
  --accent-manga: #f97316;
  --accent-games: #10b981;
  --accent-movies: #06b6d4;
  --accent-series: #06b6d4;

  /* ── Status Colors ── */
  --status-watching: #22c55e;
  --status-completed: #3b82f6;
  --status-plan: #6b7280;
  --status-on-hold: #eab308;
  --status-dropped: #ef4444;

  /* ── Functional ── */
  --accent-success: #22c55e;
  --accent-danger: #ef4444;
  --accent-warning: #eab308;
  --accent-info: #3b82f6;
  --accent-session: #ef4444;

  /* ── Typography ── */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  --font-sans: 'Inter', 'Outfit', system-ui, -apple-system, sans-serif;

  /* ── Spacing Scale ── */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* ── Border Radius ── */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 6px;
  --radius-xl: 8px;
  --radius-pill: 9999px;

  /* ── Shadows ── */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-glow-purple: 0 0 20px rgba(139, 92, 246, 0.15);
  --shadow-glow-green: 0 0 12px rgba(34, 197, 94, 0.2);
  --shadow-glow-red: 0 0 12px rgba(239, 68, 68, 0.2);

  /* ── Transitions ── */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;

  /* ── Z-Index Scale ── */
  --z-base: 0;
  --z-card: 10;
  --z-navbar: 100;
  --z-modal-backdrop: 500;
  --z-modal: 510;
  --z-toast: 600;
  --z-tooltip: 700;

  /* ── Layout ── */
  --navbar-height: 52px;
  --content-max-width: 1280px;
  --grid-gap: 16px;
  --poster-columns: 7;
  --poster-aspect-ratio: 2 / 3;
}
```

---

## Visual Reference

The design was prototyped as a fully functional HTML/CSS page. Key visual references:

### Dashboard View
- Deep black background with terminal-inspired system banner
- Color-coded stat cards with thick accent borders
- Per-media-type statistics sections with dot-based status breakdowns

### Media Grid View
- Clean 7-column poster grid, minimal chrome
- Category-specific filter pills with accent colors
- Toolbar with sort, filter, properties, search, and new buttons

### Design Language Summary

| Attribute | Decision |
|-----------|----------|
| Mode | Dark only |
| Personality | System operator / terminal console |
| Typography | Monospace for labels, sans-serif for content |
| Borders | 1px solid, colored accents on top edges |
| Rounded corners | Minimal (2-6px), no heavy rounding |
| Shadows | Near-zero, replaced by subtle glow effects |
| Content density | High — data-forward, numbers prominent |
| Media display | Poster-centric grids, minimal card decoration |
| Text casing | Uppercase for all system/UI text |
| Animation style | Terminal-inspired (typewriter, count-up, pulse) |

---

> **This document should serve as the single source of truth for implementing the ShinDB frontend. All components, colors, typography, and layout decisions are derived from the working prototype.**
