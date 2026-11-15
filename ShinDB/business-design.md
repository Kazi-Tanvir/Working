# SHIN ECOSYSTEM — UNIVERSAL BUSINESS DESIGN SYSTEM
> **Document Specification**: `business-design.md`  
> **Brand Identity**: **SHIN (真)** — Tactical Cyber-Neobrutalist & Obsidian Console Design System  
> **Applicability**: Foundation design framework for the entire series of web applications and digital interfaces across the business.

---

## 1. Universal AI Art & Media Recreation Prompt

Use this prompt framework to faithfully recreate the visual identity, brand atmosphere, textures, lighting, and aesthetic philosophy across any generative AI tool (Midjourney, Stable Diffusion XL, DALL-E 3, Flux), 3D rendering engine (Octane, Blender, Unreal Engine 5), or digital illustration workflow.

```text
MASTER THEME PROMPT:
Cyber-neobrutalist tactical console aesthetic, obsidian black and onyx dark-mode interface, high-contrast Japanese cyberpunk minimalism. Central visual emblem featuring the Japanese Kanji character "真" (Shin) forged in brushed titanium and platinum with sharp ink-carved calligraphy edges, subtle warm golden-amber rim lighting, enclosed by a thin geometric crosshair reticle and orbital targeting ring. Ultra-sharp 90-degree architectural angles, zero rounded corners, crisp 2-pixel stark white dividing lines, hard unblurred isometric drop shadows (4px offset). Accent neon highlights in vivid electric ultraviolet purple (#8b5cf6), tactical cyan (#00f0ff), radioactive lime green (#00ff66), warning amber (#ffee00), and crimson red (#ff003c). Micro-textures of subtle CRT scanlines, fine matte fractal film grain, tactile physical keycaps, and terminal command telemetry in monospace typography. Clean composition, brutalist layout, cinematic ambient contrast, 8k resolution, immaculate industrial craftsmanship.
```

### Media-Specific Formulations

Depending on your production medium, append or adjust with these specialized directive blocks:

* **For 3D Product & Environmental Renders (Octane / Blender / Cinema4D / UE5):**
  > `Hard-surface 3D render, raytraced obsidian matte black polycarbonate slab, sharp 90-degree chamferless edges, brushed platinum kanji plate with subtle gold bevel sheen, recessed LED light channels, unblurred hard shadow casting on dark ground plane, volumetric darkroom lighting, ultra-clean industrial product design, 85mm architectural lens, Octane render, photorealistic.`

* **For Web UI / Concept Art / Screen Mockups (Midjourney / DALL-E / Figma AI):**
  > `High-contrast dark-mode web console interface, cyber-neobrutalism, obsidian black background (#000000), stark white 2px structural grid lines, hard offset 4px drop shadows, sharp rectangular cards, neon violet and electric cyan accent badges, monospace technical telemetry, bracketed tags, clean modular grid layout, zero border radius, professional UI/UX dashboard presentation.`

* **For Vector Branding, Merch, Print & Apparel:**
  > `Minimalist tactical vector graphic, screen-print ready, monochrome black and white with vivid neon violet and cyber cyan duotone accents, sharp Kanji '真' calligraphy intersected with precision targeting reticles, bold geometric framing, technical drafting lines, cyberpunk street fashion aesthetic, high contrast SVG style.`

### Negative Directives & Aesthetic Restrictions (What to Avoid)
> **Avoid**: Soft diffuse shadows, blurred drop shadows, pastel color palettes, friendly bubbly shapes, pill-rounded corners (`rounded-full` / `rounded-xl`), skeuomorphic glossy gradients, cluttered messy grunge, photorealistic human faces, chaotic noise, corporate blue flat design, washed-out low contrast grays.

---

## 2. Core Aesthetic Philosophy & Brand Tenets

The brand aesthetic is built at the intersection of **Cyber-Neobrutalism** and the **Obsidian Command Console**. It represents uncompromising precision, operator sovereignty, high density, and tactile physicality.

