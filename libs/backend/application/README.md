# backend-application

Use-case layer — all business logic lives here. Each use case has one public `execute()` method and depends only on port interfaces from `backend-domain`.

## Use cases

### Auth / users

| Class                     | Description                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `FindOrCreateUserUseCase` | Authenticates a Google profile; creates a new user on first login; auto-grants admin role if email is in config |
| `ManageUserRolesUseCase`  | Adds or removes roles from a user account                                                                       |

### Raider profiles

| Class                                           | Description                                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| _(via RaiderRepository, no dedicated use case)_ | Profile creation/update is handled directly in the adapters layer via the repository. Use cases exist for querying. |

### Reservations

| Class                             | Description                                                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `ReserveItemUseCase`              | Validates the item exists; checks per-category reservation limits from SeasonConfig; enforces super-rare cap; persists the reservation |
| `CancelReservationUseCase`        | Deletes a reservation by id, checking ownership                                                                                        |
| `GetAllRaiderReservationsUseCase` | Returns a full reservation summary for all active raiders in the current season                                                        |

### Loot assignment (admin)

| Class                           | Description                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `AssignLootUseCase`             | Assigns a dropped item to a raider with a loot tier (Champion / Heroic / Mythic) |
| `UpdateAssignmentStatusUseCase` | Marks an assignment as acquired or cancelled                                     |
| `GetBossLootViewUseCase`        | Retrieves all items for a boss with their current assignment state               |

### Raid catalog

| Class                                | Description                                                                                                                                                                |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GetRaidCatalogUseCase`              | Returns the active season with all its bosses and items                                                                                                                    |
| `SyncRaidCatalogFromBlizzardUseCase` | Fetches encounters and items from the Blizzard API; maps Blizzard subclass IDs to `WeaponType` / `ItemCategory`; detects tier tokens via `ACTIVE_SEASON.tierTokenPatterns` |
| `ResetCatalogAndSyncUseCase`         | Clears the catalog (preserving item UUIDs) then re-runs a full sync                                                                                                        |

### Season configuration

| Class                        | Description                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `GetSeasonConfigUseCase`     | Returns (or lazily creates) the per-category limits for the active season                       |
| `UpdateSeasonConfigUseCase`  | Persists updated limits (trinkets, weapons, jewelry, armor, super-rare cap)                     |
| `UpdateItemSuperRareUseCase` | Toggles the `isSuperRare` flag on an item; sync never overwrites a `true` value back to `false` |

## Season definitions — `seasons/`

All raid-tier-specific data is isolated here so the rest of the codebase stays generic.

| File                         | Description                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `season-definition.types.ts` | `RaidDefinition`, `TierTokenPattern`, `SeasonDefinition` interfaces            |
| `midnight-t35.season.ts`     | Midnight Season 1 (T35) — 3 raids, encounter IDs, tier token name patterns     |
| `active-season.ts`           | `export const ACTIVE_SEASON = ...` — change this single import to activate T36 |

See the root [README](../../../../README.md#how-to-add-a-new-raid-season) for step-by-step instructions on adding a new season.

## Rules

- May import from `backend-domain` and `shared/domain` only.
- Never import from `backend-infrastructure` or `backend-adapters`.
- Never import TypeORM decorators or NestJS HTTP utilities.
