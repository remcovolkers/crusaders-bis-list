# backend-adapters

HTTP layer — NestJS controllers, Passport authentication strategies, guards, and request/response DTOs. No business logic lives here; controllers parse requests and delegate to use cases.

## Controllers

### `AuthController` — `/auth`

| Method | Endpoint                | Description                                                |
| ------ | ----------------------- | ---------------------------------------------------------- |
| GET    | `/auth/google`          | Redirects to Google OAuth consent screen                   |
| GET    | `/auth/google/callback` | Receives OAuth callback; issues JWT; redirects to frontend |
| POST   | `/auth/logout`          | Clears session                                             |
| POST   | `/auth/refresh`         | Issues a new JWT from a valid refresh mechanism            |

### `UserManagementController` — `/admin/users`

| Method | Endpoint         | Guard | Description                                   |
| ------ | ---------------- | ----- | --------------------------------------------- |
| PATCH  | `/:userId/roles` | Admin | Add/remove roles via `ManageUserRolesUseCase` |

### `RaiderController` — `/raider`

| Method | Endpoint                     | Description                                                                 |
| ------ | ---------------------------- | --------------------------------------------------------------------------- |
| GET    | `/raider/my-profile`         | Returns the authenticated user's raider profile (null if none)              |
| POST   | `/raider/profile`            | Creates a new raider profile                                                |
| PUT    | `/raider/profile`            | Updates an existing raider profile                                          |
| GET    | `/raider/catalog`            | Returns the active season with bosses and items via `GetRaidCatalogUseCase` |
| GET    | `/raider/reservations`       | Returns own reservations                                                    |
| POST   | `/raider/reservations`       | Creates a reservation via `ReserveItemUseCase`                              |
| DELETE | `/raider/reservations/:id`   | Cancels a reservation via `CancelReservationUseCase`                        |
| GET    | `/raider/received-items`     | Returns own received items                                                  |
| POST   | `/raider/received-items`     | Marks an item as received                                                   |
| DELETE | `/raider/received-items/:id` | Removes a received-item record                                              |

### `AdminController` — `/admin`

| Method | Endpoint                          | Description                                                     |
| ------ | --------------------------------- | --------------------------------------------------------------- |
| GET    | `/admin/raiders`                  | Lists all raider profiles with their reservations               |
| DELETE | `/admin/raiders/:raiderId`        | Resets (deletes) a raider's profile; user account is preserved  |
| POST   | `/admin/assignments`              | Assigns a dropped item to a raider via `AssignLootUseCase`      |
| PATCH  | `/admin/assignments/:id`          | Updates assignment status via `UpdateAssignmentStatusUseCase`   |
| DELETE | `/admin/assignments/:id`          | Cancels an assignment                                           |
| GET    | `/admin/boss/:bossId/loot`        | Returns boss loot view via `GetBossLootViewUseCase`             |
| GET    | `/admin/season-config`            | Returns current season limits                                   |
| PATCH  | `/admin/season-config`            | Updates season limits via `UpdateSeasonConfigUseCase`           |
| PATCH  | `/admin/items/:itemId/super-rare` | Toggles super-rare flag via `UpdateItemSuperRareUseCase`        |
| POST   | `/admin/sync`                     | Runs `SyncRaidCatalogFromBlizzardUseCase`                       |
| POST   | `/admin/sync/reset`               | Runs `ResetCatalogAndSyncUseCase` (full catalog wipe + re-sync) |

## Authentication

### Strategies (`auth/`)

| File                 | Description                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `google.strategy.ts` | Passport OAuth2 — exchanges Google profile for a local `User` via `FindOrCreateUserUseCase` |
| `jwt.strategy.ts`    | Passport JWT — validates Bearer token; extracts `JwtPayload` (`sub`, `email`, `roles`)      |

### Guards (`guards/`)

| Guard          | Usage                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| `JwtAuthGuard` | Applied to every protected endpoint; validates the Bearer JWT                     |
| `RolesGuard`   | Reads `@Roles(UserRole.Admin)` metadata; rejects requests with insufficient roles |

## DTOs (`controllers/dto/`)

| File            | Exports                                                              |
| --------------- | -------------------------------------------------------------------- |
| `raider.dto.ts` | `ReserveItemDto`, `CreateRaiderProfileDto`, `UpdateRaiderProfileDto` |
| `admin.dto.ts`  | `AssignLootDto` (with enum + UUID validators)                        |

## Rules

- Controllers must not contain business logic — delegate everything to a use case.
- May import from `backend-application` and `backend-domain`.
- Never import from `backend-infrastructure` directly.
- DTOs are the only place where `class-validator` decorators belong.