```
+-------------------------------------------------------------------------------+
|  SHIN [真] BRAND PILLARS                                                      |
+------------------------------------+------------------------------------------+
|  1. RIGID GEOMETRIC PURITY         | Zero border-radius (0px). Absolute 90°  |
|                                    | architectural corners. Every container  |
|                                    | is an engineered slab.                  |
+------------------------------------+------------------------------------------+
|  2. TACTILE MECHANICAL PHYSICS     | Hard unblurred offset shadows. Hover     |
|                                    | elevates upward-left (-2px); click press |
|                                    | collapses downward-right (+2px) to 0px.  |
+------------------------------------+------------------------------------------+
|  3. HIGH-CONTRAST DATA SUPREMACY   | Deep space black canvas, stark white 2px |
|                                    | frames, puncturing electric neon signals |
|                                    | for telemetry and status alerts.         |
+------------------------------------+------------------------------------------+
|  4. OPERATOR DIGNITY & TELEMETRY   | Monospaced technical typography for tags,|
|                                    | bracketed notation [SYS::OK], terminal   |
|                                    | slash prompts (>_), zero corporate fluff.|
+------------------------------------+------------------------------------------+
|  5. ATMOSPHERIC RESTRAINT          | Dark matte surfaces with faint CRT       |
|                                    | scanlines and 3% micro-noise grain.      |
|                                    | Glowing accents are earned, not flooded. |
+------------------------------------+------------------------------------------+
```

---

## 3. Master Color Palette & Token System

The color system relies on an ink-black void, razor-sharp white structural scaffolding, and high-saturation neon energy bands.

### 3.1 Structural Canvas & Surface Tokens

| Token Name | Hex Code | HSL / RGB | Visual Role & Application |
|:---|:---|:---|:---|
| `--color-canvas-black` | `#000000` | `rgb(0, 0, 0)` | Deep page canvas, primary background void, body backdrop. |
| `--color-surface-obsidian` | `#0a0a0f` | `rgb(10, 10, 15)` | Primary container cards, hero bounding boxes, panels. |
| `--color-surface-card` | `#0d0d0f` | `rgb(13, 13, 15)` | Interactive media cards, list items, nested module slabs. |
| `--color-surface-elevated` | `#141419` | `rgb(20, 20, 25)` | Elevated flyouts, dropdowns, table headers, hovered cells. |
| `--color-surface-border` | `#ffffff` | `rgb(255, 255, 255)` | Primary crisp 2px border framing, high-contrast outlines. |
| `--color-border-subtle` | `rgba(255,255,255,0.15)` | `rgba(255, 255, 255, 0.15)` | Grid dividing lines, inactive separators, subtle rules. |

### 3.2 Typography Neutrals

| Token Name | Hex Code | Visual Hierarchy |
|:---|:---|:---|
| `--color-text-signal` | `#ffffff` | Primary headings, active values, button labels, high-visibility text. |
| `--color-text-body` | `#e4e4e7` | Body paragraphs, standard text, readable descriptions. |
| `--color-text-muted` | `#a1a1aa` | Metadata labels, timestamps, secondary instructions, subtitles. |
| `--color-text-ghost` | `#71717a` | Inactive placeholders, bracket delimiters, background telemetry. |

### 3.3 Tactical Neon Accents (Semantic Spectrum)

Each accent carries a distinct operational purpose across all websites in the series:

```
[ PURPLE ]  #8b5cf6  -->  PRIMARY BRAND / SOVEREIGN ACTIONS / CORE ENGINE
[ CYAN ]    #00f0ff  -->  ACTIVE STREAMS / EXTERNAL LINKS / VERIFIED COMPLETION
[ GREEN ]   #00ff66  -->  LIVE OPERATION / ACTIVE SESSIONS / RUNTIME HEALTH
[ YELLOW ]  #ffee00  -->  TELEMETRY / RATINGS / CAUTIONARY HIGHLIGHTS / WATCHLIST
[ ORANGE ]  #ff6b00  -->  METADATA / CANONICAL ATTRIBUTES / SECONDARY ENTITIES
[ RED ]     #ff003c  -->  HAZARD / CRITICAL ERRORS / DROP ACTIONS / EMERGENCY PURGE
```

