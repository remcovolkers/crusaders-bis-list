# FOUNDATION - the contract for phase-2 agents

Phase 1 ported the Stitch "Vanguard" design language into the app's global stylesheet. **Phase-2 agents read this file
plus the Stitch fragments, and nothing else about the foundation.** Do not edit the files listed under "Owned by the
foundation"; if you need a token or a primitive that is missing, report it in your final report.

- Live catalogue of every primitive (open in a browser):
  `node libs/frontend/stitch-design/tools/build-styleguide-css.mjs` then open `libs/frontend/stitch-design/styleguide.html`
- Stitch previews: `node libs/frontend/stitch-design/tools/assemble.mjs` -> `_build/*.html`
- App screenshots: `node scripts/visual-qa/screenshot.mjs --route /loot --persona raider --out tmp/visual/x` (see its README)

## 0. Where things live

```
apps/crusaders-bis-list-frontend/src/styles.scss        entry: @use's the partials below (ORDER MATTERS)
apps/crusaders-bis-list-frontend/src/styles/
  _tokens.scss       all CSS custom properties (+ legacy aliases)
  _base.scss         reset, html/body, focus ring, scrollbars, Material Symbols, .scroll-*, .loading-spinner
  _typography.scss   .t-* type scale, .c-* colour helpers, .class-<slug> colours
  _surfaces.scss     card/panel, stat tile, progress, avatar, divider, empty box, banner, page + page header, layout helpers
  _buttons.scss      .btn family, .icon-btn
  _badges.scss       .badge family, .chip family, .class-stripe/.class-tile, legacy cat/tier badges
  _forms.scss        inputs, switch, check-row, search field, segmented control
  _table.scss        .table, .table-wrap, .pagination
  _navigation.scss   .tabs, .topbar/.nav-link/.brand-*, .sidebar/.nav-item, .bottom-nav, .stepper
  _overlays.scss     .modal*, .drawer* (incl. .drawer--contained), .popover
  _items.scss        item icon, confirm-item preview (loot/admin)
  _mixins.scss       SCSS-only helpers (not usable from component SCSS)
apps/.../src/app/app.html|scss|ts                       app shell (top bar, mobile menu)
libs/frontend/shared-ui/**                              toast, feedback button, raider card, class/spec selector, wheel
apps/.../src/index.html                                 Inter + Material Symbols <link>s
```

**Owned by the foundation (do not edit in phase 2):** everything above. Component SCSS in feature libs may *use* any
global class or CSS variable freely.

Global styles are not subject to the `anyComponentStyle` budget (10kb warn / 20kb error): **prefer global primitives
over copying rules into component SCSS.** Current global CSS is ~58 kB raw / ~8 kB transferred.

## 1. Decisions you should know about

