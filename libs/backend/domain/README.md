# backend-domain

Pure domain layer — no NestJS modules, no TypeORM, no HTTP. Everything here can be tested without infrastructure.

## Contents

### `entities/`

| File                       | Exports                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `user.entity.ts`           | `User` — id, email, googleId, displayName, avatarUrl, roles, timestamps; `hasRole()`, `isAdmin()` |
| `raider-profile.entity.ts` | `RaiderProfile` — userId, characterName, realm, wowClass, spec, status; `isActive()`              |
| `loot.entity.ts`           | `Reservation`, `Assignment` — Assignment includes `isAcquired()`                                  |

### `ports/`

Repository and service interfaces. Infrastructure implements these; use cases depend on them via dependency injection tokens.

| File                          | Token                      | Key methods                                                                                               |
| ----------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `user.repository.ts`          | `USER_REPOSITORY`          | findById, findByGoogleId, findAll, save, updateRoles                                                      |
| `raider.repository.ts`        | `RAIDER_REPOSITORY`        | findAll, findById, findByUserId, save, update, delete                                                     |
| `raid-catalog.repository.ts`  | `RAID_CATALOG_REPOSITORY`  | findActiveSeason, findBossesBySeason, findItemsByBoss, upsertSeason, upsertBoss, upsertItem, clearCatalog |
| `reservation.repository.ts`   | `RESERVATION_REPOSITORY`   | findByRaider, findByRaiderAndCategory, findSuperRareByRaider, findExisting, save, delete                  |
| `assignment.repository.ts`    | `ASSIGNMENT_REPOSITORY`    | findByRaider, findByBossAndSeason, findAllBySeason, save, updateStatus                                    |
| `loot-query.repository.ts`    | `LOOT_QUERY_REPOSITORY`    | getBossLootView, getEligibleRaiders                                                                       |
| `season-config.repository.ts` | `SEASON_CONFIG_REPOSITORY` | findBySeasonId, findOrCreateDefault, update                                                               |
| `received-item.repository.ts` | `RECEIVED_ITEM_REPOSITORY` | findByRaider, findByRaiderAndItem, save                                                                   |
| `blizzard-api.port.ts`        | —                          | getJournalInstance, getJournalEncounter, getItem, getItemMediaUrl                                         |

### `ports/raid-catalog.types.ts`

Data-transfer types used as arguments to repository upsert methods: `UpsertSeasonData`, `UpsertBossData`, `UpsertItemData`.

## Rules

- Never import from `backend-application`, `backend-infrastructure`, or `backend-adapters`.
- Never import TypeORM, NestJS HTTP, or any framework library.
- May import from `libs/shared/domain`.