* **Cyber Purple (`#8b5cf6` / Active: `#7c3aed`)**: The sovereign brand color. Used for primary call-to-actions, hero badges, selection highlights (`::selection`), active tabs, and primary system status.
* **Cyber Cyan (`#00f0ff` / Deep: `#06b6d4`)**: Cold informational clarity. Used for live search triggers, verified badges, external gateways, completed marks, and interactive link hovers.
* **Cyber Green / Lime (`#00ff66` / Deep: `#10b981`)**: Runtime pulse and vitality. Used for online dots, live consuming states, affirmative feedback toasts, ping animations, and progress metrics.
* **Cyber Yellow / Gold (`#ffee00` / Deep: `#eab308`)**: Telemetry precision and prestige. Used for star ratings, scores, high-priority backlog indicators, and accent highlights.
* **Cyber Orange (`#ff6b00` / Deep: `#f97316`)**: Warm structural distinction. Used for creative metadata tags, secondary category borders, author tags, and warnings.
* **Cyber Red / Crimson (`#ff003c` / Deep: `#ef4444`)**: Absolute stop and termination. Used for destructive buttons, dropped entries, error toasts, network disconnect banners, and quota limiters.

---

## 4. Typography Architecture & Text Formatting

The system uses a strict dual-font hierarchy: **JetBrains Mono** for technical telemetry, system markers, and operational controls; and **Space Grotesk** for structured headers and readable long-form prose.

### 4.1 Font Pairing Standards

```
+---------------------+---------------------------------------------------------+
| DISPLAY & BODY      | Space Grotesk (Weights: 400, 500, 600, 700)             |
| Fallbacks           | 'Space Grotesk', -apple-system, BlinkMacSystemFont,     |
|                     | Arial, sans-serif                                       |
+---------------------+---------------------------------------------------------+
| MONOSPACE & CONTROL | JetBrains Mono (Weights: 400, 500, 700)                 |
| Fallbacks           | 'JetBrains Mono', 'Fira Code', 'Courier New', monospace |
+---------------------+---------------------------------------------------------+
```

### 4.2 Typographic Hierarchy Scale

| Level | Font Family | Size / Line-Height | Weight | Letter Spacing | Transform |
|:---|:---|:---|:---|:---|:---|
| **Display Hero** | Space Grotesk | `48px - 64px` / `1.0` | 900 (Black) | `-0.03em` | UPPERCASE |
| **Section H1** | Space Grotesk | `32px - 40px` / `1.1` | 800 (ExtraBold) | `-0.02em` | UPPERCASE |
| **Card Header H2** | Space Grotesk | `20px - 24px` / `1.2` | 700 (Bold) | `-0.01em` | Normal / Semi-Caps |
| **Subheader H3** | JetBrains Mono | `14px - 16px` / `1.3` | 700 (Bold) | `+0.05em` | UPPERCASE |
| **System Labels** | JetBrains Mono | `11px - 12px` / `1.2` | 700 (Bold) | `+0.12em` | UPPERCASE |
| **Micro Telemetry** | JetBrains Mono | `9px - 10px` / `1.0` | 800 (ExtraBold)| `+0.18em` | UPPERCASE |
| **Body Standard** | Space Grotesk | `14px - 16px` / `1.5` | 400 - 500 | `normal` | Sentence case |
| **Body Compact** | Space Grotesk | `12px - 13px` / `1.4` | 400 | `normal` | Sentence case |

### 4.3 Syntactical Brand Conventions (The "Operator" Voice)

Every site in the series communicates like a secure high-grade command terminal:
* **Bracket Enclosure**: Wrap operational roles, metadata units, and statuses in square brackets: `[SYS_OPERATOR]`, `[RECORD_SEALED]`, `[STAGE_01]`.
* **Double Slash Separators**: Use `//` with spaces for compound headers or path navigation: `SHIN // CENTRAL_CONSOLE`, `STATUS: ONLINE // VERIFIED`.
* **Terminal Command Prompts**: Prefix live metrics, query inputs, or execution logs with `>_`: `>_ SEARCH QUERY:`, `>_ 1,420 RECORDS INDEXED`.
* **Monospace Units**: Numbers should always carry explicitly uppercase monospace units: `12/24 EP`, `48 HRS`, `9.4/10 SCORE`, `256 MB`.

---

## 5. Elevation, Hard Shadows & Tactile Physics

In traditional flat design, shadows are blurred and fuzzy. In the Shin design system, **shadows are crisp, unblurred physical projections (Neobrutalist hard offsets)** that provide tactile depth and communicate mechanical clickability.

