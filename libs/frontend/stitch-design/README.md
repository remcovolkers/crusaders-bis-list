# Stitch design

Stitch exports (Tailwind CDN + vanilla HTML, dark UI "Vanguard"), split into small, balanced fragments so a single
component can be read or changed without loading a 1700-line file.

```
stitch-design/
├─ design-system/            Vanguard token/spec page
│  ├─ tailwind-theme.json    single source of truth for colors, spacing, radius, type scale
│  ├─ tokens.md              readable summary of the tokens above
│  ├─ layout.html, parts/, sections/, scripts/
├─ screens/
│  ├─ admin-user-management/ Roster governance table + user drawer + season/lockout config
│  └─ raid-planner/          20-man raid matrix, comp/buff audit, Discord webhook composer, modals
├─ shared/head.html          <head> shared by all pages (fonts, base CSS, Tailwind CDN, theme placeholder)
├─ tools/assemble.mjs        rebuilds standalone HTML from the fragments
├─ _source/                  the two original Stitch exports, untouched (reference + used by --verify)
└─ _build/                   generated previews (git-ignored)
```

## How it fits together

- Every target has a `layout.html` (page skeleton). Fragments are pulled in with `<!--@include parts/x.html-->`
  (path relative to the target folder; includes nest). `<!--@head web_dashboard-->` expands to `shared/head.html`
  with the Tailwind theme from `design-system/tailwind-theme.json` inlined.
- Each fragment is **one balanced element** (it starts with the Stitch comment naming it), so the include tree below
  maps 1:1 to the visual hierarchy.
- The Tailwind config was identical in all three originals, so it now lives once in `tailwind-theme.json`.
- The planner's inline `<script>` (toasts, modals, Discord preview) is extracted to `scripts/planner-interactions.js`.
- Content is mock data (Vaelin, Skaarl, Queen Ansurek, ...): treat it as layout/visual reference, not real data.

## Preview / verify

```
node tools/assemble.mjs              # all targets -> _build/*.html (open in a browser)
node tools/assemble.mjs raid-planner # one target
node tools/assemble.mjs --verify     # also compares output with _source/ (ignores whitespace/formatting)
```

`--verify` currently reports all three targets identical to the originals.
Note: `_source/screens.html` is one file containing two complete documents (admin first, then planner).

## Include trees

### screens/admin-user-management  (desktop, "Admin User Management & Season Config")

- [parts/topbar.html](screens/admin-user-management/parts/topbar.html) — 46 lines
- [parts/sidebar.html](screens/admin-user-management/parts/sidebar.html) — 24 lines
- [parts/page-ribbon.html](screens/admin-user-management/parts/page-ribbon.html) — 33 lines · Top Command Ribbon
- [parts/roster-workspace.html](screens/admin-user-management/parts/roster-workspace.html) — 8 lines · Main View Splitter: Table Canvas + Slide-Over Integrated Drawer
  - [parts/roster/roster-card.html](screens/admin-user-management/parts/roster/roster-card.html) — 6 lines · Section 1 Card
    - [parts/roster/filters.html](screens/admin-user-management/parts/roster/filters.html) — 5 lines · Filter Engine Header
      - [parts/roster/filter-controls.html](screens/admin-user-management/parts/roster/filter-controls.html) — 23 lines · Search
      - [parts/roster/class-badges.html](screens/admin-user-management/parts/roster/class-badges.html) — 18 lines · Class Badges Strip
    - [parts/roster/raider-table.html](screens/admin-user-management/parts/roster/raider-table.html) — 316 lines · High-Density Raider Table Container
    - [parts/roster/pagination.html](screens/admin-user-management/parts/roster/pagination.html) — 21 lines · Table Pagination Footer
  - [parts/drawer/user-detail-drawer.html](screens/admin-user-management/parts/drawer/user-detail-drawer.html) — 7 lines · Right Drawer: User Management Detail Panel (Vaelin Focus)
    - [parts/drawer/header.html](screens/admin-user-management/parts/drawer/header.html) — 19 lines · Drawer Header
    - [parts/drawer/quick-stats.html](screens/admin-user-management/parts/drawer/quick-stats.html) — 15 lines · Quick Stats Strip
    - [parts/drawer/form-modules.html](screens/admin-user-management/parts/drawer/form-modules.html) — 8 lines · Form Configuration Modules
      - [parts/drawer/discord-bind.html](screens/admin-user-management/parts/drawer/discord-bind.html) — 12 lines · Discord Identity Bind
      - [parts/drawer/roles-privileges.html](screens/admin-user-management/parts/drawer/roles-privileges.html) — 22 lines · Role & Privilege Matrix
      - [parts/drawer/team-status.html](screens/admin-user-management/parts/drawer/team-status.html) — 20 lines · Team & Status Assignment
      - [parts/drawer/soft-reserves.html](screens/admin-user-management/parts/drawer/soft-reserves.html) — 33 lines · Active Soft Reserves Review
      - [parts/drawer/loot-history.html](screens/admin-user-management/parts/drawer/loot-history.html) — 18 lines · Loot History Received (Last 30 Days)
    - [parts/drawer/actions.html](screens/admin-user-management/parts/drawer/actions.html) — 14 lines · Action Panel Buttons
