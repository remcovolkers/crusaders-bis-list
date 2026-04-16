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

## Database notes

- **`synchronize: true`** — only active when `NODE_ENV !== 'production'`. Never enable in prod.
- **No migration framework** — schema changes in production are applied as raw SQL via the Supabase dashboard.
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
