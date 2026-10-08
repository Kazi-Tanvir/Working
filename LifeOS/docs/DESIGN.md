# 🚀 Plan for Life OS — Design Document

> A centralized command center for Academic, Entertainment, Projects, Finance & Media tracking.  
> Dark-themed, Notion-inspired, premium dashboard experience.

---

## 🎨 Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0F0F0F` | Main background (near-black) |
| `--bg-secondary` | `#1A1A1A` | Card backgrounds |
| `--bg-tertiary` | `#242424` | Elevated surfaces, hover states |
| `--border` | `#2A2A2A` | Card borders, dividers |
| `--text-primary` | `#F5F5F5` | Headings, primary text |
| `--text-secondary` | `#A0A0A0` | Body text, descriptions |
| `--text-muted` | `#666666` | Labels, timestamps |
| `--accent-red` | `#FF4D6A` | Primary accent (CTAs, highlights) |
| `--accent-green` | `#34D399` | Income, success, completed |
| `--accent-purple` | `#A78BFA` | Entertainment, ongoing |
| `--accent-blue` | `#60A5FA` | Academic, info |
| `--accent-amber` | `#FBBF24` | Finance, warnings |
| `--accent-cyan` | `#22D3EE` | Projects, progress |
| `--accent-pink` | `#F472B6` | Media consumption |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page Title | `Outfit` | 32px | 700 |
| Section Header | `Outfit` | 20px | 600 |
| Card Title | `Inter` | 15px | 600 |
| Body | `Inter` | 14px | 400 |
| Caption | `Inter` | 12px | 400 |
| Stat Number | `JetBrains Mono` | 28px | 700 |

### Card Style (Glassmorphism-lite)