```
RESTING STATE                    HOVER STATE                     ACTIVE (CLICKED)
+---------------+                +---------------+               +---------------+
|   COMPONENT   |                |   COMPONENT   |               |   COMPONENT   |
|   SURFACE     |                |   SURFACE     |               |   SURFACE     |
+---------------+--+             +---------------+----+          +---------------+
 \   SOLID SHADOW  |              \   EXPANDED SHADOW |           (Zero Shadow -
  \  offset: 3x3   |               \  offset: 5x5     |            translated down)
   +---------------+                +-----------------+
```

### 5.1 Hard Shadow Offset Tokens

```css
/* Neobrutalist Hard Shadow Tokens (Zero Blur) */
--neo-shadow-sm:     2px 2px 0px 0px #ffffff;
--neo-shadow-base:   3px 3px 0px 0px #ffffff;
--neo-shadow-md:     4px 4px 0px 0px #ffffff;
--neo-shadow-lg:     6px 6px 0px 0px #ffffff;
--neo-shadow-hero:   8px 8px 0px 0px #ffffff;

/* Color-coded Hard Shadows */
--neo-shadow-purple: 4px 4px 0px 0px var(--color-cyber-purple);
--neo-shadow-cyan:   4px 4px 0px 0px var(--color-cyber-cyan);
--neo-shadow-green:  4px 4px 0px 0px var(--color-cyber-green);
--neo-shadow-yellow: 4px 4px 0px 0px var(--color-cyber-yellow);
--neo-shadow-orange: 4px 4px 0px 0px var(--color-cyber-orange);
--neo-shadow-black:  4px 4px 0px 0px #000000;
```

### 5.2 Mechanical Interaction Physics

Interactive elements simulate physical tactile keycaps:
1. **Resting State**: Base border `2px solid #ffffff`, hard shadow `3px 3px 0px 0px #ffffff`, `translate(0, 0)`.
2. **Hover State**: Elevates upward and leftward by `2px` (`translate(-2px, -2px)`), expanding the hard shadow to `5px 5px 0px 0px #ffffff`. Transition: `0.1s ease-out`.
3. **Active / Pressed State**: Depresses downward and rightward by `2px` (`translate(2px, 2px)`), collapsing the hard shadow completely to `0px 0px 0px 0px`. Transition: `0.05s ease-in`.

---

## 6. Universal Component Design Specifications

These modular component patterns apply universally across **any** feature, tool, or website in the series.

---

### 6.1 Buttons & Interactive Controls

Buttons must feel like heavy mechanical keys on an industrial switchboard.

```
+-----------------------------------------------------------+
| [!] PRIMARY BUTTON                                        |
| Font: JetBrains Mono, Bold, Uppercase, Tracking-Wider     |
| Border: 2px solid #ffffff                                 |
| Background: #8b5cf6 (Cyber Purple)                        |
| Color: #ffffff                                            |
| Shadow: 3px 3px 0px 0px #ffffff                           |
| Hover: -translate-x-0.5 -translate-y-0.5 shadow 5px 5px   |
| Active: +translate-x-0.5 +translate-y-0.5 shadow 0px 0px  |
+-----------------------------------------------------------+
```

#### Button Variant Matrix

1. **Primary Action (`variant="primary"`)**:
   - Background: `var(--color-cyber-purple)` (`#8b5cf6`)
   - Text: `#ffffff` | Border: `2px solid #ffffff`
   - Shadow: `3px 3px 0px 0px #ffffff`
   - Role: Main conversion actions (Submit, Save, Create, Connect).

2. **Cyan Electric (`variant="cyan"`)**:
   - Background: `var(--color-cyber-cyan)` (`#00f0ff`)
   - Text: `#000000` | Border: `2px solid #000000`
   - Shadow: `3px 3px 0px 0px #000000`
   - Role: Exploration triggers, search confirmations, external exports.

3. **Green Runtime (`variant="green"`)**:
   - Background: `var(--color-cyber-green)` (`#00ff66`)
   - Text: `#000000` | Border: `2px solid #000000`
   - Shadow: `3px 3px 0px 0px #000000`
   - Role: Active tracking, starting workflows, positive confirmations.

4. **Red Warning / Destructive (`variant="red"`)**:
   - Background: `var(--color-cyber-red)` (`#ff003c`)
   - Text: `#ffffff` | Border: `2px solid #ffffff`
   - Shadow: `3px 3px 0px 0px #ffffff`
   - Role: Disconnect, delete, purge, drop entry, reset state.