- [parts/season/season-config.html](screens/admin-user-management/parts/season/season-config.html) — 6 lines · Section 2: Season & Lockout Configuration Panel
  - [parts/season/header.html](screens/admin-user-management/parts/season/header.html) — 13 lines · Header with Live Season Status
    - [parts/season/lockout-tools.html](screens/admin-user-management/parts/season/lockout-tools.html) — 11 lines · Manual Lockout Override Tools
  - [parts/season/team-rulesets.html](screens/admin-user-management/parts/season/team-rulesets.html) — 5 lines · Dual Team Rulesets Grid
    - [parts/season/ruleset-crusaders.html](screens/admin-user-management/parts/season/ruleset-crusaders.html) — 33 lines · Team Crusaders (Mythic) Card
    - [parts/season/ruleset-templars.html](screens/admin-user-management/parts/season/ruleset-templars.html) — 33 lines · Team Templars (Heroic) Card
  - [parts/season/discord-webhook-center.html](screens/admin-user-management/parts/season/discord-webhook-center.html) — 24 lines · Automated Discord Webhook & Bot Notification Center

### screens/raid-planner  (desktop, "Raid Planner & Comp Analysis")

- [parts/topbar.html](screens/raid-planner/parts/topbar.html) — 44 lines
- [parts/sidebar.html](screens/raid-planner/parts/sidebar.html) — 45 lines
- [parts/toast.html](screens/raid-planner/parts/toast.html) — 13 lines · TOAST NOTIFICATION CONTAINER
- [parts/header/header.html](screens/raid-planner/parts/header/header.html) — 5 lines · SECTION 1: HEADER & RAID METRICS BANNER
  - [parts/header/breadcrumb.html](screens/raid-planner/parts/header/breadcrumb.html) — 20 lines · Breadcrumb & Lockout Meta
  - [parts/header/title-card.html](screens/raid-planner/parts/header/title-card.html) — 19 lines · Main Title Card with Dark Aesthetic Graphic Grid
    - [parts/header/kpi-bar.html](screens/raid-planner/parts/header/kpi-bar.html) — 31 lines · KPI Telemetry Bar
    - [parts/header/actions.html](screens/raid-planner/parts/header/actions.html) — 19 lines · Action Button Group
    - [parts/header/decoration.html](screens/raid-planner/parts/header/decoration.html) — 4 lines · Subtle background architectural decoration