| Topic | Decision |
|---|---|
| **Gold** | Stitch has two golds: `--primary #e6c364` (text, icons, active states, focus ring, **primary button fill**) and `--primary-container #c9a84c` (brand tile, decorative fills). The old `--accent-gold` (#c9a84c, used for text *and* fills) is now an **alias of `--primary`** (#e6c364). Primary button = `--primary`, hover `--gold-hover` #dbb95d, pressed `--gold-pressed` #b3923d, text `--on-primary` #3d2e00. The old `#c9a84c` lives on as `--primary-container`. `--accent-gold-dim` (#8a6f30) is unchanged (legacy). |
| **Surfaces** | Elevation through tone, not borders: `surface-base` (page) < `surface-tier-1` (cards) < `surface-tier-2` (nested, strips, inputs) < `surface-hover`. Borders are the exception (hairline `--border-subtle`), shadows are subtle. |
| **Radius** | Sharp. `--radius-xs` 2px (buttons, inputs, badges, chips) / `--radius-sm` 4px (cards, panels, modals) / `--radius-md` 8px (rare big containers) / `--radius-lg` 12px / `--radius-pill`. The legacy names `--radius-sm/md/lg` kept their pixel values (4/8/12), they just map onto Stitch's scale. |
| **Body text** | 13px / 1.5 Inter (was 14px/1.6 system font). Dense UI is intentional. |
| **Warrior colour** | `--class-warrior` is now Stitch/Blizzard `#c69b6d` (was `#c69b3a`). |
| **Status green** | Stitch renders "positive" numbers in neon `class-monk` (#00ff98). Do **not** use class colours for status: use `--success`/`.c-success` (`--success-text #34d399`). |
| **Team colours** | `--team-crusaders #f59e0b` (amber), `--team-templars #06b6d4` (cyan) (from tokens.md; the spec page's `#c9a84c` for crusaders is a Stitch inconsistency, ignore). Same amber as `--tier-super-rare` and `--warning` - disambiguate with icon/label, never colour alone. |
| **Active nav** | Top bar uses the admin Stitch variant: `tier-2` pill with gold text (not the planner's solid gold container, not the design-system underline). Sidebar uses `surface-hover` + gold text; `.nav-item--accent` is the planner's gold-dim + 2px bar. |
| **Top bar height** | `--topbar-h: 56px` (was 54px). |
| **Toast** | Moved from bottom-right to top-right below the top bar (Stitch), full width on phones. |

## 2. Tokens (CSS custom properties on `:root`)

Use the **Stitch names**. The legacy names exist only so the current feature components keep working.

### Surfaces / text / borders
| Token | Use for |
|---|---|
| `--surface-base` #0a0e17 | page background, table body, inset wells, text on gold when an inverse is needed |
| `--surface-tier-1` #12182b | cards, panels, sidebar, modal, drawer |
| `--surface-tier-2` #1a2235 | nested blocks inside tier-1, card header strips, inputs, secondary buttons, popovers |
| `--surface-hover` #222d44 | hover and selected rows/items |
| `--text-primary` #e2e8f0 / `--text-secondary` #94a3b8 / `--text-muted` #5a6a82 | main text / labels, sub text / captions, keys, placeholders |
| `--border-subtle` #2a3650, `--border-strong` #3d4f6e | hairlines, dividers; hover/active outline |
| `--on-surface` #dfe2ef, `--outline`, `--outline-variant` | rare Stitch roles |

### Gold
`--primary` (#e6c364), `--primary-container` (#c9a84c), `--on-primary` (#3d2e00), `--on-primary-container` (#503d00),
`--gold-hover`, `--gold-pressed`, `--gold-dim` (15% tint for pills/selected), `--gold-dim-strong` (28%).

### Status tones (each has `base`, `-text`, `-dim` 15% bg, `-line` 30%, `-tint` dark fill)
`--success` #10b981, `--warning` #f59e0b, `--danger` #ef4444, `--info` #38bdf8.
Use `base` for dots/bars/icons-on-tint, `-text` for text on dark, `-dim` for tinted backgrounds.
Stitch material roles for destructive UI: `--error` #ffb4ab, `--error-container` #93000a.

### Domain colours
- Teams: `--team-crusaders`, `--team-templars`
- Item tiers: `--tier-champion` #60a5fa, `--tier-hero` #c084fc, `--tier-myth` #fb923c, `--tier-super-rare` #f59e0b
- Classes: `--class-warrior|paladin|hunter|rogue|priest|death-knight|shaman|mage|warlock|monk|druid|demon-hunter|evoker`
- Raids (app-specific): `--raid-voidspire|dreamrift|queldanas` (no Stitch equivalent, kept)

### Spacing (4px base) - use these, not ad-hoc px
`--space-xs` 4 · `--space-sm` 6 · `--space-md` 12 (default gap / card padding) · `--space-lg` 20 (panel gap) ·
`--space-xl` 32 (section gap) · `--space-2xl` 48 · `--gutter` 12 / `--gutter-desktop` 16 (grid gaps) ·
`--margin` 16 / `--margin-desktop` 24 (page padding).

### Radius / elevation / layout / motion
`--radius-xs|sm|md|lg|pill` · `--shadow-sm|md|lg|xl|inset|topbar` · `--topbar-h` 56px · `--sidebar-w` 240px ·
`--content-max` 1520px · `--drawer-w` 440px · `--touch-target` 44px · z-index: `--z-sticky` 50, `--z-sidebar` 150,
`--z-topbar` 200, `--z-drawer` 500, `--z-modal` 1000, `--z-toast` 9999 · `--ease`, `--dur-fast` .12s, `--dur` .18s.

### Type scale tokens
`--t-<name>-size|lh|ls|weight` for `headline-xl`, `headline-xl-mobile`, `headline-lg`, `headline-md`, `title-sm`,
`body-default`, `body-medium`, `body-code`, `stat-mono`, `label-caps`. Prefer the `.t-*` classes (section 3); use the
variables in component SCSS: `font-size: var(--t-headline-md-size); line-height: var(--t-headline-md-lh);`.

### Legacy aliases (do not use in new code)
`--bg-base`=surface-base, `--bg-surface`=tier-1, `--bg-elevated`=tier-2, `--bg-hover`=surface-hover,
`--border-color`=border-subtle, `--border-bright`=border-strong, `--accent-gold`=primary, `--accent-red`=danger,
`--accent-green`=success, `--color-success|danger`, `--accent-blue` #3b82f6, `--accent-gold-dim` #8a6f30.
When you restyle a component, replace them with the Stitch names in that component's SCSS.

## 3. Primitive catalogue

All snippets are minimal. Icons are Material Symbols: `<span class="material-symbols-outlined">name</span>`; size with
`.icon-14|16|18|20|24|32`, filled with `.icon-fill` (e.g. star). Icon buttons/labels that are icon-only need `aria-label`.

### Typography
`.t-headline-xl` (32/38, 24px on phones) · `.t-headline-lg` (22/28, page titles) · `.t-headline-md` (18/24, card/modal titles) ·
`.t-title-sm` (15/20) · `.t-body-default` (=`.t-body`) · `.t-body-medium` · `.t-body-code` (12/16, meta text) ·
`.t-stat-mono` (=`.t-stat`, tabular-nums; `.t-stat-mono--sm` = 12px for dense table cells) · `.t-label-caps` (10px caps, muted labels). Helpers: `.tnum`, `.truncate`, `.nowrap`,
`.uppercase`, `.text-left|center|right`, `.fw-medium|semibold|bold`.
Colour helpers (color only): `.c-text .c-secondary .c-muted .c-gold .c-success .c-warning .c-danger .c-info .c-crusaders
.c-templars .c-champion .c-hero .c-myth .c-super-rare`.
```html
<h1 class="t-headline-lg">Gebruikersbeheer</h1>
<span class="t-label-caps c-muted">Team</span> <span class="t-stat-mono c-myth">639.4</span>
```

### Role colours (tank / healer / dps)
`.role-tank|.role-healer|.role-dps` colour text/icons (`color`) and expose the same colour as `--item-color` (so they also tint a
`.segmented__item`) and `--dot-color` (so they also colour a `.dot`). Default colours are the tokens `--role-tank` (info),
`--role-healer` (success-text), `--role-dps` (error); a screen can re-map them by redefining the three tokens on its root
(`admin-user-management` and the user drawer use myth / success / secondary).
```html
<span class="material-symbols-outlined icon-16 role-tank">shield</span>
<span class="dot dot--sm role-healer"></span>
<button class="segmented__item role-dps" [class.is-active]="f() === 'dps'">DPS</button>
```

### Class colours
`.class-<slug>` sets `color` **and** `--class-color`. Slug = lower-case class name, spaces to dashes
(`Death Knight` -> `class-death-knight`; the raider-card already builds that form).
```html
<span class="t-body-medium class-mage">Eladria</span>
<span class="badge badge-class class-death-knight">Death Knight</span>         <!-- tinted badge -->
<span class="class-tile class-paladin">V</span>                                 <!-- 28px initial tile (--lg 32px) -->
<span class="class-stripe class-druid"></span>                                  <!-- 6px vertical bar next to names -->
```
For dynamic data you can set the variable inline: `[style.--class-color]="color"` and use `.badge-class`/`.class-tile`/`.chip-class`.

### Buttons
`.btn` (secondary, default) · `.btn-primary` (gold CTA, max one per section) · `.btn-secondary` · `.btn-ghost` (outlined, legacy) ·
`.btn-text` (no fill/outline = Stitch "ghost") · `.btn-danger` · `.btn-success` · `.btn-sm` · `.btn-block` · `.is-disabled`.
Every variant works standalone (`class="btn-primary"`) or combined (`class="btn btn-primary"`). 32px tall (28 `-sm`, 36 on touch).
```html
<button class="btn-primary"><span class="material-symbols-outlined">save</span>Opslaan</button>
<button class="btn btn-sm">Annuleren</button>
<button class="icon-btn" aria-label="Bewerken"><span class="material-symbols-outlined">edit</span></button>
```
`.btn-tint` = gold-tinted secondary that stays visible on a tier-2 surface (`class="btn btn-sm btn-tint"`, e.g. "Pas aan" on a loot tile).
`.btn-link-bnet` (+ `.bnet-icon` img) = Battle.net link button in the brand blue.
`.icon-btn` (32px, 24px `--sm`) + `--gold`, `--danger` (red on hover), `.is-active`. Destructive confirm = `.btn-danger`.

### Badges (static) and chips (interactive)
`.badge` + one of: `.badge-neutral` (`-muted`) `.badge-gold` `.badge-success` (`-green`) `.badge-warning` `.badge-danger` (`-red`)
`.badge-info` `.badge-blue` `.badge-purple` `.badge-crusaders` `.badge-templars` `.badge-champion` `.badge-hero` `.badge-myth`
`.badge-super-rare` `.badge-class` (+`.class-<slug>`) `.badge-solid`. Modifiers: `.badge--sentence` (no caps), `.badge--pill`,
`.badge--dot` (status dot), `.badge--lg`.
```html
<span class="badge badge-crusaders">Crusaders</span>
<span class="badge badge-champion badge--dot">Actief</span>
<span class="badge badge-super-rare"><span class="material-symbols-outlined icon-fill">star</span>Super rare</span>
```
Chips: `.chip` (+`.is-active` or `aria-pressed="true"` = gold tint), `.chip-class` + `.class-<slug>` (muted until hover/active).
```html
<button class="chip chip-class class-mage" [class.is-active]="sel()" (click)="toggle()">Mage</button>
```
Class-edged compact chip (`.chip-edged` + `.class-<slug>`; tier-2 pill, 3px left edge in `--class-color`, 28px / 36px below 768px):
```html
<button class="chip-edged class-mage"><span>Arcanis</span></button>
```
Interactive tier marker `.tier-chip` (+ `.active`, `__count`) tints itself with `currentColor`, so add a tier colour class:
`<button class="tier-chip tier-hero_tier" [class.active]="open">Hero <span class="tier-chip__count">+2</span></button>`.
Tier colour hooks: an element with `data-tone="champion|hero|myth"` or `data-tier="champion_tier|hero_tier|myth_tier"` exposes
`--tone`, `--tier-color` and `--item-color` to its subtree. `difficultyTone(difficulty)` (shared-domain) maps Normal -> champion,
Heroic -> hero, Mythic -> myth for `[attr.data-tone]` / `.badge-<tone>`.
Item visuals: `.cat-badge .cat-trinket|weapon|offhand|cloth|leather|mail|plate|jewelry|other`, `.stat-badge`, `.weapon-badge`,
`.tier-badge.tier-badge--champion_tier|hero_tier|myth_tier` (also `--champion|hero|myth|super-rare`), `.tier-<x>_tier` colour classes - unchanged API, flat look.
**Item tier mapping:** champion blue, hero purple, myth orange, super rare = amber + star icon + `.badge-super-rare`.

### Cards and panels
```html
<section class="card">                       <!-- tier-1, 12px padding, 4px radius, shadow-sm -->
  <header class="card-header">               <!-- tier-2 strip bleeding to the card edge -->
    <h3 class="card-title"><span class="material-symbols-outlined">equalizer</span>Titel</h3>
    <div class="card-actions"><button class="btn btn-sm">Actie</button></div>
  </header>
  ...content...
</section>
```
`.card-tier-2` (nested block inside a tier-1 surface; inputs inside auto-darken) · `.card-flush` (no padding, for tables/lists) ·
`.card-lg` (20px padding) · `.card-bordered` (hairline; only when touching another tier-1 surface) · `.card-interactive` (hover) ·
`.card-selected` (gold left bar). `.panel > .panel__header + .panel__body` = same look without negative margins.
`.card-flush > .card-header` works (the strip no longer bleeds/clips; `.card-flush` sets `--card-pad: 0px`).
- `.card-accent` - left-edge bar via `::before`, colour `--accent-color` (default gold), width `--accent-w` (3px); on `.card` the left padding grows by the bar;
  on `.panel` it does not. Keeps the card shadow. Toggle per item: `<article class="panel" [class.card-accent]="superRare" style="--accent-color: var(--tier-super-rare)">`.
  Difficulty cards: `data-tone` gives `--tone`, then `.plan-card { --accent-color: var(--tone); --accent-w: 4px }`.
- `.card-danger` - destructive tools: red left edge + `--danger-dim` header strip (`<section class="card card-danger"><header class="card-header">`).
- `.sticky-bar` - sticky filter/toolbar inside a scroller (`top: var(--sticky-top, 0)`, base background, `--z-sticky`).
Never put a tier-1 card directly in a tier-1 container without a `.card-tier-2`/`.card-bordered`.

### Page stage (login, onboarding, roll spectator)
`.page-stage` = base colour with a soft gold spotlight (`--stage-shape`, `--stage-tint`, `--stage-fade`); `.watermark` = big faint corner icon
(`--wm-color|size|right|top`, container needs `position: relative; overflow: hidden`).
```html
<div class="login-container page-stage"><section class="card card-lg" style="position:relative;overflow:hidden">
  <span class="watermark material-symbols-outlined" aria-hidden="true">military_tech</span> ...
```

### Stat tile / KPI, progress, ratio bar
```html
<div class="stat-grid">                                  <!-- auto-fit, min 130px -->
  <div class="stat-tile">
    <span class="stat-tile__label">Raiders</span>
    <span class="stat-tile__value c-gold">20<span class="stat-tile__sub">+4 reserve</span></span>
  </div>
</div>
<div class="progress progress--sm"><div class="progress__bar progress__bar--success" style="width: 60%"></div></div>
<div class="ratio-bar"><div class="ratio-bar__seg" style="width:20%;background:var(--team-templars)" title="Tanks"></div>...</div>
```
Modifiers: `.stat-tile--base` (on tier-2), `--lg`; `.progress--sm|lg|on-tier-2`, `.progress__bar--success|warning|danger|info`. Inline widths are fine (data-driven).

### Avatar, dot, divider, kbd
`.avatar` (gold circle with icon, 32px; `--sm` 24, `--lg` 40; also on `<img>`) · `.dot` + `style="--dot-color: var(--success)"` (`--sm`, `--pulse` for live) ·
`.divider` (hr, 1px) / `.divider.divider--v` (inline 16px vertical) · `<kbd>` / `.kbd`.

### Banners, empty states
```html
<div class="banner banner-danger"><span class="material-symbols-outlined">error</span><div>Er ging iets mis</div></div>
```
`.banner-success|warning|danger|info`; the legacy `.error-banner/.success-banner` (+ new `.warning-banner/.info-banner`) look the same.
```html
<div class="empty-box empty-box--boxed">
  <span class="material-symbols-outlined">inbox</span>
  <p class="empty-box__title">Niets gevonden</p><p class="empty-box__text">Uitleg.</p><button class="btn btn-sm">Reset</button>
</div>
<div class="empty-slot">+ 1 vrije plek</div>              <!-- compact dashed slot -->
<div class="slot-row slot-row--sr">                        <!-- filled counterpart (tier-2 row; --sr = super-rare edge, --btn = whole row is a button) -->
  <div class="slot-row__main"><span class="t-body-medium slot-row__name">Item</span><div class="slot-row__badges">...</div></div>
  <div class="slot-row__actions">...</div>
</div>
```
`.empty-box__title` / `__text` take their colour from `--empty-title-color` (default text-secondary) / `--empty-text-color` (default: inherit).
(`.empty-box`, not `.empty-state`: several feature components define their own `.empty-state`.) Loading: `.loading-spinner` (unchanged).

### Forms
```html
<div class="form-field">
  <label class="form-label" for="n">Naam</label>
  <input id="n" class="form-input" />
  <span class="form-hint">Uitleg</span> <!-- or <span class="form-error">Verplicht</span> + .is-invalid on the input -->
</div>
```
`.form-input`, `.form-select`, `.form-textarea` (also `select.form-input`, `textarea.form-input`), `.form-input--sm`, `.form-row` (2 columns, 1 on phones),
`.form-field` (label + control stack; name chosen because `.form-group`/`.field` are used locally by features). Fields are borderless tier-2 with a
gold 1px focus ring; inside `.card-tier-2`, `.card-header`, `.stat-tile` they switch to the base colour automatically (or add `.surface-2` to any container).
Touch devices get 40px fields at 16px font (no iOS zoom).
- `.check-row` - whole-row checkbox tile: `<label class="check-row"><span>Raider</span><input type="checkbox" /></label>`
- `.switch` - `<label class="switch"><input type="checkbox" /><span class="switch__track"></span></label>`
- `.search-field` - `<label class="search-field"><span class="material-symbols-outlined">search</span><input placeholder="Zoek..." /></label>`
- `.segmented` - filter pills / team switch:
```html
<div class="scroll-x scroll-hidden"><div class="segmented" role="group">
  <button class="segmented__item is-active">Alle</button>
  <button class="segmented__item" style="--item-color: var(--team-crusaders)">Crusaders</button>
</div></div>
```
Selected = `.is-active` / `[aria-pressed=true]`. `.segmented--block` stretches. `.segmented--lg` = 28px sentence-case items (tier/difficulty switch);
`.segmented--tint` tints the selected item with its `--item-color` (+ 2px colour bar); `--segmented-bg` changes the track colour.
```html
<div class="segmented segmented--lg segmented--tint"><button class="segmented__item is-active" data-tone="hero">Hero</button></div>
```

### Tables
```html
<div class="table-wrap">
  <table class="table table--clickable">
    <thead><tr><th>Raider</th><th class="cell-num">Items</th><th class="cell-actions"></th></tr></thead>
    <tbody><tr class="is-selected"><td><div class="cell-id"><span class="class-tile class-paladin">V</span><span>Vaelin</span></div></td>
      <td class="cell-num">2 / 3</td><td class="cell-actions"><button class="icon-btn icon-btn--sm">...</button></td></tr></tbody>
  </table>
</div>
<div class="pagination"><span>1-20 van 32</span><div class="row gap-xs">...<span class="pagination__page">1</span>...</div></div>
```
Header = tier-2 caps strip, body = base with hairline rows, hover = surface-hover, selected = gold tint + bar, **no zebra**
(`.table--zebra` opt-in). `.table--comfortable` taller rows, `.table--fade-actions` dims row actions until hover.
Don't put `display:flex` on a `<td>`: use `.cell-id` (a flex div inside the cell).
Long tables: `.table-wrap.table-wrap--scroll` scrolls vertically inside the wrapper (`--table-max-h`, default 480px) with a sticky header.
**Mobile:** always wrap in `.table-wrap` (horizontal scroll). For <= 5 columns prefer `.table--stack` + `data-label` on each `<td>`: rows become cards below 640px.

### Tabs
`<div class="tabs" role="tablist"><button class="tab is-active" role="tab" aria-selected="true">Overzicht</button><a class="tab" routerLink routerLinkActive="is-active">...</a></div>`
Underline style; active = `.is-active` / `.active` / `aria-selected=true` / `aria-current=page`. Scrolls horizontally on mobile.

### Page layout and page header
```html
<div class="page">                       <!-- max 1520px, padding 12/16/24 by breakpoint; .page--narrow (960) / .page--wide -->
  <header class="page-head">
    <div class="page-head__main">
      <div class="page-head__eyebrow"><span class="badge badge-gold">Admin</span><span class="page-head__meta">Seizoen 1</span></div>
      <h1 class="page-head__title">Titel</h1>
      <p class="page-head__subtitle">Uitleg.</p>
    </div>
    <div class="page-head__actions"><button class="btn">Export</button><button class="btn-primary">Nieuw</button></div>
  </header>
  ...
</div>
```
`.page-head--hero` = headline-xl title. Breadcrumb: `<nav class="breadcrumb"><a routerLink>Raid Hub</a><span class="breadcrumb__sep">/</span><span>Detail</span></nav>`.
(`.page-head`, not `.page-header`: five feature components define a local `.page-header`; migrate them to `.page-head`.)

Layout helpers: `.stack` (column, gap `--space-md`), `.row` (flex centre, gap `--space-sm`), `.row-wrap`, `.row-between`, gaps `.gap-xs|sm|md|lg|xl`
(set `--gap`), `.grow`, `.shrink-0`, `.spacer`, grids `.grid-2|3|4|auto` (1 column on phones, 2 from 641px, 3/4 from 1025px; `.grid-auto` = 240px columns),
`.hide-mobile` / `.show-mobile` (switch at 768px), `.sr-only`, `.scroll-y`, `.scroll-x`, `.scroll-hidden`.

### Navigation shells
- **Top bar** (done in `app.html`): `.topbar`, `.topbar__brand`, `.brand-mark`, `.brand-text(__name|__sub)`, `.nav-link` (+`.active`/`aria-current=page`).
- **Sidebar** for the admin shell: 
```html
<aside class="sidebar">
  <div class="sidebar__label">Beheer</div>
  <nav class="sidebar__nav">
    <a class="nav-item" routerLink="users" routerLinkActive="active"><span class="material-symbols-outlined">shield_person</span>Gebruikers</a>
  </nav>
  <div class="sidebar__footer">...info block...</div>
</aside>
```
`.nav-item--accent` for the planner style, `.nav-item__badge` for counters. The sidebar does **not** position itself; make it a flex/grid child of the shell
with its own height (`--sidebar-w` wide). **Mobile:** drop the sidebar and use `.bottom-nav` (`.bottom-nav__item.active`) as a flex child at the bottom of the shell
(`--topbar-h` tall, safe-area aware), exactly like the current admin bottom-nav.

### Stepper (wizard progress)
`ol.stepper > li.stepper__step(.is-active|.is-done) > .stepper__dot + .stepper__label` with `li.stepper__line(.is-done)` between the steps (see onboarding).

### Overlays
Modal:
```html
<div class="modal-backdrop" (click)="close()">
  <div class="modal modal--lg" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
    <div class="modal-header"><h3><span class="material-symbols-outlined">report</span>Titel</h3>
      <button class="icon-btn" aria-label="Sluiten"><span class="material-symbols-outlined">close</span></button></div>
    <div class="modal-body">...</div>
    <div class="modal-footer"><button class="btn">Annuleren</button><button class="btn-primary">Opslaan</button></div>
  </div>
</div>
```
Sizes `.modal--sm` 360 / default 440 / `--lg` 600 / `--xl` 800; `.modal--danger` red edge. Max height = viewport; `.modal-body` scrolls. Legacy `.modal-close` (text ✕) kept.
Drawer (slide-over from the right, 440px, 100% on phones):
```html
<div class="drawer-backdrop drawer-backdrop--end" (click)="close()">
  <aside class="drawer" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
    <header class="drawer__header">...</header>
    <div class="drawer__body">...</div>        <!-- scrolls; flex column with gap md -->
    <footer class="drawer__footer">...</footer>
  </aside>
</div>
```
`.drawer--inline` removes the overlay behaviour (side column in a grid, Stitch roster layout on wide screens; show the overlay version below ~1280px).
`.drawer--contained` + `.drawer-backdrop--contained` (toggle `.is-open`): a side panel that is an inline column above 1024px and a slide-over *inside the
nearest positioned ancestor* below that (not the viewport) - e.g. the attendance panel of the boss view. Give the panel its own desktop width inside `@media (min-width: 1025px)`.
`.popover` + `.popover__item` = dropdown surface. Toast: use `ToastService` (shared-ui) - do not build your own.

### Legacy global classes (restyled, API unchanged)
`.btn .btn-primary .btn-ghost .btn-danger .btn-success .btn-share`, `.card`, `.badge(-gold|-blue|-green|-red|-purple|-muted)`,
`.form-input .form-label`, `.modal-*`, `.error-banner .success-banner`, `.loading-spinner`, `.cat-badge/.cat-*`, `.stat-badge`, `.weapon-badge`,
`.tier-badge/*`, `.tier-*_tier`, `.item-icon-sm(--split)`, `.confirm-item-*`/`.confirm-question`. Component SCSS in feature libs that defines the same class
names locally still wins (scoped), exactly as before.

### shared-ui components (restyled, inputs/outputs untouched)
`lib-toast` (top-right, tier-2, 2px tone bar, Material icons), `lib-feedback-button` (tier-2 trigger, gold icon, caps label; panel = Stitch modal look),
`lib-raider-card` (tier-1 row with class-coloured edge; edge/spec colour still inline), `lib-class-spec-selector` (class tinted via `--cls-color`),
`lib-wheel-of-fortune` (gold ring/pointer retuned to the new gold; segment colours unchanged).

## 4. Layout, spacing and responsive conventions

- **Scrolling:** `html/body` are `overflow:hidden`; the shell is `app-root` (flex column) = `.topbar` + optional `.mobile-nav-drawer` + `.app-main`
  (`flex:1; overflow-y:auto; min-height:0`). Pages scroll inside `.app-main`. A page that needs its own scroll panes (admin shell) must be `display:flex` /
  `min-height:0` all the way down and put `overflow:auto` on the pane; do not use `100vh` (use `height:100%` or flex). Do not change `.app-main`.
- **Rhythm:** card padding 12 (`--space-md`), gap between cards 12 mobile / 16 desktop (`--gutter(-desktop)`), section gap 32, page padding 12/16/24.
  Prefer `.stack`/`.row`/`.grid-*` and `gap` over margins.
- **Density:** controls are 32px (buttons/inputs), rows ~34-40px, text 13px. Label above a value = `.t-label-caps c-muted`.
- **Breakpoints (the ones the app already uses):** `<= 768px` = phone/tablet shell (hamburger menu, bottom nav, hide sidebar, `.hide-mobile`);
  `<= 640px` = small phone (headline-xl shrinks, `.table--stack`, 1-column grids, modal paddings shrink); `>= 641px` 2-column grids; `>= 1025px` desktop (3-4 column grids,
  desktop page padding); `>= 1280px` is where wide master/detail layouts (inline drawer) make sense. Use `max-width` queries to degrade, with those numbers; 480/560/600/860/900 appear in old code, do not add more.
- **Mobile rules:** touch targets: use `.btn`, `.icon-btn`, `.form-input` as-is (they grow on `pointer: coarse`); never rely on hover; make wide tables scroll or stack;
  tabs/segmented rows scroll horizontally (`.scroll-x.scroll-hidden`); modals are full width with 8-12px margin and scrollable body; drawers go 100% wide; the admin
  sidebar becomes `.bottom-nav`; keep all existing Dutch labels and mobile-only elements.
- **Focus:** global `:focus-visible` gold outline; fields use the 1px gold ring. Do not remove outlines. Inputs on touch use 16px.
- **Motion:** 120-180ms colour/background transitions, no bouncing. `prefers-reduced-motion` is respected globally.
- **Icons:** Material Symbols Outlined only (loaded in `index.html`; requires network, falls back to an empty 1em box offline). 16px in buttons/rows, 18px nav, 20px card titles.
  Emoji used as icons in old templates should become Material icons when you restyle that screen.

- **Locale:** the app registers the Dutch locale (`registerLocaleData(localeNl)`, `LOCALE_ID = 'nl'` in `main.ts`), so the Angular `date` pipe
  renders Dutch month/day names (`{{ d | date: 'd MMM y' }}` -> "21 okt 2026").

## 5. Do's and don'ts

Do
- Use tokens (`var(--...)`) and primitives; add component SCSS only for layout that is truly local.
- Use `surface-tier-2` for anything nested inside a card; `surface-base` for wells inside tier-2.
- Express state with tinted backgrounds (`-dim`) + coloured text, not with borders.
- Colour names by class (`.class-<slug>`), teams by `--team-*`, tiers by `--tier-*`; always add text/icon next to colour.
- Keep selectors tests rely on, signals, routes and Dutch copy.
- Check mobile (390px) and desktop with the screenshot harness; open `styleguide.html` for reference.

Don't
- Don't hard-code colours/px that exist as tokens; don't add Tailwind or new fonts.
- Don't use the legacy alias names in new/changed SCSS.
- Don't add a second `.btn-primary` next to another in the same section; don't invent new button/badge shapes.
- Don't use `.page-header`/`.empty-state`/`.form-group`/`.field` for the new primitives (they collide with local classes); use `.page-head`, `.empty-box`, `.form-field`.
- Don't put `display:flex` on `<td>`/`<tr>`; don't rely on `100vh`; don't change `.app-main`.
- Don't render Stitch elements that have no data behind them (see REWORK-PLAN feature matrix).

## 6. Deliberately NOT ported from Stitch

- Tailwind itself (CDN, `dark` class, arbitrary-value classes) and the three duplicate Tailwind configs; `tailwind-theme.json` Material roles that no screen uses
  (`tertiary*`, `secondary*`, `*-fixed*`, `inverse-*`, `surface-container-*`, `surface-tint`, `background`). Only `surface-bright`, `on-surface`, `outline*`, `error*` were kept.
- Stitch's globally hidden scrollbars (`::-webkit-scrollbar{display:none}`): the app keeps thin tonal scrollbars (`.scroll-hidden` hides them per element).
- The three different Stitch top bars/navs (planner: gold container pill + borders, admin: tier-2 pill, design-system: underline) - one shell variant was chosen; `.tabs` keeps the underline style.
- Elements without backend data: Ctrl+K search, "+ Add Raider", Discord identity bind, ilvl / attendance / Armory sync, instance lockout widgets, webhook centre toggles,
  Stitch nav entries Priority Matrices / Raider Attendance / WCL Sync (see REWORK-PLAN matrix). The top-bar team switcher (Crusaders/Templars) is not in the shell; it only exists in the admin shell today.
- The design-system page's interactive playground, token copy-to-clipboard and outline rail (documentation-only).
- Stitch's raid colour tokens (Amirdrassil/Aberrus/Vault); the app keeps its own `--raid-*`. The `header` Google-hosted logo image. Mock content and English copy.
- `font-variation-settings` axes beyond FILL (icon font is loaded with opsz 24, wght 400, FILL 0..1 only).
- Animated decorations (spinning "auto_mode" icon, pulsing glows, background military_tech watermark); `.dot--pulse` is the only pulse kept.
- Per-screen backdrops/blur on panels (only top bar and modal backdrops blur).

## 7. Requests for the foundation / known gaps

- Sticky table header: use `.table-wrap--scroll` (see Tables).
- No tooltip primitive (Stitch has none either; use `title`).
- `manifest.webmanifest` theme/background colour (#1a3a5c) was not touched (outside the owned files); `index.html` has `theme-color #0a0e17`.
- Fonts come from Google Fonts (the production build inlines the CSS; the font files themselves are not in the service-worker cache).
- Report anything you miss in your phase-2 final report instead of patching global files.