5. **Ghost / Outline (`variant="outline"`)**:
   - Background: `transparent`
   - Text: `#ffffff` | Border: `2px solid #ffffff`
   - Shadow: `3px 3px 0px 0px rgba(255, 255, 255, 0.2)`
   - Hover Shadow: `5px 5px 0px 0px #ffffff`
   - Role: Secondary options, cancellation, filter toggles, navigation tabs.

---

### 6.2 Universal Card Architecture

Cards represent isolated data capsules or media units. They adapt to multiple aspect ratios while maintaining identical structural framing.

```
+---------------------------------------------------------------+
|  CARD TOP CONTAINER                                          |
|  - Aspect Ratio: aspect-[2/3] (Portraits/Media/Profiles)      |
|                  aspect-video (Dashboards/Games/Screenshots)  |
|                  aspect-square (Tools/Avatars/Tokens)         |
|  - Border: 1px solid rgba(255, 255, 255, 0.15)                |
|  - Corner: 0px (Square)                                       |
|  - Overflow: Hidden                                           |
|  - Bottom Status Stripe: 2px solid [ACCENT_COLOR]             |
+---------------------------------------------------------------+
|  HOVER OVERLAY (Appears on hover with backdrop-blur-sm)       |
|  - Background: rgba(0, 0, 0, 0.90)                            |
|  - Header: Badge (Left) + Star/Metric Pill (Right)            |
|  - Body: 1-2 Technical Tags in JetBrains Mono                 |
|  - Footer: Micro-action buttons with tactile click            |
+---------------------------------------------------------------+
|  EXTERNAL LABELS (Outside the card frame)                     |
|  - Primary Title: Space Grotesk, Bold, Truncated              |
|  - Metadata Subline: JetBrains Mono, 10px, Muted Gray         |
+---------------------------------------------------------------+
```

#### Card Hover Interaction Mechanics
* **Subtle Zoom**: Underlying artwork or preview scales to `1.05` (`transform: scale(1.05)`) over `300ms cubic-bezier(0.16, 1, 0.3, 1)`.
* **Console Overlay Reveal**: An obsidian blackout scrim (`bg-black/90 backdrop-blur-[2px]`) fades from `opacity-0` to `opacity-100`.
* **Accent Hover Glow**: The card boundary projects a themed color halo:
  - Green state: `box-shadow: 0 0 15px rgba(0, 255, 102, 0.35)`
  - Cyan state: `box-shadow: 0 0 15px rgba(0, 240, 255, 0.35)`
  - Purple state: `box-shadow: 0 0 15px rgba(139, 92, 246, 0.35)`

---

### 6.3 Search Bars, Inputs & Form Fields

Input elements mirror tactical terminal input lines.

```
+-------------------------------------------------------------------------+
| [>_]  SEARCH DATABASE OR INPUT COMMAND...             [ESC TO CLEAR] [k]|
+-------------------------------------------------------------------------+
| - Background: #000000 (Pure Black)                                      |
| - Border: 2px solid rgba(255, 255, 255, 0.4)                           |
| - Text: JetBrains Mono, White, 14px                                     |
| - Focus State: Border #8b5cf6 (Cyber Purple) + 2px Outline Offset       |
| - Hard Shadow: 3px 3px 0px 0px #ffffff (on active/focused container)   |
| - Prefix Icon: Lucide Search or Terminal Cursor (>_)                    |
| - Shortcut Tag: Inset 10px Mono Badge ([CMD+K] or [/])                 |
+-------------------------------------------------------------------------+
```

#### Form Controls Rules:
* **Checkboxes & Radios**: Crisp square boxes (`w-4 h-4 rounded-none`), 2px solid white border, checked state fills solid Cyber Purple or Cyber Green with an unblurred checkmark.
* **Select Dropdowns**: Pure black background, 2px white border, monospace options, hard drop shadow on options container, no native browser styling.
* **Sliders & Range Trackers**: 4px rectangular track, solid neon fill progress, square handle knob with 2px border and hard shadow.

---

### 6.4 Badges, Tags & Telemetry Pills

Badges communicate status, category, or role with high data-density and low visual footprint.

```
+-----------------------------------------------------------+
|  [● WATCHING]   [v2.4.0]   [ANILIST_API]   [CRITICAL]     |
|  - Font: JetBrains Mono, ExtraBold, 9px - 11px            |
|  - Letter-Spacing: 0.12em (Wider tracking)                |
|  - Padding: px-2 py-0.5                                   |
|  - Border: 1px solid currentColor or #ffffff              |
|  - Radius: 0px (Strictly sharp edges)                     |
|  - Status Dot: 6px solid circular neon indicator          |
+-----------------------------------------------------------+
```