- [parts/planner-bento.html](screens/raid-planner/parts/planner-bento.html) — 5 lines · MAIN DUAL-PANEL BENTO: RAID MATRIX (LEFT) + ANALYSIS & DISCORD (RIGHT)
  - [parts/matrix/left-column.html](screens/raid-planner/parts/matrix/left-column.html) — 5 lines · LEFT COLUMN: 20-MAN GROUP ROSTER MATRIX (COL 7)
    - [parts/matrix/roster-matrix.html](screens/raid-planner/parts/matrix/roster-matrix.html) — 16 lines
      - [parts/matrix/groups.html](screens/raid-planner/parts/matrix/groups.html) — 7 lines · Four Groups Matrix (2x2 Grid)
        - [parts/matrix/group-1.html](screens/raid-planner/parts/matrix/group-1.html) — 84 lines · GROUP 1: Main Tank & Melee
        - [parts/matrix/group-2.html](screens/raid-planner/parts/matrix/group-2.html) — 84 lines · GROUP 2: Off-Tank & Melee
        - [parts/matrix/group-3.html](screens/raid-planner/parts/matrix/group-3.html) — 84 lines · GROUP 3: Ranged Core
        - [parts/matrix/group-4.html](screens/raid-planner/parts/matrix/group-4.html) — 84 lines · GROUP 4: Flex & Utility / Evoker
      - [parts/matrix/bench.html](screens/raid-planner/parts/matrix/bench.html) — 56 lines · BENCH & STANDBY CADRE
    - [parts/matrix/boss-assignments.html](screens/raid-planner/parts/matrix/boss-assignments.html) — 30 lines · BOSS TACTICAL ASSIGNMENT STRIP (QUEEN ANSUREK)
  - [parts/analysis/right-column.html](screens/raid-planner/parts/analysis/right-column.html) — 5 lines · RIGHT COLUMN: COMP AUDIT, BUFFS & DISCORD WEBHOOK COMPOSER (COL 5)
    - [parts/analysis/comp-audit.html](screens/raid-planner/parts/analysis/comp-audit.html) — 15 lines · COMPOSITION ANALYSIS & RAID BUFF AUDIT
      - [parts/analysis/role-ratio.html](screens/raid-planner/parts/analysis/role-ratio.html) — 18 lines · Role Ratio Bar
      - [parts/analysis/buff-coverage.html](screens/raid-planner/parts/analysis/buff-coverage.html) — 50 lines · Synergy Grid: Buffs, Brez & Lust
        - [parts/analysis/utility-counters.html](screens/raid-planner/parts/analysis/utility-counters.html) — 17 lines · Utility Counters
        - [parts/analysis/tier-tokens.html](screens/raid-planner/parts/analysis/tier-tokens.html) — 26 lines · Armor Tier Token Breakdown
    - [parts/discord/discord-composer.html](screens/raid-planner/parts/discord/discord-composer.html) — 12 lines · DISCORD WEBHOOK COMPOSER & LIVE EMBED PREVIEW
      - [parts/discord/composer-inputs.html](screens/raid-planner/parts/discord/composer-inputs.html) — 28 lines · Composer Inputs
      - [parts/discord/embed-preview.html](screens/raid-planner/parts/discord/embed-preview.html) — 67 lines · LIVE DISCORD EMBED PREVIEW
- [parts/overlays/feedback-trigger.html](screens/raid-planner/parts/overlays/feedback-trigger.html) — 5 lines · FLOATING FEEDBACK TRIGGER BUTTON
- [parts/overlays/feedback-modal.html](screens/raid-planner/parts/overlays/feedback-modal.html) — 59 lines · FEEDBACK & DISPUTE MODAL (OVERLAY)
- [parts/overlays/settings-modal.html](screens/raid-planner/parts/overlays/settings-modal.html) — 30 lines · PLAN SETTINGS MODAL (OVERLAY)
- [scripts/planner-interactions.js](screens/raid-planner/scripts/planner-interactions.js) — 135 lines

### design-system  (Vanguard tokens & components)

- [parts/topbar.html](design-system/parts/topbar.html) — 105 lines
- [parts/toast.html](design-system/parts/toast.html) — 10 lines · Interactive Toast Notification Element
- [parts/outline-rail.html](design-system/parts/outline-rail.html) — 103 lines · Sticky Architectural Rail
- [sections/01-spec-overview.html](design-system/sections/01-spec-overview.html) — 61 lines · 1. HERO INTRO & SPECIFICATION BANNER
- [sections/02-surface-elevation.html](design-system/sections/02-surface-elevation.html) — 209 lines · 2. PALETTE & SURFACE ELEVATION LAYERS
- [sections/03-status-tokens.html](design-system/sections/03-status-tokens.html) — 86 lines · 3. SYSTEM STATUS TOKENS
- [sections/04-class-palette.html](design-system/sections/04-class-palette.html) — 270 lines · 4. SEMANTIC GAMING TOKENS: 13 WOW CLASS PALETTE
- [sections/05-item-tiers.html](design-system/sections/05-item-tiers.html) — 231 lines · 5. ITEM UPGRADE TIERS & SUPER RARE MARKER
- [sections/06-raids-teams.html](design-system/sections/06-raids-teams.html) — 160 lines · 6. RAID INSTANCES & GUILD TEAM TOKENS
- [sections/07-typography.html](design-system/sections/07-typography.html) — 193 lines · 7. TYPOGRAPHY & TABULAR NUMBERS SYSTEM
- [sections/08-spacing-accessibility.html](design-system/sections/08-spacing-accessibility.html) — 144 lines · 8. SPACING, RADIUS, ELEVATION & ACCESSIBILITY TOKENS
- [parts/playground-footer.html](design-system/parts/playground-footer.html) — 36 lines · Interactive Playground Footer
- [scripts/copy-token.js](design-system/scripts/copy-token.js) — 23 lines
- [parts/page-footer.html](design-system/parts/page-footer.html) — 20 lines
