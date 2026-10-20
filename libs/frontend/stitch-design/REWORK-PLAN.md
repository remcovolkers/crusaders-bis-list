# Rework plan: Stitch design -> Angular app

Branch: `develop`. Feature work happens on `rework/<area>` branches (one git worktree per agent) that are merged into `develop`.

## Decisions

- **SCSS + CSS variables**, no Tailwind. Stitch tokens are ported into `apps/crusaders-bis-list-frontend/src/styles.scss`
  (see [design-system/tokens.md](design-system/tokens.md)). Existing tokens already match most Stitch values.
- **Whole app** gets the Stitch look. Screens without a Stitch design (loot overview, onboarding, ...) extend the same
  language using the design system, they do not invent a new one.
- **Mobile stays.** Stitch is desktop-only; the existing mobile patterns (hamburger menu, admin bottom-nav, stacked
  layouts) are kept and restyled.
- **UI stays Dutch.** Stitch copy is English; keep the app's Dutch labels.
- **No fake UI.** A Stitch element without data/backend behind it is omitted (see matrix). Nothing is added as a dead button.
- **Logic is out of scope.** Templates + SCSS only. No changes to services, signals, state, routing or backend,
  except the small additions explicitly listed as "cheap" below, and only when the area owner says so.

## Feature matrix (what Stitch shows vs. what the app can do today)

Legend: ✅ data/behaviour exists · 🟡 derivable with little work (frontend only) · ❌ not available -> omit

### Admin: roster & user drawer (`admin-user-management`, `admin-user-detail-modal`)
| Stitch element | Status | Source / note |
|---|---|---|
| Name + realm, class/spec colour | ✅ | `IRaiderProfile` (characterName, realm, wowClass, spec) |
| Team badge (Crusaders / Templars) | ✅ | `IUser.team` |
| Role icon (tank/healer/dps) | 🟡 | derive from spec (spec sets already exist in `composition-analysis`; extract to shared-domain) |
| Status (active/inactive/trial) | ✅ | `RaiderStatus` |
| Reserves count / slots used | ✅ | `IUser.reservations` vs `ISeasonConfig` limits |
| Super-rare reserved | ✅ | reservations of items with `isSuperRare` |
| Search / team filter / role filter / class filter / pagination | 🟡 | client-side over the loaded list |
| Export CSV | 🟡 | client-side from the loaded list |
| Role & privilege matrix, team assignment | ✅ | `POST admin/users/:id/roles`, `.../team` |
| Soft reserves review + remove | ✅ | `GET admin/reservations`, `DELETE admin/reservations/:id` |
| Loot history received + remove | ✅ | `IReceivedItem`, `DELETE admin/raiders/:id/received-items/:itemId` |
| Delete user / unlink BNet | ✅ | `DELETE admin/users/:id`, `.../bnet` |
| BNet link status (replaces "Discord bind") | ✅ | `IUser.battletag` |
| Discord identity bind | ❌ | no Discord id stored |
| ilvl column, Armory sync timestamp, Attendance % | ❌ | not stored |
| "+ Add Raider" | ❌ | users sign up via Google/onboarding |
| Ctrl+K global search | ❌ | omit |

### Admin: season config (`admin-season-config`)
| Stitch element | Status | Source / note |
|---|---|---|
| Season name / active flag / start date | ✅ | `IRaidSeason` |
| Per-team rulesets (trinket, weapon, jewelry, armor, super-rare limits) | ✅ | `ISeasonConfig`, `PUT admin/season-config/:seasonId` |
| Reset all reservations (as danger-zone action) | ✅ | `POST admin/reservations/reset-all` |
| Catalog sync | ✅ | `POST admin/sync`, `reset-and-sync` |
| Manual lockout override, "8/8 M" instance lock progress | ❌ | no lockout concept |
| Automated Discord webhook centre (toggles) | ❌ | only per-raid-plan Discord notify exists |

### Admin: other (no Stitch screen, extend the language)
Boss view (loot assignment + dice/roll), reservation management, audit log (✅ `GET admin/audit-log`), feedback inbox, dev panel, roll spectator.
Stitch nav items "Priority Matrices", "Raider Attendance", "WCL Sync": ❌ omit. "Loot Council Audit" = existing audit-log.