```
background: rgba(26, 26, 26, 0.8);
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 16px;
backdrop-filter: blur(12px);
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

On hover:
```
border-color: rgba(255, 77, 106, 0.3);
transform: translateY(-2px);
box-shadow: 0 8px 32px rgba(255, 77, 106, 0.1);
```

---

## 📐 Global Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌─────────┐  ┌───────────────────────────────────────────────────┐  │
│  │         │  │                  TOP BAR                         │  │
│  │         │  │  🔍 Search    📅 Jun 27, 2026    🔔    👤 Tamim  │  │
│  │         │  └───────────────────────────────────────────────────┘  │
│  │  SIDE   │  ┌───────────────────────────────────────────────────┐  │
│  │  BAR    │  │                                                   │  │
│  │         │  │              MAIN CONTENT AREA                    │  │
│  │  240px  │  │           (scrollable, responsive)                │  │
│  │  fixed  │  │                                                   │  │
│  │         │  │            Varies per section                     │  │
│  │         │  │                                                   │  │
│  │         │  │                                                   │  │
│  │         │  │                                                   │  │
│  └─────────┘  └───────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Sidebar Design

```
┌─────────────────────────┐
│                         │
│   ⚡ LIFE OS            │  ← Logo + app name, gradient text
│                         │
│  ─────────────────────  │
│                         │
│   🏠  Dashboard         │  ← Active: red accent left-border
│                         │
│   📚  Academic          │
│                         │
│   🎮  Entertainment     │
│                         │
│   🚀  Projects          │
│                         │
│   💰  Finance           │
│                         │
│   📺  Media             │
│                         │
│  ─────────────────────  │
│                         │
│   ⚙️  Settings          │
│   📝  Global Notes      │
│                         │
│  ─────────────────────  │
│                         │
│   ┌─────────────────┐   │
│   │  🟢 All systems  │   │  ← Status indicator
│   │     online       │   │
│   └─────────────────┘   │
│                         │
└─────────────────────────┘
```

**Sidebar behavior:**
- Fixed on desktop (240px wide)
- Collapsible to icon-only mode (64px) via hamburger
- Active item has `accent-red` left border + subtle red background glow
- Hover: slide-in highlight with smooth 200ms transition
- Each nav item has an emoji icon + label

---

## 0️⃣ DASHBOARD — Main Command Center

> The hero page. A bird's-eye view of everything in your life.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──── HERO BANNER ──────────────────────────────────────────┐  │
│  │                                                            │  │
│  │   ☀️ Good Afternoon, Tamim                                 │  │
│  │   Friday, June 27, 2026                                    │  │
│  │                                                            │  │
│  │   "Focus on progress, not perfection."                     │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ── QUICK STATS ROW ─────────────────────────────────────────── │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐  │
│  │ 📚 ACAD  │ │ 🎮 ENTER │ │ 🚀 PROJ  │ │ 💰 FIN   │ │📺 MED│  │
│  │          │ │          │ │          │ │          │ │      │  │
│  │ 2 Exams  │ │ 3 Ongoin │ │ 3 Active │ │ ৳12,450  │ │ 47hr │  │
│  │ pending  │ │ 128 total│ │ 67% avg  │ │ balance  │ │ /week│  │
│  │          │ │          │ │          │ │          │ │      │  │
│  │  →VIEW   │ │  →VIEW   │ │  →VIEW   │ │  →VIEW   │ │→VIEW │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘  │
│                                                                 │
│  ── SECTION SPOTLIGHTS (2-col grid) ────────────────────────── │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐│
│  │ 📚 ACADEMIC SNAPSHOT        │ │ 🎮 CURRENTLY CONSUMING      ││
│  │                             │ │                             ││
│  │ ⏰ Next Exam:               │ │ ┌─────┐ Solo Leveling S2   ││
│  │    Data Structures          │ │ │ IMG │ Ep 8/12 · Anime    ││
│  │    Jul 15, 2026 (18 days)   │ │ └─────┘                    ││
│  │                             │ │ ┌─────┐ Breaking Bad S4    ││
│  │ 📋 Pending Assignments: 2   │ │ │ IMG │ Ep 3/13 · Series   ││
│  │  · OS Lab Report  (Jul 1)  │ │ └─────┘                    ││
│  │  · Math HW #7     (Jun 30) │ │ ┌─────┐ Elden Ring         ││
│  │                             │ │ │ IMG │ 45hrs · PC Game    ││
│  │ 📅 Next Class: Tomorrow    │ │ └─────┘                    ││
│  │    Algorithms, 10:00 AM     │ │                             ││
│  └─────────────────────────────┘ └─────────────────────────────┘│
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐│
│  │ 🚀 PROJECT STATUS           │ │ 💰 FINANCE SNAPSHOT         ││
│  │                             │ │                             ││
│  │ ┌─────────────────────────┐ │ │ Net Worth    ৳ 24,580      ││
│  │ │ shinDB       🟡 78%    │ │ │ ─────────────────────────── ││
│  │ │ ████████████░░░░       │ │ │ CASH    ৳5,200   BKASH ৳3K ││
│  │ └─────────────────────────┘ │ │ SAVINGS ৳16,380            ││
│  │ ┌─────────────────────────┐ │ │                             ││
│  │ │ VOX Agent    🟡 45%    │ │ │ June Spending    ৳8,420     ││
│  │ │ ██████░░░░░░░░░░       │ │ │ ██████████ Groceries  38%  ││
│  │ └─────────────────────────┘ │ │ ██████░░░ Travel      22%  ││
│  │ ┌─────────────────────────┐ │ │ █████░░░░ Core        18%  ││
│  │ │ E-commerce   🔵 20%    │ │ │ ███░░░░░░ Education   12%  ││
│  │ │ ███░░░░░░░░░░░░░       │ │ │ ██░░░░░░░ Other       10%  ││
│  │ └─────────────────────────┘ │ │                             ││
│  └─────────────────────────────┘ └─────────────────────────────┘│
│                                                                 │
│  ── QUICK ACTIONS ──────────────────────────────────────────── │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ + Add    │ │ + Log    │ │ + New    │ │ + Import │          │
│  │ Exam     │ │ Expense  │ │ Project  │ │ Media    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ── RECENT ACTIVITY FEED ──────────────────────────────────── │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🟢 10:15 AM  Completed Assignment: OS Lab Report            ││
│  │ 🔴 09:30 AM  Expense: ৳480 — Groceries/Food (CASH)         ││
│  │ 🟣 09:00 AM  Watched: Solo Leveling S2 Ep 8                ││
│  │ 🔵 Yesterday  Pushed 3 commits to shinDB                   ││
│  │ 🟡 Yesterday  Income: ৳10,000 — Mother (CASH)              ││
│  │ ...                                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Card Interactions
- **Stat cards** (top row): Glow on hover with section-specific accent color, click navigates to section
- **Spotlight cards**: Live-updating content, subtle fade-in animation on load
- **Quick action buttons**: Pill-shaped, ghost style → solid on hover with accent color fill
- **Activity feed**: Infinite scroll, color-coded dots per section

---

## 1️⃣ ACADEMIC SECTION

### Sub-navigation (Tabs)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  📚 Academic                                                    │
│  ─────────────────────────────────────────────────────────────  │
│  [ Tracker ]  [ Materials ]  [ Notes ]  [ Codes ]              │
│    ═══════                                                      │
│       ↑ active tab has accent-blue underline                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1A. Tracker Tab

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ── 📝 EXAMS ───────────────────────────────── [+ Add Exam] ── │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ SUBJECT          │ SYLLABUS        │ DATE       │ RESULT  │  │
│  │──────────────────│─────────────────│────────────│─────────│  │
│  │ Data Structures  │ Ch 1-8, Trees,  │ Jul 15 '26 │ ⏳      │  │
│  │                  │ Graphs, Sorting │            │ pending │  │
│  │──────────────────│─────────────────│────────────│─────────│  │
│  │ Algorithms       │ DP, Greedy,     │ Jul 20 '26 │ ⏳      │  │
│  │                  │ Backtracking    │            │ pending │  │
│  │──────────────────│─────────────────│────────────│─────────│  │
│  │ Discrete Math    │ Full syllabus   │ Jun 10 '26 │ 🟢 3.75│  │
│  │                  │                 │            │  / 4.0  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ── 📅 CLASSES ─────────────────────────────── [+ Add Class] ─ │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Weekly calendar view (similar to Obsidian calendar ref)  │  │
│  │                                                           │  │
│  │       SUN    MON    TUE    WED    THU    FRI    SAT       │  │
│  │  8AM         ┌───┐         ┌───┐                         │  │
│  │              │DSA│         │DSA│                          │  │
│  │  9AM         └───┘         └───┘                         │  │
│  │  10AM  ┌────┐       ┌────┐       ┌────┐                  │  │
│  │        │ALGO│       │ALGO│       │ALGO│                  │  │
│  │  11AM  └────┘       └────┘       └────┘                  │  │
│  │  ...                                                      │  │
│  │  Color-coded blocks per subject, Obsidian-calendar style  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ── 📋 ASSIGNMENTS ─────────────────────── [+ Add Assignment] ─│
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │ 🔴 OVERDUE                                                │  │
│  │  (none)                                                   │  │
│  │                                                           │  │
│  │ 🟡 DUE THIS WEEK                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ ☐  Math HW #7             Due: Jun 30  (3 days)    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │ 🟢 UPCOMING                                               │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ ☐  OS Lab Report          Due: Jul 1   (4 days)    │  │  │
│  │  │ ☐  DB Project Phase 2     Due: Jul 10  (13 days)   │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │ ✅ COMPLETED (collapsed by default)                       │  │
│  │  ▶ 5 completed assignments                               │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1B. Materials Tab

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🔍 Search materials...                    [Filter ▼] [+ Add]  │
│                                                                 │
│  ── CATEGORIES (horizontal filter pills) ──                     │
│  [ All ] [ 📄 Lecture Sheets ] [ 📕 Books ] [ 📝 Notes ]        │
│  [ ❓ Previous Questions ] [ 📎 Source Material ]               │
│                                                                 │
│  ── GRID VIEW ──────────────────────────────────────────────── │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ 📄         │ │ 📕         │ │ 📄         │ │ ❓         │  │
│  │            │ │            │ │            │ │            │  │
│  │ DSA Lec 5  │ │ Cormen     │ │ OS Lec 12  │ │ DSA Mid    │  │
│  │ Lecture    │ │ CLRS Book  │ │ Lecture    │ │ 2024       │  │
│  │            │ │            │ │            │ │            │  │
│  │ Jun 20     │ │ Semester   │ │ Jun 18     │ │ Jun 15     │  │
│  │ 📎 PDF     │ │ 📎 PDF     │ │ 📎 PDF     │ │ 📎 PDF     │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1C. Personal Notes Tab

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ── SOURCE TOGGLE ──                                            │
│  [ 📸 Scanned (Hard Copy) ]  [ 💻 Digital (Obsidian) ]          │
│                                                                 │
│  ── SCANNED NOTES ──────────────────────────────────────────── │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  📸 Upload scan     Drag & drop or click to upload         │ │
│  │     ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │ │
│  │     Supports: JPG, PNG, PDF                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ 📸       │ │ 📸       │ │ 📸       │                       │
│  │ Math     │ │ DSA      │ │ Physics  │                       │
│  │ Ch3 Sol  │ │ Tree     │ │ Formula  │                       │
│  │ Jun 22   │ │ Notes    │ │ Sheet    │                       │
│  └──────────┘ └──────────┘ └──────────┘                       │
│                                                                 │
│  ── DIGITAL NOTES (Obsidian Link) ─────────────────────────── │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🔗 Connected to Obsidian vault                            │ │
│  │     Path: D:\Obsidian\Academic\                            │ │
│  │     Last synced: 2 hours ago                               │ │
│  │     [Open in Obsidian] [Refresh]                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1D. Codes Tab

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🐙 GitHub Integration                    [⚙️ Configure]       │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Status: 🟢 Connected                                      │ │
│  │  Repos synced: 12                                           │ │
│  │  Last activity: 3 hours ago                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ── RECENT REPOSITORIES ─────────────────────────────────────  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  📁 shinDB              ★ 12   🔀 3 PRs    Updated 3h ago │ │
│  │  📁 portfolio-site      ★ 5    🔀 0 PRs    Updated 2d ago │ │
│  │  📁 dsa-solutions       ★ 0    🔀 0 PRs    Updated 5d ago │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ ENTERTAINMENT TRACKING

> Connected to shinDB. Tracks anime, movies, series, manga, games.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🎮 Entertainment Tracker          🔗 Connected to shinDB      │
│                                                                 │
│  ── STATS BAR ──────────────────────────────────────────────── │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  📊 342  │ │  ⏱ 1,240 │ │  ⭐ 7.8  │ │  ▶️ 12   │          │
│  │  Total   │ │  Hours   │ │  Avg     │ │  Ongoing │          │
│  │  Entries │ │  Watched │ │  Score   │ │          │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ── STATUS FILTER (tabs) ──                                     │
│  [ All ] [ ▶️ Ongoing ] [ ✅ Completed ] [ 📋 Plan to Consume ] │
│  [ ⏸ On Hold ] [ ❌ Dropped ]                                   │
│                                                                 │
│  ── MEDIA TYPE FILTER (pills) ──                                │
│  [ All ] [🎬 Anime] [🎬 Anime Movies] [📺 Series] [🎥 Movies]  │
│  [📖 Manga] [🎮 PC Games] [📱 Mobile Games]                     │
│                                                                 │
│  ── MEDIA GRID ─────────────────────────────────────────────── │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │  │
│  │ │  COVER │ │ │ │  COVER │ │ │ │  COVER │ │ │ │  COVER │ │  │
│  │ │  ART   │ │ │ │  ART   │ │ │ │  ART   │ │ │ │  ART   │ │  │
│  │ │        │ │ │ │        │ │ │ │        │ │ │ │        │ │  │
│  │ └────────┘ │ │ └────────┘ │ │ └────────┘ │ │ └────────┘ │  │
│  │ Solo       │ │ Breaking   │ │ Elden      │ │ One Piece  │  │
│  │ Leveling   │ │ Bad        │ │ Ring       │ │            │  │
│  │ ▶️ Ongoing  │ │ ▶️ Ongoing  │ │ ▶️ Ongoing  │ │ ✅ Done    │  │
│  │ Ep 8/12    │ │ S4 E3/13   │ │ 45 hrs     │ │ ⭐ 9.5     │  │
│  │ ⭐ 8.5     │ │ ⭐ 9.2     │ │ ⭐ 9.0     │ │ 🎬 Anime   │  │
│  │ 🎬 Anime   │ │ 📺 Series  │ │ 🎮 PC Game │ │            │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                 │
│  ── STATS BREAKDOWN (bottom section) ──────────────────────── │
│  ┌──────────────────────────────┐ ┌────────────────────────────┐│
│  │ 📊 BY TYPE                   │ │ 📊 BY STATUS               ││
│  │                              │ │                            ││
│  │ Anime        ████████ 142    │ │ Completed  ████████ 245    ││
│  │ Series       █████░░░  86    │ │ Ongoing    ██░░░░░  12     ││
│  │ Movies       ████░░░░  52    │ │ Plan to..  ███░░░░  48     ││
│  │ Manga        ███░░░░░  32    │ │ On Hold    █░░░░░░   8     ││
│  │ PC Games     ██░░░░░░  18    │ │ Dropped    █░░░░░░  29     ││
│  │ Anime Movies █░░░░░░░   8    │ │                            ││
│  │ Mobile Games █░░░░░░░   4    │ │                            ││
│  └──────────────────────────────┘ └────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Media Card Detail (Modal on click)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                          [ ✕ ] │
│  ┌──────────┐                                                  │
│  │          │  Solo Leveling Season 2                           │
│  │  COVER   │  🎬 Anime  ·  ▶️ Ongoing  ·  ⭐ 8.5 / 10        │
│  │  ART     │                                                  │
│  │  (large) │  Progress: Ep 8 / 12   ████████░░░░ 67%          │
│  │          │                                                  │
│  │          │  Started: May 12, 2026                            │
│  │          │  Watchtime: ~3.2 hrs                              │
│  └──────────┘                                                  │
│                                                                 │
│  ── NOTES ───────────────────────────────────────────────────  │
│  Great animation quality. Shadow monarch arc is peak.           │
│                                                                 │
│  [Update Progress]  [Change Status]  [Edit]  [Delete]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ PROJECT TRACKING

> Inspired by the Systemiz OS "Projects & Tasks" reference.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🚀 Projects                              [+ New Project]      │
│  "Track every project from idea to launch."                     │
│                                                                 │
│  ── VIEW TOGGLE ──                                              │
│  [ gallery ]  [ table ]  [ board ]                              │
│    ═══════                                                      │
│                                                                 │
│  ── PROJECT CARDS (Gallery View) ──────────────────────────── │
│  ┌────────────────────────┐ ┌────────────────────────┐         │
│  │ 📁 shinDB              │ │ 📁 VOX Agent            │         │
│  │                        │ │                        │         │
│  │ 🟡 IN PROGRESS   P1    │ │ 🟡 IN PROGRESS   P1    │         │
│  │                        │ │                        │         │
│  │ A high-performance     │ │ AI voice assistant     │         │
│  │ anime database engine  │ │ with natural language  │         │
│  │                        │ │ processing             │         │
│  │ ████████████░░░░ 78%   │ │ ██████░░░░░░░░ 45%     │         │
│  │                        │ │                        │         │
│  │ Updated: 3 hrs ago     │ │ Updated: 2 days ago    │         │
│  └────────────────────────┘ └────────────────────────┘         │
│  ┌────────────────────────┐ ┌────────────────────────┐         │
│  │ 📁 E-commerce Site      │ │ 📁 Portfolio Website    │         │
│  │                        │ │                        │         │
│  │ 🔵 IN PROGRESS   P2    │ │ ✅ COMPLETED           │         │
│  │                        │ │                        │         │
│  │ Full-stack shop with   │ │ Personal portfolio     │         │
│  │ Next.js + payment      │ │ with projects showcase │         │
│  │                        │ │                        │         │
│  │ ███░░░░░░░░░░░░ 20%    │ │ ████████████████ 100%  │         │
│  │                        │ │                        │         │
│  │ Updated: 1 week ago    │ │ Completed: May 2026    │         │
│  └────────────────────────┘ └────────────────────────┘         │
│                                                                 │
│  ── BOARD VIEW (Kanban — toggled) ─────────────────────────── │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 📋 PLAN  │ │ 🔵 ACTIVE│ │ ⏸ PAUSED │ │ ✅ DONE  │          │
│  │          │ │          │ │          │ │          │          │
│  │ ShareX   │ │ shinDB   │ │          │ │ Portfol- │          │
│  │ Mobile   │ │          │ │          │ │ io Site  │          │
│  │          │ │ VOX      │ │          │ │          │          │
│  │          │ │ Agent    │ │          │ │ Student  │          │
│  │          │ │          │ │          │ │ Dash     │          │
│  │          │ │ E-comm   │ │          │ │          │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Project Detail Page (on click)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Back to Projects                                            │
│                                                                 │
│  📁 shinDB                                                      │
│  🟡 IN PROGRESS  ·  P1  ·  Started: Jan 2026                   │
│                                                                 │
│  Progress: ████████████░░░░░░░░ 78%                             │
│                                                                 │
│  ── TABS ──                                                     │
│  [ Overview ] [ PRD ] [ Documentation ] [ Errors ]              │
│                                                                 │
│  ── OVERVIEW ──────────────────────────────────────────────── │
│  Description: High-performance anime/media database...          │
│  Tech Stack: Rust, SQLite, React                                │
│  GitHub: github.com/tamim/shindb                                │
│                                                                 │
│  ── PRD (Product Requirements Doc) ────────────────────────── │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Rich text editor / markdown viewer                        │ │
│  │  with the PRD content                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ── ERRORS LOG ────────────────────────────────────────────── │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🔴 Jun 25  SQLite lock contention under concurrent writes │ │
│  │    Resolution: Implemented WAL mode                        │ │
│  │ 🟡 Jun 20  API rate limiting not working for burst...     │ │
│  │    Status: Investigating                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4️⃣ FINANCE TRACKING

> Data source: Cashew CSV. Currency: BDT (৳)

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  💰 Finance                    📅 June 2026 ◀ ▶  [Import CSV]  │
│                                                                 │
│  ── ACCOUNT BALANCES ──────────────────────────────────────── │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  💵 CASH │ │  📱BKASH │ │  🏦 SAVE │ │  🏛 NET WORTH    │  │
│  │          │ │          │ │          │ │                  │  │
│  │ ৳ 5,200 │ │ ৳ 3,034 │ │ ৳16,380 │ │  ৳ 24,614       │  │
│  │  ▼ 12%  │ │  ▲ 5%   │ │  ▲ 2%   │ │   ▲ 3.2%        │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│                                                                 │
│  ── MONTHLY SUMMARY ───────────────────────────────────────── │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                             ││
│  │  Total Income      ৳ 18,000    ███████████████ ▲            ││
│  │  Total Expense     ৳ 12,420    ██████████░░░░ ▼             ││
│  │  ──────────────────────────────────────────────             ││
│  │  Savings Delta     ৳ +5,580    🟢 Positive                  ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ── INCOME BREAKDOWN ────────────── ── EXPENSE BY CATEGORY ── │
│  ┌────────────────────────────┐    ┌────────────────────────┐  │
│  │                            │    │                        │  │
│  │  👩 Mother    ৳10,000  56% │    │  ┌─ Core ──────────┐  │  │
│  │  👨 Father    ৳ 8,000  44% │    │  │ Rent    ৳4,500  │  │  │
│  │  👧 APU       ৳     0   0% │    │  │ Chef    ৳1,200  │  │  │
│  │  👩 Fahima    ৳     0   0% │    │  │ Electric ৳ 650  │  │  │
│  │  🏦 Savings   ৳     0   0% │    │  │ Water    ৳ 150  │  │  │
│  │  📦 Misc      ৳     0   0% │    │  └─────────────────┘  │  │
│  │                            │    │  ┌─ Groceries ─────┐  │  │
│  │  ┌──────────────────────┐  │    │  │ Food    ৳2,100  │  │  │
│  │  │ Donut chart showing  │  │    │  │ Snacks  ৳  890  │  │  │
│  │  │ income split by      │  │    │  │ Chef    ৳  400  │  │  │
│  │  │ source               │  │    │  └─────────────────┘  │  │
│  │  └──────────────────────┘  │    │  ┌─ Travel ────────┐  │  │
│  │                            │    │  │ In Dhaka ৳ 940  │  │  │
│  └────────────────────────────┘    │  │ Out Dhaka ৳ 700 │  │  │
│                                    │  └─────────────────┘  │  │
│                                    │  ┌─ Education ─────┐  │  │
│                                    │  │ BUET     ৳6,750 │  │  │
│                                    │  │ Statio.  ৳  150 │  │  │
│                                    │  └─────────────────┘  │  │
│                                    │  Shopping   ৳  350   │  │
│                                    │  ┌─ Other ─────────┐  │  │
│                                    │  │ Recharge ৳  180 │  │  │
│                                    │  │ Misc     ৳  100 │  │  │
│                                    │  └─────────────────┘  │  │
│                                    └────────────────────────┘  │
│                                                                 │
│  ── PER-ACCOUNT SPENDING ──────────────────────────────────── │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  CASH       ████████████████████████░░░░░  ৳9,206  (74%)   ││
│  │  BKASH      █████░░░░░░░░░░░░░░░░░░░░░░░  ৳2,214  (18%)   ││
│  │  SAVINGS    ███░░░░░░░░░░░░░░░░░░░░░░░░░  ৳1,000   (8%)   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ── RECENT TRANSACTIONS ──────────── 🔍 Filter [Category ▼]  ─│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ DATE        │ ACCOUNT │ CATEGORY        │ AMOUNT   │ NOTE  ││
│  │─────────────│─────────│─────────────────│──────────│───────││
│  │ Jun 20 9:17 │ CASH    │ Groceries/Snack │ -৳ 160   │       ││
│  │ Jun 20 9:17 │ CASH    │ Travel/In Dhaka │ -৳ 100   │       ││
│  │ Jun 20 9:16 │ CASH    │ Travel/In Dhaka │ -৳  80   │       ││
│  │ Jun 19 9:14 │ CASH    │ Groceries/Food  │ -৳ 480   │ 📝    ││
│  │             │         │                 │          │Egg-18 ││
│  │ Jun 19 9:14 │ CASH    │ Groceries/Chef  │ -৳ 200   │       ││
│  │ Jun 18 19:39│ CASH    │ 🔒 Bal. Correct │  hidden  │       ││
│  │ Jun 18 19:39│ CASH    │ Income/Mother   │ +৳10,000 │       ││
│  │ Jun 18 19:38│ BKASH   │ Income/Father   │ +৳ 8,000 │       ││
│  │ Jun 18 19:36│ CASH    │ Education       │ -৳ 6,750 │BUET  ││
│  │ Jun 18 19:36│ CASH    │ Travel/In Dhaka │ -৳   800 │Metro ││
│  │ ...         │         │                 │          │       ││
│  │ ──── showing 20 of 142 ──── [Load more]            │       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  > [!NOTE]                                                      │
│  > Balance Correction rows (internal transfers) are hidden      │
│  > by default. Toggle "Show transfers" to reveal them.          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Finance Visual Details
- **Account cards**: Each has a distinct subtle color accent (Cash = green, bKash = pink, Savings = amber)
- **Income amounts**: Always shown in `accent-green` (#34D399)
- **Expense amounts**: Always shown in `accent-red` (#FF4D6A)
- **Balance Correction**: Shown with 🔒 icon, greyed out, hidden by default
- **Transaction notes**: Expandable on click, shows the note field from Cashew CSV
- **Category bars**: Horizontal stacked bar chart with category colors
- **Month navigation**: `◀ ▶` arrows to switch months, data recalculates

---

## 5️⃣ MEDIA CONSUMPTION

> Broader media analytics — watch time trends, reading stats, gaming hours.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  📺 Media Consumption Analytics       📅 This Month / All Time │
│                                                                 │
│  ── TIME SPENT OVERVIEW ───────────────────────────────────── │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 🎬 47h   │ │ 📺 23h   │ │ 🎮 18h   │ │ 📖 12h   │          │
│  │ Anime    │ │ Series   │ │ Gaming   │ │ Manga    │          │
│  │ +5h ▲   │ │ -2h ▼   │ │ +8h ▲   │ │ +1h ▲   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ── WEEKLY ACTIVITY HEATMAP ───────────────────────────────── │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │     Mon  Tue  Wed  Thu  Fri  Sat  Sun                      ││
│  │  W1  ░░   ██   ░░   ██   ██   ██   ██                     ││
│  │  W2  ░░   ██   ██   ░░   ██   ██   ██                     ││
│  │  W3  ██   ░░   ██   ██   ░░   ██   ██                     ││
│  │  W4  ░░   ░░   ██   ██   ██   ██   ██                     ││
│  │                                                             ││
│  │  ░░ = 0-1hr  ▓▓ = 1-3hr  ██ = 3hr+                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ── CURRENTLY CONSUMING (featured) ────────────────────────── │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ┌────┐ Solo Leveling S2  ·  Ep 8/12  ·  ⭐ 8.5           │ │
│  │  │IMG │ ████████░░░░ 67%    Last watched: Today            │ │
│  │  └────┘                                                    │ │
│  │  ┌────┐ Breaking Bad S4   ·  Ep 3/13  ·  ⭐ 9.2           │ │
│  │  │IMG │ ██░░░░░░░░░░ 23%    Last watched: Yesterday       │ │
│  │  └────┘                                                    │ │
│  │  ┌────┐ Elden Ring        ·  45hrs    ·  ⭐ 9.0           │ │
│  │  │IMG │ No completion %     Last played: 2 days ago        │ │
│  │  └────┘                                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ── CONSUMPTION HISTORY CHART ─────────────────────────────── │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Hours/week                                                 ││
│  │   20 ┤                              ╭──╮                    ││
│  │   15 ┤              ╭──╮    ╭──╮    │  │  ╭──╮             ││
│  │   10 ┤     ╭──╮     │  │    │  │    │  │  │  │             ││
│  │    5 ┤     │  │     │  │    │  │    │  │  │  │             ││
│  │    0 ┼─────┴──┴─────┴──┴────┴──┴────┴──┴──┴──┴──           ││
│  │       W1    W2    W3    W4    W5    W6                       ││
│  │                                                             ││
│  │   ── Anime   ── Series   ── Gaming   ── Manga              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎭 Micro-Animations & Interactions

| Element | Animation | Duration |
|---------|-----------|----------|
| Page transition | Fade-in + slide-up (20px) | 300ms ease-out |
| Card hover | Lift (translateY -2px) + border glow | 200ms |
| Sidebar nav item | Background slide-in from left | 150ms |
| Stat numbers | Count-up animation on load | 800ms |
| Progress bars | Width animation from 0% → value | 600ms ease-out |
| Tab switch | Content fade + slide | 200ms |
| Modal open | Scale from 0.95 → 1.0 + fade | 250ms |
| Activity feed items | Staggered fade-in (50ms delay each) | 300ms |
| Quick action buttons | Pill fill animation on hover | 200ms |
| Chart bars | Grow from bottom | 500ms staggered |

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout Changes |
|------------|---------------|
| `> 1440px` | Full sidebar + 3-column content grid |
| `1024-1440px` | Full sidebar + 2-column content grid |
| `768-1024px` | Collapsed sidebar (icons only) + 2-column grid |
| `< 768px` | Hidden sidebar (hamburger menu) + single column |

---

## 🗂 File / Component Structure (Proposed)

```
plan-for-life-os/
├── index.html
├── index.css                  # Design system + global styles
├── app.js                     # Main app logic, routing, state
├── components/
│   ├── sidebar.js             # Navigation sidebar
│   ├── topbar.js              # Search, date, profile
│   ├── dashboard/
│   │   ├── hero-banner.js
│   │   ├── stat-cards.js
│   │   ├── section-spotlights.js
│   │   ├── quick-actions.js
│   │   └── activity-feed.js
│   ├── academic/
│   │   ├── tracker.js         # Exams, Classes, Assignments
│   │   ├── materials.js       # Lecture, Books, Notes grid
│   │   ├── personal-notes.js  # Scan upload + Obsidian link
│   │   └── codes.js           # GitHub integration
│   ├── entertainment/
│   │   ├── media-grid.js      # Card grid with filters
│   │   ├── media-detail.js    # Modal detail view
│   │   └── stats-bar.js       # Stats overview
│   ├── projects/
│   │   ├── project-gallery.js # Gallery / Board / Table views
│   │   └── project-detail.js  # Detail page with tabs
│   ├── finance/
│   │   ├── accounts.js        # Balance cards
│   │   ├── monthly-summary.js # Income vs Expense
│   │   ├── category-breakdown.js
│   │   ├── transactions.js    # Filterable feed
│   │   └── csv-parser.js      # Cashew CSV import logic
│   └── media/
│       ├── consumption-stats.js
│       ├── heatmap.js
│       └── history-chart.js
├── data/
│   └── cashew-*.csv           # Exported finance data
└── assets/
    └── fonts/
