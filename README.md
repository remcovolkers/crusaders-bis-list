# Crusaders BiS List

A loot-reservation and assignment tracker for a World of Warcraft guild. Raiders claim items from the current raid tier; officers assign loot and track who received what.

Built on an **Nx monorepo** with a NestJS backend, Angular 21 frontend, PostgreSQL (Supabase) and Google OAuth.

See [HOSTING.md](HOSTING.md) for deployment and environment-variable instructions.

---

## Table of Contents

1. [Project structure](#project-structure)
2. [Getting started](#getting-started)
3. [Architecture — hexagonal layers](#architecture--hexagonal-layers)
4. [Key conventions](#key-conventions)
5. [How to add a new raid season](#how-to-add-a-new-raid-season)
6. [Access levels](#access-levels)
7. [Admin panel](#admin-panel)
8. [Dev Panel](#dev-panel-dev-panel)
9. [Feedback system](#feedback-system)
10. [Database notes](#database-notes)
11. [Do's and don'ts](#dos-and-donts)

---

## Project structure

```
apps/
  crusaders-bis-list/         NestJS application (entry point, AppModule)

libs/
  shared/
    domain/                   Shared types and pure functions used by BOTH frontend and backend
      src/lib/enums.ts        ItemCategory, WowClass, WowSpec, WeaponType, canClassReserveItem, …
      src/lib/models.ts       IItem, IRaiderProfile, ISeasonConfig, …

  backend/
    domain/                   Domain entities, port interfaces (repositories), DTOs
    application/              Use cases + season configuration
      src/lib/use-cases/      One file per use case (sync, reserve, assign, …)
      src/lib/seasons/        ← Season-specific data (see "add a new season" below)
        season-definition.types.ts   Generic SeasonDefinition interface
        midnight-t35.season.ts       Tier 35 raids + tier token patterns
        active-season.ts             Single export: ACTIVE_SEASON (change this for T36)
    infrastructure/           TypeORM entities, repositories, Blizzard API client
    adapters/                 NestJS controllers + request/response DTOs

  frontend/
    auth/                     Guards (Auth/Guest/Admin/SuperUser/Profile), OnboardingComponent, auth state (NgRx)
    loot/                     Raider loot overview — catalog, reservations, received items
      src/lib/domain/         loot-ui.types.ts (frontend-only view models)
      src/lib/services/       raider-loot-state.service.ts (application-layer facade)
      src/lib/components/     raider-loot-overview, reserve-modal
    admin/                    Admin panel — user management, loot assignment, season config
    shared-ui/                Shared Angular components (ClassSpecSelector, …)

frontend/                     Angular app shell (routing, app component)
```

---

## Getting started

```bash
# Install dependencies
npm install

# Start the backend (NestJS, hot-reload)
npx nx serve crusaders-bis-list

# Start the frontend (Angular dev server)
npx nx serve frontend

# Run all linters
npx nx run-many --target=lint --all

# Build everything
npx nx run-many --target=build --all
```

Copy `.env.example` → `.env` and fill in the values before starting the backend.
All required variables are documented in [HOSTING.md](HOSTING.md).

---

## Architecture — hexagonal layers

Dependency flow (inner layers never import outer ones):

```
shared/domain
    ↓
backend/domain          (entities, port interfaces)
    ↓
backend/infrastructure  (TypeORM, Blizzard API impl.)
    ↓
backend/adapters        (NestJS controllers)
    ↓
apps/crusaders-bis-list (AppModule glues everything)
```

### Guiding principles

- **Domain logic lives in `shared/domain` or `backend/domain`**, never in controllers or components.
- **Controllers receive a request, delegate to a use case, return a response** — no business logic.
- **Angular components are thin shells** — they inject the state service and wire events to methods.
- **`canClassReserveItem`** is the single source of truth for item eligibility. It lives in `shared/domain/enums.ts` so both backend reservation validation and frontend filtering use the exact same rules.

---

## Key conventions

### Armor storage model

All armor items from Blizzard are stored as `category = 'other'` with a separate `armor_type` column (`cloth` / `leather` / `mail` / `plate`).
`canClassReserveItem` compares `CLASS_ARMOR_TYPE[wowClass]` against `item.armorType`, **not** `item.category`.

### Angular signals

All Angular state uses `signal()` / `computed()` — no `BehaviorSubject`, no `async` pipe on state. Component inputs and outputs use `input()` / `output()` — not `@Input()` / `@Output()`.

---

## How to add a new raid season

A new WoW raid tier requires changes in exactly **one folder**: `libs/backend/application/src/lib/seasons/`.

### Step 1 — Create a season file

Copy `midnight-t35.season.ts` and rename it, e.g. `midnight-t36.season.ts`.

```ts
export const MIDNIGHT_T36_SEASON: SeasonDefinition = {
  slug: 'midnight-s2-t36', // must be unique in the DB
  name: 'Midnight — Season 2 (Tier 36)',

  raids: [
    { instanceId: 9999, name: 'New Raid Name', accentColor: '#ff0000' },
    // add fallbackEncounterIds if the instance endpoint is not yet live
  ],

  tierTokenPatterns: [
    { match: /new token name/i, slot: 'Tier: Chest' },
    // one entry per unique tier token that drops in this season
  ],
};
```

**Where do I find the instance and encounter IDs?**
Use the [Blizzard developer portal](https://develop.battle.net/documentation/world-of-warcraft/game-data-apis) or browse `https://eu.api.blizzard.com/data/wow/journal-instance/{id}?namespace=static-eu&locale=en_US`.

**Where do I find the tier set ids?** (`tierSetIds`, optional) The Blizzard item-set index (`/data/wow/item-set/index`, static namespace) lists every set; a class tier set is one set per class with 5 pieces (head, shoulders, chest, hands, legs), so a season has about 13 consecutive ids (Midnight S2: 2055-2067). During the catalog sync each tier token is linked to the set piece it gives per class (`items.tier_set_items`, JSON): the token's own `playable_classes` say which classes may use it and the slot of the token ("Tier: Head") picks the piece. The raider screens then show the set piece of their class (name + icon, "via <token>") while the reservation stays on the token, and the gear sync counts a worn set piece for a reserved token. Without `tierSetIds` (or when a class has no piece yet) the tokens are shown as they are.

**Where do I find the token names?**
Log into the PTR/beta, open the journal, or search Wowhead for the tier set tokens for the new raid.

### Step 2 — Point `active-season.ts` at the new season

```ts
// libs/backend/application/src/lib/seasons/active-season.ts
import { MIDNIGHT_T36_SEASON } from './midnight-t36.season';

export const ACTIVE_SEASON: SeasonDefinition = MIDNIGHT_T36_SEASON;
```

### Step 3 — Trigger a Blizzard sync

After deploying, go to the **Dev Panel → Reset & sync catalogus**. This will:

1. Create or update the season row in the DB (using the `slug` as the unique key).
2. Fetch all encounters and items from the Blizzard API.
3. Set the new season as `isActive = true`.

The old season's data is preserved in the database; only `isActive` changes on reset.

### Step 4 — Season rules for gear and bonus rolls

After the sync, open **Admin → Seizoen config** (per team) and fill in **Gear-tiers en bonusrol**: the item level from which gear is certainly Myth, the ambiguous band (Hero 6/6 vs Myth 2/6) and whether the season has bonus rolls. These numbers differ every season. You can also put defaults in the season file (`trackItemLevels`) so they are filled in automatically.

---

## Admin panel

Accessible at `/admin` (requires an account with the `admin` role).

| Section         | What it does                                                                         |
| --------------- | ------------------------------------------------------------------------------------ |
| Loot toewijzing | Per-boss loot view; assign items to raiders with Champion/Heroic/Mythic tier         |
| Admin Panel     | User management (modal) + per-category reservation limits + super-rare flag per item |

The **Admin Panel** page (`/admin/admin-panel`) embeds user management directly above the season config.
Clicking a user opens a centred modal with role management, profile reset, and reservation overview.

**Blizzard sync** (reset catalog, wipe orphaned items) lives in the **Dev Panel** — superuser only.

---

## Access levels

| Role      | Email / condition          | Access                                             |
| --------- | -------------------------- | -------------------------------------------------- |
| Raider    | any authenticated user     | `/loot`                                            |
| Admin     | `ADMIN_EMAILS` in `.env`   | `/loot`, `/admin/*`                                |
| Superuser | `remco.volkers1@gmail.com` | all of the above + `/dev-panel`, `/feedback-inbox` |

Guards: `AuthGuard` (logged in), `ProfileGuard` (profile exists), `AdminGuard` (admin role), `SuperUserGuard` (superuser email), `GuestGuard` (redirect `/auth` → `/loot` when already logged in).

---

## Dev Panel (`/dev-panel`)

Superuser-only. Contains:

- **Blizzard sync** — sync catalog from Blizzard API
- **Reset & sync** — wipe and re-fetch the full catalog
- **Wipe orphaned items** — remove items no longer returned by the API

---

## Feedback system

A floating button (bottom-right) appears on every page except `/dev-panel` and `/feedback-inbox`.
It animates in on each page navigation with a label and a glow effect.

Submissions are stored in the `feedback` table with `resolved` / `resolved_at` columns.
The inbox at `/feedback-inbox` (superuser only) shows open items as a checkbox todo-list and resolved items below a divider.

---

## Chase items

The raider loot screen lists **every gear item the raider's class/spec can use**, not only reservable ones (armor usually has no limit). Items that cannot be reserved (category limit `0`, or the limit is reached) get a **"Zet op chase-lijst"** button instead of "Reserveer". A *chase item* is a non-binding "I want this" marker:

- stored in `raider_chase_items` (`RaiderChaseItemOrmEntity`, migration `AddRaiderChaseItems`), unique per raider + item + season;
- no limits, no tiers, never counts as a reservation and gives no priority; reserving an item removes its chase entry;
- each chase has **methods** (`ChaseMethod`: `boss_drop` and/or `bonus_roll`, column `methods`, comma separated): a bonus roll is a personal roll after a kill that can give an item of the boss' loot table on a higher difficulty (Heroic kill, Myth item). The raider screen offers two independent toggle buttons, *Chase met bonusrol* and *Chase voor bossdrop*: both can be on ("it does not matter how I get it"); switching the last one off removes the chase. The character pane shows a dice on bonus-roll items so the raider can plan the gearing. A chase is done (removed by the gear sync) as soon as the item is worn at the best item level of **any** of its methods. Officers see bonus-roll chasers in a separate, non-assignable *Bonusrol* group;
- API: `GET/POST /raider/chase-items` (POST takes `methods`: the full set, an empty list removes the chase), `DELETE /raider/chase-items/:id`, `POST /raider/chase-items/:id/catalyse` (use cases in `chase-item.use-case.ts` and `bis-mark.use-case.ts`);
- the admin boss-loot view (`GET /admin/boss/:bossId/loot/:seasonId`) returns chasers as `IEligibleRaider` with `isChase: true`; the "Toon ook chase-items" switch in *Loot toewijzen* filters them client-side. Chasers never take part in the Wheel of Fortune;
- the raider screen has a "Toon alleen reserveerbare items" switch (off by default).

The new table is created by the `AddRaiderChaseItems` migration, which runs automatically when the backend starts (`migrationsRun: true`).

### Best-in-slot marks and catalyst

`raider_bis_marks` (`RaiderBisMarkOrmEntity`, one row per raider + slot) holds the raider's own "this worn item is BiS" marks: crafted pieces, dungeon items that are not in the loot list (`PUT/DELETE /raider/bis-marks/:slot`, reason `manual`) and catalysed tier pieces (reason `catalyst`, `note` = the chased item). A mark is tied to the worn item id and is dropped by the gear sync when another item is worn in that slot. **Catalyst** (`CatalyseChaseItemUseCase`): the chased item was converted into the tier piece of its slot (head/shoulders/chest/hands/legs, `CATALYST_SLOTS`), which is a different item than the chased one: the tier piece worn in that slot is marked `catalyst` and the chase is removed. The chased item itself is consumed by the catalyst and is deliberately **not** recorded as received: a chased item only counts as owned (BiS, "up to 344") when that exact item is worn at its best item level, or when it is reserved and received on Myth (the state service ignores a received row for an unreserved item). In the pane a loot-list item worn at `max_item_level` or higher is BiS by itself (`bisInfoFor` in the state service).

### Chase next to a reservation

A reserved item cannot be chased for the boss drop (the reservation is that: `SetChaseItemUseCase` refuses it), but a **bonus roll** chase may sit next to a reservation (get it sooner, or upgrade it once it is on Myth). Reserving an item removes a boss-drop chase and keeps a bonus-roll chase (`ReserveItemUseCase`; a chase for both becomes bonus-roll only). On the loot card the bonus roll switch is always there (when the season has bonus rolls, bottom left); the boss-drop switch takes the place of the reserve button (bottom right) when the item cannot be reserved (limit reached / category off). Otherwise the reserve window offers *Chase voor bossdrop* as the alternative (`chaseInstead` output). The Gearing plan lists reserved items with a bonus roll chase as *Reserved + bonus roll*.

### Loot card layout

`LootItemCardComponent` is a grid of **fixed rows** (identity, status, reserved tiers, upgrade note, and a bottom row of two cells: bonus roll chase on the left, reserve / adjust / boss-drop chase on the right; see `grid-template-rows` in its scss), so every element has the same place on every card whatever the state, empty rows stay empty and the cards of a boss line up. Names, badges and notes are single lines with an ellipsis (full text in the title / tooltip). Add new card elements to one of these slots instead of letting the card grow.

### Item tooltips

The catalog sync stores the readable parts of Blizzard's item tooltip per item (`items.tooltip`, JSON, `buildItemTooltip` in `item-tooltip.ts`): quality, binding, type, stat **names**, "Use:" / "Equip:" effects and, for tier set pieces, the set name and bonuses (taken from the item-set endpoint). Stat **values** are left out on purpose: the Blizzard item API gives them for the base item level (219), not for the Hero / Myth track an item is received on, so they would be wrong. `ItemTooltipDirective` (shared-ui) shows it on hover / focus / tap over an item icon (`[libItemTooltip]`, `libItemTooltipName`, `libItemTooltipVia`); it is on the loot cards, the character pane, the Gearing plan and the admin boss view. A tier token that is shown as the set piece of the raider's class shows that piece's tooltip. Items synced before the `AddItemTooltip` migration get a tooltip on the next catalog sync; until then they simply have no hover text.

### In-app user guide

`/help` (`apps/crusaders-bis-list-frontend/src/app/help/`) shows `HOW-TO-USE-THIS-APP-GUIDE.md` inside the app, so raiders do not have to leave for GitHub. The Markdown file stays the single source of truth: the build copies it and the screenshots in `docs/how-to/` to `/assets/help/` (see `assets` and the extra `inputs` of the `build` target in `project.json`), and `HelpComponent` fetches and renders it with `marked` (lazy, only loaded on that page; `guide-renderer.ts` adds GitHub style heading ids, the table of contents, in-app image paths and table styling). The page has a sticky table of contents that follows the reading position (a fold-out on phones) and zoomable screenshots. Link to a part of it from anywhere with `routerLink="/help" fragment="<heading id>"` (the id is the GitHub style slug of the heading, e.g. `gearing-plan-wat-moet-je-waar-doen`): the Mijn Loot filter bar, the Gearing plan and the season config already do. Renaming a heading changes its id, so update the links that point to it. Tests: `guide-renderer.spec.ts` (the app's own `test` target did not run before this change, either; run it with plain vitest).

### Gearing plan

Next to the character pane, `LootPlanComponent` shows what to do where: the raider's open items grouped per boss (in boss order) and per action: *Reserved*, *Drop*, *Bonus roll*, *Drop + bonus roll* and *Upgrade* (a best-in-slot item that a bonus roll can still upgrade, e.g. → 344). The rules (which action an item gets, grouping, ordering, totals) are pure functions in `libs/frontend/loot/src/lib/ui-types/gearing-plan.ts` with tests; items with nothing left to do are left out. Each plan item also carries a **difficulty badge** (`planDifficultyOf`): **H+** = Heroic or Mythic helps, **M** = only Mythic helps (legend above the list). It comes from `RaiderLootStateService.difficultyNeeds`, which uses `minimumDifficulty` in `item-level-caps.ts`: the lowest difficulty whose result (drop: Heroic → `heroMaxItemLevel`, Mythic → `maxItemLevel`; bonus roll: Heroic → `maxItemLevel`, i.e. the Mythic variant, Mythic → the boss's best obtainable level, e.g. 344) beats the worn item level. So with a 341 piece only a Mythic bonus roll helps, with a Normal/Heroic piece a Heroic bonus roll already does. Assumptions: Normal is not modelled, and the Hero max level is the season's `ambiguousItemLevelFrom` (321). A **catalysed** item counts as what the raider has of the chased item: `_itemFacts` falls back to the worn piece of the `catalyst` bis mark whose `note` is the item name, so a bonus roll chase on a catalysed 334 piece is judged against 334 (only a Mythic bonus roll on a 344 boss helps, shown as **M**). Items chased both ways show the lowest difficulty of the two; the tooltip lists both. The panel takes the height of the pane and scrolls inside when the plan is long, so the character page (pane + plan) keeps fitting a 1080p screen at 100% zoom; loot cards keep a quiet idle state (dashed chase switches) and a clear on state (solid blue switch with a check, plus a blue "Chase" pill and an "Equipped" badge in the badge row); the character view widens the page (`.loot-page--wide`) to make room, and below 1250px the plan stacks under the pane.

### Character pane

The loot screen has an **Itemlijst | Character** switch. *Character* draws the raider's reserved and chased items on a World of Warcraft style paperdoll (`LootPaperdollComponent`). The item → slot mapping and the distribution over the slots (two rings, two trinkets, weapons) are pure functions in `libs/frontend/loot/src/lib/ui-types/paperdoll.ts`. The picture in the middle is the character's armory render: `GET /raider/character-media` asks Blizzard's character-media endpoint (`profile-<region>` namespace, client-credentials token, cached in memory for an hour) and returns `{ url: string | null }`. Without a public profile or realm the pane shows a placeholder.

### Equipped gear sync

The worn gear of every raider is read from the Blizzard armory (`GET /profile/wow/character/{realm}/{name}/equipment`, `profile-<region>` namespace, client-credentials token; the character must be public and `realm` filled in) and stored in `raider_equipped_items` (`RaiderEquippedItemOrmEntity`, migration `AddRaiderEquippedItems`).

- `SyncRaiderEquipmentUseCase` (`equipment-sync.use-case.ts`) fetches and stores the gear, then **reconciles** it with the raider's lists: a reserved or chased item that is worn at a tier raises the "already have" tier (`raider_received_items`, never lowers it); a chased item worn at Myth is removed from the chase list. It never creates reservations or chases. Unit tests: `apps/crusaders-bis-list-backend/src/app/equipment-sync.use-case.spec.ts`.
- The tier is read from the **item level**, because Blizzard's `name_description` ("Heroic", "Mythic") is the difficulty an item dropped on, not the upgrade track it is on now (a Heroic drop upgraded to Myth level still says "Heroic"). `equippedItemTier` in `libs/shared/domain/src/lib/constants/equipment.ts` applies the per-season caps `trackItemLevels` of the `SeasonDefinition` (Midnight S2: `mythFrom: 322`, `ambiguousFrom: 321`): from 322 up = Myth; 321 (Hero 6/6 or Myth 2/6) = Myth only when the description says Mythic, else Hero; below that only "Heroic" items count (Hero). Champion, crafted and other items have no tier and change nothing. **The caps are season rules:** they live in the season config (`season_configs.myth_item_level_from` / `ambiguous_item_level_from`, edited per team on the admin *Seizoen config* page, block *Gear-tiers en bonusrol*). A value that was never set falls back to `trackItemLevels` of the `SeasonDefinition` in code (`seasons/season-rules.ts`), so a new season only needs its numbers entered once they are known. `season_configs.bonus_roll_enabled` switches bonus rolls (and the *Chase met bonusrol* button) per season/team.

**Best in slot is season dependent.** "BiS" is not the Myth tier but *having the item at the best item level of a boss drop*: `max_item_level` (e.g. 334, upgrades included). A bonus roll that gives more on some bosses is an **upgrade** of an item that is already BiS: `bonus_roll_item_levels` (per Blizzard encounter id, e.g. `{ 2883: 344, 2895: 344 }` for The Coiled Altar and Ula'tek) drives the "up to 344" chase. Same pattern as the other season rules: stored per season/team in `season_configs`, edited on the *Seizoen config* page, with `itemLevelCaps` of the `SeasonDefinition` as default (`null` = never set; `{}` = deliberately no boss gives more). The pure rules (`isBestInSlot`, `bonusRollUpgradeTo`, `bestObtainableItemLevel`) are in `libs/shared/domain/src/lib/constants/item-level-caps.ts`; the frontend uses them for the "BiS in bezit" / "Myth in bezit · tot 344 mogelijk" states and the backend for chase completion. A BiS item that a bonus roll can still upgrade can be chased with `bonus_roll` even while reserved (`SetChaseItemUseCase`); without caps the old rule (Myth tier = BiS) applies. Worn item levels come from the armory sync; if unknown, a received Myth drop counts as `max_item_level`. Items are matched on `IItem.wowItemId` (a worn secondary form of a merged item counts for its primary).
- Triggers: `POST /raider/equipment/sync` (the loot page calls it on load; skipped if synced less than 10 minutes ago), `POST /admin/equipment/sync` (button *Gear synchroniseren* in *Loot toewijzen*: whole team, forced) and `EquipmentSyncScheduler` in the API app (every 30 minutes in production; `EQUIPMENT_SYNC_INTERVAL_MINUTES`, `0` disables, off outside production unless set). Raiders are synced one after the other.
- Failures (private or unknown character, API down) keep the stored data and are retried after 5 minutes.

The character pane (English texts on purpose, standard in-game layout incl. empty shirt/tabard placeholders) shows what the character wears: a slot can hold the worn item plus reserved / chased candidates side by side (reserved/BiS have a gold background, chase blue), and a reserved / chased item that is the worn item is merged into one entry. The layout is meant to fit a 1080p screen at 100% zoom without scrolling (compact slots, items side by side).

## Database notes

- **`synchronize: true`** — only active when `NODE_ENV !== 'production'`. Never enable in prod.
- **Migrations** — TypeORM migrations (`libs/backend/infrastructure/src/lib/database/migrations`, registered in `index.ts`) run automatically on backend startup (`migrationsRun: true`). Add new ones to `MIGRATIONS`; no manual SQL needed.
- **Upsert behaviour** — `upsertItem` uses `wowItemId` as the unique key. Re-running a sync never duplicates items.
- **`isSuperRare`** — admin-only flag; the sync deliberately never overwrites a `true` value back to `false`.
- **`other_limit` column** — maps to `armorLimit` in TypeScript. The DB column name is a legacy artefact; do not rename it without a migration.

---

## Do's and don'ts

### Do

- Put **pure domain logic** (item eligibility, class rules) in `libs/shared/domain/enums.ts` — both front and back will benefit.
- Keep **use cases thin**: one public `execute()` method, delegate persistence to repositories.
- Use the **`ProfileGuard`** on every route that requires an active raider profile.
- Add a `fallbackEncounterIds` array to a raid definition when its Blizzard instance endpoint is not yet live.
- Write the **DB column name** explicitly with `@Column({ name: 'snake_case' })` whenever the TS property name differs.

### Don't

- Don't add business logic to NestJS controllers — they should only parse the request and call a use case.
- Don't import `frontend-loot` or other frontend libs from the backend (or vice versa). `shared/domain` is the only shared boundary.
- Don't use `@Input()` / `@Output()` decorators — use `input()` / `output()` signals.
- Don't use `async` pipe for NgRx state — use `toSignal()` instead.
- Don't store session-tier raid data (raid names, instance IDs, token patterns) anywhere other than the `seasons/` folder.
- Don't enable `synchronize: true` in a production environment — it will auto-drop columns.
- Don't put T36 (or later) data in `midnight-t35.season.ts` — create a new season file.
