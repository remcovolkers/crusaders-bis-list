# backend-infrastructure

Persistence and external-API layer. Implements all port interfaces from `backend-domain` using TypeORM and the Blizzard Battle.net API.

## Database entities (`database/entities/`)

| ORM entity                    | Table                   | Notes                                                                                      |
| ----------------------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| `UserOrmEntity`               | `users`                 | `roles` stored as `simple-array` column                                                    |
| `RaiderProfileOrmEntity`      | `raider_profiles`       | One-to-one with `users`; `wow_class` values include spaces (`'Death Knight'`)              |
| `RaidSeasonOrmEntity`         | `raid_seasons`          | Unique on `slug`; `isActive` flag                                                          |
| `BossOrmEntity`               | `bosses`                | FK to `raid_seasons`; `wowEncounterId` is unique                                           |
| `ItemOrmEntity`               | `items`                 | FK to `bosses`; unique on `wowItemId`; has `armor_type` and `weapon_type` nullable columns |
| `ReservationOrmEntity`        | `reservations`          | Unique constraint on `(raiderId, itemId, raidSeasonId)`                                    |
| `AssignmentOrmEntity`         | `assignments`           | Tracks loot assignments with status                                                        |
| `SeasonConfigOrmEntity`       | `season_config`         | Per-season limits (trinket, weapon, jewelry, `other_limit` = armorLimit, super-rare)       |
| `RaiderReceivedItemOrmEntity` | `raider_received_items` | Tracks items actually received during raids                                                |

> **Note:** the DB column `other_limit` maps to `armorLimit` in TypeScript — do not rename without a migration.

## Repositories (`database/repositories/`)

Each file implements the corresponding port from `backend-domain`.

| File                          | Implements                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `user.repository.ts`          | `IUserRepository`                                                                    |
| `raider.repository.ts`        | `IRaiderRepository`                                                                  |
| `raid-catalog.repository.ts`  | `IRaidCatalogRepository` — upserts use `wowItemId` / `wowEncounterId` as unique keys |
| `loot.repository.ts`          | `IReservationRepository` + `IAssignmentRepository`                                   |
| `loot-query.repository.ts`    | `ILootQueryRepository` — complex JOIN queries for boss loot views                    |
| `season-config.repository.ts` | `ISeasonConfigRepository`                                                            |
| `received-item.repository.ts` | `IReceivedItemRepository`                                                            |

## Blizzard API client (`blizzard/`)

`blizzard-api.service.ts` implements `IBlizzardApiService`.

- Handles OAuth2 client-credentials token refresh automatically.
- Uses the `BLIZZARD_REGION` env variable to select the correct regional endpoint (default: `eu`).
- Methods: `getJournalInstance()`, `getJournalEncounter()`, `getItem()`, `getItemMediaUrl()`.

## Module wiring

`BackendInfrastructureModule` registers TypeORM entities and binds domain tokens to concrete classes:

```ts
{ provide: RAID_CATALOG_REPOSITORY, useClass: RaidCatalogRepository },
{ provide: RESERVATION_REPOSITORY,  useClass: ReservationRepository },
// … etc.
```

## TypeORM `synchronize` flag

`synchronize: true` is only enabled when `NODE_ENV !== 'production'`. In production, apply schema changes manually via the Supabase SQL editor.

## Rules

- May import from `backend-domain` and `shared/domain`.
- Never import from `backend-application` or `backend-adapters`.
- Never put business logic here — repositories only translate between domain objects and ORM entities.