### Raid planner (`raid-plan-*`, `boss-planning`, `composition-analysis`, `discord-composer`)
| Stitch element | Status | Source / note |
|---|---|---|
| Title, difficulty, call time, notes | ✅ | `IRaidPlan` |
| KPI bar: raiders / tanks / healers / dps counts | 🟡 | derive from participants + spec roles |
| KPI: average ilvl | ❌ | omit |
| 4 groups x 5 matrix | ✅ | `groupNumber` on participants |
| Bench / absent strip | ✅ | `RaidParticipantRole.BENCH/ABSENT` |
| Role ratio bar, Bloodlust/Brez/buff coverage | ✅ | existing `composition-analysis` logic |
| Armor-tier token distribution | 🟡 | derive from class -> token group (wow-registry) |
| Boss tactical assignments (status, notes, resources) | ✅ | `IRaidPlanBossNote`, `BossNoteStatus`, resources |
| Discord composer + live embed preview | ✅ | `discord-composer`, `POST raid-plan/:id/notify`, schedule |
| Feedback & dispute modal | ✅ | existing feedback button/service |
| Plan settings modal | ✅ | existing plan form fields |

### Loot overview / reserve / onboarding / login / shell
No Stitch screen. Derive from design system. "Soft Reserves" and "Loot History" nav entries from Stitch map to the existing
reservations/received-items sections of `/loot` (not new routes).

## Phases

0. **Prep** (done by orchestrator): stitch-design committed, baseline `npm run check`, visual harness.
1. **Foundation** (single agent, blocks phase 2): tokens, global primitives, app shell. Only this phase edits
   `styles.scss`, `app.html/app.scss`, `libs/frontend/shared-ui`.
2. **Screens in parallel** (own worktree/branch, disjoint files):
   - A `rework/admin-users`: user-management, user-detail-modal (-> drawer), reservation-management
   - B `rework/admin-season`: season-config, audit-log, admin-shell, boss-view, dice-modal, assign-confirm
   - C1 `rework/raid-plan-core`: raid-plan-detail, boss-planning
   - C2 `rework/raid-plan-rest`: composition-analysis, discord-composer, raid-plan-list, raid-plan-form
   - D `rework/loot`: raider-loot-overview, loot-item-card, reserve-modal, profile-editor-modal
   - E `rework/auth-misc`: login, onboarding, unauthorized, dev-panel, admin-feedback, roll-spectator
3. **Review + integrate**: review per branch, merge into `develop`, visual QA at 3 breakpoints, budget check.
4. **Cleanup**: dead SCSS, README.

## Rules for every phase-2 agent

1. Read the matching Stitch fragments under `libs/frontend/stitch-design/screens/**/parts/` and `design-system/` first.
   Rebuild previews with `node libs/frontend/stitch-design/tools/assemble.mjs`.
2. Touch only the files of your area. Need something from the foundation (token, primitive)? Report it, do not edit shared files.
3. Templates + SCSS only. Keep Dutch copy, signals, existing selectors used by tests, and the responsive behaviour.
4. Use tokens/variables, not hard-coded colours. Respect the `anyComponentStyle` budget (warn 10kb, error 20kb).
5. Omit Stitch elements marked ❌. Implement 🟡 only if it is frontend-only and small; otherwise list it as follow-up.
6. Before finishing: `npx nx lint <project>` and `npx nx build crusaders-bis-list-frontend` must not add new errors versus the baseline below.
7. Final report: what was ported, what was deliberately left out (and why), what the foundation is missing.

## Baseline on `master` (b9301f2), before the rework

`npm run check` fails on lint already; these are **pre-existing**, not caused by the rework:
- `frontend-shared-ui` <-> `frontend-auth`: circular dependency (`@nx/enforce-module-boundaries`), reported in both projects.
- `crusaders-bis-list-frontend` `app.routes.ts:11`: static import of lazy-loaded `frontend-admin`.
- A handful of warnings (unused imports, non-null assertions).

`npm run typecheck` is a no-op (it names projects that no longer exist: `crusaders-bis-list`, `frontend`). Use
`npx nx build crusaders-bis-list-frontend` as the type/compile gate instead.