#### Semantic Badge Matrix
* **Active / In-Progress**: Cyan background (`bg-cyber-cyan text-black`) or subtle dark border with cyan dot (`●`).
* **Completed / Success**: Green background (`bg-cyber-green text-black`) or green dot indicator.
* **Planned / Pending**: Yellow background (`bg-cyber-yellow text-black`) with warning indicator.
* **Terminated / Dropped**: Red background (`bg-cyber-red text-white`) with alert glyph.
* **System / Role**: Purple background (`bg-cyber-purple text-white`) or white outline with purple text.

---

### 6.5 Navigation Bar & System Header

The site navigation header acts as the command telemetry bridge.

```
+-----------------------------------------------------------------------------------------------+
| [真] SHIN_SYSTEM  // CONSOLE      [DASH]  [TRACKER]  [DATABASE]  [NODES]    [● ONLINE] [@OPERATOR] |
+-----------------------------------------------------------------------------------------------+
```

* **Positioning**: Sticky top (`sticky top-0 z-40`), border-bottom `2px solid #ffffff`.
* **Scroll Dynamics**: When static at top of page, pure obsidian black (`#000000`). When scrolled past 20px, activates `backdrop-blur-md bg-black/85` with subtle frosted translucency.
* **Smart Auto-Hide**: Hides smoothly on scroll down (`translateY(-100%)`) and re-appears immediately on scroll up (`translateY(0)`).
* **Brand Cluster (Left)**: The "真" (Shin) logo mark with subtle golden rim lighting and glowing white drop shadow, accompanied by the system title in Space Grotesk Bold uppercase.
* **Link Items (Center)**: JetBrains Mono, uppercase, icon + label pair. Hover state highlights text in Cyber Cyan (`text-cyber-cyan`). Active page displays a solid bottom border or neon pill background.
* **Operator Cluster (Right)**: Online heartbeat beacon (pulsing green dot), network status indicator, and operator profile badge.

---

### 6.6 Modals, Drawers & Command Overlays

Modals are heavy floating monoliths centered over a dimmed scrim.

```
+-----------------------------------------------------------------------+
| [//] SYSTEM MODAL HEADER                              [ESC] [X CLOSE] |
+-----------------------------------------------------------------------+
|                                                                       |
|   MODAL CONTENT CONTAINER                                             |
|   - Background: #0d0d0f (Obsidian Core)                               |
|   - Border: 2px solid #ffffff                                         |
|   - Shadow: 8px 8px 0px 0px #ffffff (Extreme Hard Offset)             |
|   - Backdrop: rgba(0, 0, 0, 0.85) with backdrop-blur-sm              |
|   - Header: Monospace title with bracket notation                     |
|   - Close Trigger: Square button, 2px border, hover invert            |
|                                                                       |
+-----------------------------------------------------------------------+
| [ CANCEL ]                                          [ CONFIRM ACTION ]|
+-----------------------------------------------------------------------+
```

---

### 6.7 Data Metrics & Statistics Banners

Metrics should convey analytical power with oversized monospaced typography.

```
+---------------------------+---------------------------+---------------------------+
| TOTAL ARCHIVES            | RUNTIME INTEGRITY         | SYNCHRONIZED NODES        |
| 1,482                     | 99.98%                    | 18 / 18                   |
| [SYS_RECORDS_ACTIVE]      | [GATEWAY_LATENCY: 12ms]   | [ENCRYPTED_ISOLATION]     |
+---------------------------+---------------------------+---------------------------+
```
* **Stat Box Frame**: 1px subtle white border, 3px colored top border (Purple, Cyan, Green, or Yellow).
* **Primary Metric Number**: JetBrains Mono, font-size `28px - 44px`, font-weight `900`. Optional subtle opacity shimmer keyframe (`stat-shimmer`).
* **Sub-label**: 10px JetBrains Mono, muted gray (`#a1a1aa`), bracket notation.

---

## 7. Atmospheric Surfaces & Micro-Textures

To prevent dark mode from feeling flat or sterile, three tactile layers are subtly applied to surfaces:

### 7.1 CRT Scanline Overlay
A microscopic scanline effect that gives displays a hardware monitor feel:
```css
.scanline-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  z-index: 1;
}
```

### 7.2 Fractal Noise Grain (3% Matte Opacity)
A fine micro-noise SVG pattern that eliminates digital banding on solid black:
```css
.noise-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.03;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  z-index: 0;
}
```

### 7.3 Custom Monolithic Scrollbar
```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #000000;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 0px; /* Sharp rectangular scroll thumb */
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-cyber-purple);
}
```

---

## 8. Motion, Timing & Keyframe Physics

Animations in the Shin design system are fast, crisp, and mechanical. Never sluggish, bouncy, or floaty.

### 8.1 Timing & Easing Curves
* **Primary Interactive Curve**: `cubic-bezier(0.16, 1, 0.3, 1)` (Snappy deceleration with instant tactile response).
* **Click Physics**: `0.05s - 0.1s linear` (Direct key-down response).
* **Overlay Transition**: `0.2s - 0.25s ease-out`.

### 8.2 Standard Animation Tokens

```css
/* Card Fade-Up Entrance */
@keyframes cardFadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-card-in {
  animation: cardFadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Page Section Slide-In */
@keyframes sectionSlideIn {
  from {
    opacity: 0;
    transform: translateX(-16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-section-in {
  animation: sectionSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Status Beacon Pulse */
@keyframes beaconPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(0, 240, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(0, 240, 255, 0);
  }
}
.beacon-pulse {
  animation: beaconPulse 2s ease-in-out infinite;
}
```

---

## 9. Layout Grid & Spatial Cadence

### 9.1 Baseline Spacing Scale
All spatial increments are governed by an **8px base grid** (with 4px half-steps for micro-telemetry):
* `4px` (`gap-1`, `p-1`) — Micro spacing between badge icons and labels.
* `8px` (`gap-2`, `p-2`) — Inset padding for cards and compact toolbars.
* `16px` (`gap-4`, `p-4`) — Standard container padding and button gaps.
* `24px` (`gap-6`, `p-6`) — Module separation and grid gutter spacing.
* `32px` (`gap-8`, `p-8`) — Hero box padding and major section division.
* `48px - 64px` (`py-12` - `py-16`) — Macro page block cadence.

### 9.2 Responsive Container Standards
* **Max Width**: `max-w-7xl` (`1280px`) centered horizontally via `mx-auto`.
* **Mobile Padding**: `px-4` (`16px`).
* **Desktop Padding**: `px-8` (`32px`).
* **Grid Breakpoints**:
  - Compact Cards: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`
  - Feature Modules: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - Dual Telemetry Layouts: `grid-cols-1 lg:grid-cols-12` (8 cols content, 4 cols sidebar)

---

## 10. Multi-Website Series Consistency Checklist

Before deploying any new tool, dashboard, landing page, or utility in the Shin business series, cross-examine against this checklist:

- [ ] **Zero Border-Radius**: Are all corners strictly 90 degrees (`rounded-none` / `rounded-0`)?
- [ ] **Hard Unblurred Shadows**: Are all drop shadows zero-blur offsets (`box-shadow: 3px 3px 0px 0px #ffffff`) rather than blurred shadows?
- [ ] **Stark 2px Borders**: Do primary cards, inputs, and buttons feature deliberate 2px structural borders?
- [ ] **Tactile Click Downs**: Do interactive buttons translate `+2px` downward-right on `:active` with shadow collapse?
- [ ] **Dual Typography Pairing**: Are technical labels, bracketed metadata, and badges rendered in `JetBrains Mono` and prose/titles in `Space Grotesk`?
- [ ] **Operator Voice**: Do labels follow terminal syntax (`[SYS_NAME]`, `//`, `>_`) without generic placeholder language?
- [ ] **Pure Dark Canvas**: Is the page background pure black (`#000000`) with obsidian cards (`#0a0a0f` / `#0d0d0f`)?
- [ ] **Semantic Neon Accents**: Are purple, cyan, green, yellow, orange, and red accents used strictly according to their defined operational roles?
- [ ] **Atmospheric Texture**: Does the interface include subtle scanline or noise depth rather than flat, empty digital space?
- [ ] **The "真" Brand Hallmark**: Is the Kanji insignia or its crosshair geometry honored as the visual anchor of the interface?
