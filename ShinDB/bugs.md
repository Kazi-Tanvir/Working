# ShinDB Bug Registry & Quality Audit# ShinDB Bug Registry & Quality Audit

Consolidated manual QA bug report compiled from desktop and mobile browser testing sessions.

---

## Index of Issues

| ID | Title | Severity | Platform | Area |
| :--- | :--- | :--- | :--- | :--- |
| [BUG-01](#bug-01-stale-search-results-persist-when-clearing-input) | Stale search results persist when clearing input | Major | Desktop / All | Homepage (`/`) |
| [BUG-02](#bug-02-silent-failure-on-add-track-button-for-unauthenticated-users) | Silent `[ERROR]` failure on ADD TRACK for unauthenticated users | Major | Desktop / All | Homepage Discovery (`/`) |
| [BUG-03](#bug-03-video-game-ratings-labeled-as-imdb-instead-of-rawg) | Video game external ratings labeled as IMDb instead of RAWG | Major | All | Games Sector (`/games`) |
| [BUG-04](#bug-04-dashboard-top-metrics-flash-0-on-initial-authenticated-load) | Dashboard top metrics flash `0` on initial load | Minor | All | Dashboard (`/`) |
| [BUG-05](#bug-05-double-question-mark-in-episode-progress-display) | Double question mark formatting in episode progress | Minor | All | Detail Modal & Badges |
| [BUG-06](#bug-06-misleading-button-label-new-custom-entry) | Button labeled "NEW CUSTOM ENTRY" opens external search | Minor | All | Empty States (`/movies`, `/series`) |
| [BUG-07](#bug-07-clerk-uncaught-typeerror-during-login-mount) | Clerk uncaught TypeError during `/login` mount | Minor | Desktop | Auth (`/login`) |
| [M-BUG-01](#m-bug-01-float-precision-leak-in-rating-input) | IEEE 754 raw float precision leak in rating input | Major | Mobile | Detail Modal (`/movies`, `/anime`, `/games`) |
| [M-BUG-02](#m-bug-02-non-responsive-multi-column-admin-tables) | Multi-column desktop tables cause horizontal blowout on mobile | Major | Mobile | Admin Console (`/admin/users`, `/admin/media`) |
| [M-BUG-03](#m-bug-03-inactive-search--add-title-button-in-empty-states) | Empty state "SEARCH & ADD TITLE" button is inactive | Minor | Mobile | Empty States (`/movies`, `/series`) |
| [M-BUG-04](#m-bug-04-inconsistent-card-touch-targets-on-mobile) | Inconsistent touch target on media cards | Minor | Mobile | Catalog Cards (`/movies`, `/anime`, `/games`) |
| [M-BUG-05](#m-bug-05-missing-accessible-name-on-admin-drawer-toggle) | Missing accessible name on admin mobile drawer toggle | Minor | Mobile | Admin Header (`/admin/*`) |
| [UX-01](#ux-01-duplicate-word-in-admin-link) | Duplicate word in admin overview link ("CATALOG CATALOG") | Cosmetic | Desktop | Admin Overview (`/admin`) |
| [UX-02](#ux-02-flash-of-unauthenticated-header-before-hydration) | Flash of logged-out header before Clerk session hydrates | Cosmetic | All | Header (`/profile`, `/settings`, `/admin/*`) |
| [UX-03](#ux-03-missing-form-accessibility-attributes) | Missing `id`, `name`, and `autocomplete` attributes | Cosmetic | All | Forms (`/login`, `/settings`, `/admin/*`) |
| [M-UX-01](#m-ux-01-admin-audit-log-json-overflow) | Admin audit log JSON preview forces horizontal panning | Cosmetic | Mobile | Admin Audit Log (`/admin/audit-log`) |
| [M-UX-02](#m-ux-02-awkward-wrapping-of-action-bar-buttons) | Secondary action bar buttons wrap awkwardly on $\le 390\text{px}$ | Cosmetic | Mobile | Sector Headers (`/movies`, `/series`, etc.) |

---

## Detailed Bug Reports

### Major Severity

#### BUG-01: Stale search results persist when clearing input
- **Area:** Homepage Discovery Search (`/`)
- **Platform:** Desktop & Mobile
- **Steps to Reproduce:**
  1. Navigate to `/`.
  2. Type a query into the discovery search box (e.g. `"Bleach"`).
  3. Wait for external provider cards to render.
  4. Select all and delete the search input text (`value=""`).
- **Observed:** The previously rendered search result cards remain on screen indefinitely instead of clearing.
- **Expected:** Clearing the input field should reset results back to the default empty or initial view.

#### BUG-02: Silent failure on ADD TRACK button for unauthenticated users
- **Area:** Homepage Discovery Cards (`/`)
- **Platform:** Desktop & Mobile
- **Steps to Reproduce:**
  1. Open ShinDB in a logged-out session.
  2. Run any search on the homepage.
  3. Click `ADD TRACK` on any search result card.
- **Observed:** The API returns `401 Unauthorized`, and the button text turns into a red `[ERROR]` badge. No toast notification, modal, or redirect is triggered to explain that authentication is required.
- **Expected:** Show a toast notification (e.g. *"Please sign in to track media"*) or trigger a login prompt modal / redirect.

#### BUG-03: Video game ratings labeled as IMDb instead of RAWG
- **Area:** Games Catalog (`/games`)
- **Platform:** Desktop & Mobile
- **Steps to Reproduce:**
  1. Navigate to `/games`.
  2. Inspect any game card badge (*The Witcher 3*, *Arkham City*, etc.).
- **Observed:** Badges display `"IMDb 9.8"`, `"IMDb 9.4"`.
- **Expected:** Video game data originates from RAWG/Metacritic; badges should read `"RAWG 9.8"` or `"Metacritic"`.

#### M-BUG-01: Float precision leak in rating input
- **Area:** Media Detail & Edit Modal (`/movies`, `/anime`, `/games`, etc.)
- **Platform:** Mobile (Touch) & Desktop
- **Steps to Reproduce:**
  1. Open any media item that has a non-integer score (e.g. *The Batman* with score `7.7`).
  2. Click / tap `EDIT RECORD`.
  3. Inspect the `YOUR PERSONAL SCORE (0-10)` field.
- **Observed:** Input displays unrounded raw float: `value="7.699999809265137"`.
- **Expected:** Value should be formatted to a single decimal place (`7.7`).

#### M-BUG-02: Non-responsive multi-column admin tables
- **Area:** Admin Console (`/admin/users`, `/admin/media`)
- **Platform:** Mobile (390px viewport)
- **Steps to Reproduce:**
  1. Open `/admin/users` or `/admin/media` on a phone screen.
  2. Inspect table layout.
- **Observed:** 8–9 column desktop tables retain full width, pushing administrative action buttons (`Promote`, `Purge account completely`, `Edit catalog metadata`) off-screen and requiring heavy horizontal panning.
- **Expected:** Admin tables should collapse into vertical card components on narrow screens or provide sticky key columns with priority actions.

---

### Minor Severity

#### BUG-04: Dashboard top metrics flash 0 on initial authenticated load
- **Area:** Dashboard (`/`)
- **Platform:** Desktop & Mobile
- **Steps to Reproduce:**
  1. Log into an account with tracked items (e.g. `@JOHAN`).
  2. Navigate to `/`.
- **Observed:** Top metric cards show `TOTAL ANIME: 0`, `TOTAL MANGA: 0`, `TOTAL TRACKED: 0 ITEMS` before updating, while the lower breakdown displays real numbers (`Completed: 235`).
- **Expected:** Render a loading skeleton state or pre-hydrated counts on initial mount.

#### BUG-05: Double question mark in episode progress display
- **Area:** Media Detail Modal & Progress Badges
- **Platform:** Desktop & Mobile
- **Steps to Reproduce:**
  1. Open an ongoing anime with unconfirmed total episodes (*One Piece*).
  2. Tap `+1 EP`.
- **Observed:** Text renders as `"1174/? ? EP"`.
- **Expected:** Clean format `"1174/? EP"` or `"1174/Ongoing EP"`.

#### BUG-06: Misleading button label "NEW CUSTOM ENTRY"
- **Area:** Empty States (`/movies`, `/series`)
- **Platform:** Desktop & Mobile
- **Steps to Reproduce:**
  1. Open `/movies` when no movies are tracked.
  2. Click `NEW CUSTOM ENTRY`.
- **Observed:** Opens a modal titled `"ADD MOVIE // OFFICIAL ARCHIVE DISCOVERY ONLY"` (an external API search).
- **Expected:** If custom creation is not supported, label button `"SEARCH EXTERNAL ARCHIVE"` or `"ADD NEW RECORD"`.

#### BUG-07: Clerk uncaught TypeError during `/login` mount
- **Area:** Login Page (`/login`)
- **Platform:** Desktop DevTools
- **Steps to Reproduce:**
  1. Open DevTools console.
  2. Navigate to `/login`.
- **Observed:** `Uncaught TypeError: Cannot read properties of undefined (reading 'length')` thrown during Clerk script initialization.
- **Expected:** Clean component mount without uncaught exceptions in console.

#### M-BUG-03: Inactive "SEARCH & ADD TITLE" button in empty states
- **Area:** Empty States (`/movies`, `/series`)
- **Platform:** Mobile (390px viewport)
- **Steps to Reproduce:**
  1. Open empty `/movies` view on mobile.
  2. Tap `SEARCH & ADD TITLE`.
- **Observed:** Button tap does nothing. Only adjacent button `NEW CUSTOM ENTRY` triggers the search modal.
- **Expected:** Both buttons should either trigger discovery search or have distinct functional actions.

#### M-BUG-04: Inconsistent card touch targets on mobile
- **Area:** Catalog Cards (`/movies`, `/anime`, `/games`)
- **Platform:** Mobile (Touch)
- **Steps to Reproduce:**
  1. Open any catalog page on mobile.
  2. Tap directly on the title text of a card.
- **Observed:** Tapping title does nothing; only tapping the tiny `"Click card for details ↗"` label opens the modal.
- **Expected:** The entire card surface (poster + title container) should trigger the detail modal on touch devices.

#### M-BUG-05: Missing accessible name on admin drawer toggle
- **Area:** Admin Top Bar (`/admin/*`)
- **Platform:** Mobile
- **Steps to Reproduce:**
  1. Inspect the mobile admin toggle button next to `"ADMIN // OVERRIDE"`.
- **Observed:** Button contains an icon but lacks `aria-label`, failing WCAG 2.1 criteria.
- **Expected:** Add `aria-label="Toggle admin navigation menu"`.

---

### Cosmetic / UX Polish

#### UX-01: Duplicate word in admin link
- **Area:** `/admin` Overview
- **Observed:** Format overview section has a navigation button labeled `"MANAGE CATALOG CATALOG →"`.
- **Expected:** Change text to `"MANAGE CATALOG →"`.

#### UX-02: Flash of unauthenticated header before hydration
- **Area:** Navigation Bar (`/profile`, `/settings`, `/admin/*`)
- **Observed:** Top bar flashes `LOGIN` and `REGISTER` links for ~1s before Clerk hydrates user `@JOHAN`.
- **Expected:** Wrap header auth state in `<ClerkLoaded>` with a lightweight skeleton placeholder.

#### UX-03: Missing form accessibility attributes
- **Area:** Forms across `/login`, `/settings`, `/admin/audit-log`
- **Observed:** DevTools DOM warnings for missing `id`, `name`, and `autocomplete` hints on inputs.
- **Expected:** Add missing form attributes to satisfy browser autofill and accessibility guidelines.

#### M-UX-01: Admin audit log JSON overflow
- **Area:** Admin Audit Trail (`/admin/audit-log`)
- **Observed:** Expanding event `DETAILS` renders code blocks wider than the mobile viewport, forcing horizontal pan inside table cell.
- **Expected:** Apply `word-break: break-all;` or display JSON payloads in a mobile modal drawer.

#### M-UX-02: Awkward wrapping of action bar buttons
- **Area:** Catalog Action Bars (`/movies`, `/series`, `/anime`, `/manga`, `/games`)
- **Observed:** Action buttons (`Sync`, `Sort`, `Filter`, `Search`, `New`) wrap into two fragmented rows on screens $\le 390\text{px}$.
- **Expected:** Consolidate secondary actions into an overflow menu (`...`) or horizontal scrollable pills.