```

---

## 🔑 Key Design Decisions

> [!IMPORTANT]
> ### shinDB Integration
> Entertainment section relies on external shinDB connection. The UI should gracefully handle disconnected state with a "Connect to shinDB" prompt and placeholder cards.

> [!NOTE]
> ### Balance Correction Handling
> Cashew CSV contains `Balance Correction` category entries which are internal transfers between accounts (e.g., BKASH → CASH). These must be:
> - **Hidden** from income/expense totals
> - **Hidden** from category breakdowns
> - **Toggleable** in the transactions feed via a "Show transfers" switch
> - Visually distinguished with a 🔒 icon and muted styling when visible

> [!TIP]
> ### CSV Data Shape (from Cashew)
> Columns: `account, amount, amount unpaid, currency, title, note, date, income, type, category name, subcategory name, color, icon, emoji, budget, objective, extra`
> - `income: true/false` determines if it's income or expense
> - `category name` + `subcategory name` form the full category path
> - `note` field contains multi-line transaction details
> - `account` is one of: CASH, BKASH, SAVINGS

> [!WARNING]
> ### Data Privacy
> Finance data contains personal transaction details. All data processing should happen client-side only. No external API calls for finance features.

---

## 🎯 Priority for Implementation

| Phase | Sections | Effort |
|-------|----------|--------|
| **Phase 1** | Dashboard + Finance (CSV parser) | High — Core experience |
| **Phase 2** | Academic (Tracker + Materials) | Medium — Data entry heavy |
| **Phase 3** | Projects (Gallery + Detail) | Medium — Straightforward |
| **Phase 4** | Entertainment (shinDB integration) | High — External dependency |
| **Phase 5** | Media Consumption (Analytics) | Low — Derived from Entertainment |
