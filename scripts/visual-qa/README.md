# Visual QA harness

Screenshots of the **authenticated** Angular screens without a backend or Google login. A Playwright browser
(Microsoft Edge, fallback Chromium) loads the app, a fake JWT is put in `localStorage`, and every call to
`http://localhost:3000/api/**` is answered from fixtures.

Screenshots land in `tmp/visual/` (git-ignored).

## Commands

```bash
# one route, three viewports (desktop 1440x900, tablet 820x1180, mobile 390x844)
npm run visual-qa -- --route /admin/users --persona admin --out tmp/visual/admin-users
node scripts/visual-qa/screenshot.mjs --route /loot --route /admin/season-config --viewports desktop,mobile

# every route of the app, each with a sensible persona (see --list)
node scripts/visual-qa/screenshot.mjs --preset all --out tmp/visual/all
node scripts/visual-qa/screenshot.mjs --preset all --only admin-users,loot --viewports desktop

# Stitch design previews (libs/frontend/stitch-design/_build/<name>.html, assembled automatically if missing)
node scripts/visual-qa/screenshot.mjs --stitch admin-user-management,raid-planner,design-system --out tmp/visual/stitch

# a state behind a click (e.g. the user drawer), a custom wait, an already running dev server
node scripts/visual-qa/screenshot.mjs --route /admin/users --click ".user-row" --out tmp/visual/drawer
node scripts/visual-qa/screenshot.mjs --route /loot --url http://localhost:4200
```

Files are named `<route>-<persona>-<viewport>.png` (preset: `<name>-<viewport>.png`, stitch: `stitch-<name>-<viewport>.png`).
Options: `--no-build`, `--rebuild`, `--no-expand`, `--strict`, `--delay <ms>`, `--wait-for <selector>`, `--browser msedge|chrome|chromium`,
`--headed`, `--help`.

Git Bash note: a leading `/` argument may get rewritten to `C:/Program Files/Git/...`; the script undoes that for `--route`,
but `MSYS_NO_PATHCONV=1` or PowerShell avoids it altogether.

### Build and serving

Unless `--url` is given, the script builds with
`npx nx build crusaders-bis-list-frontend --configuration=development --output-path=dist/visual-qa --skip-nx-cache`
and serves `dist/visual-qa/browser` as a static SPA on a free port. A separate output folder is used on purpose: the
default `dist/apps/crusaders-bis-list-frontend` may contain a production build whose API URL points at Render.
A build is skipped when `dist/visual-qa` is newer than the sources; `--no-build` never builds, `--rebuild` always does.
A failed build is retried once after 60s (other people may be editing the tree); then the run aborts with the build output.
`node scripts/visual-qa/serve.mjs [--port 4300]` serves the build by hand.

### Whole-page screenshots

The app uses `html, body { overflow: hidden }` with inner scroll containers. Before each screenshot the viewport is grown
until no scroll container clips content any more (max 16000px), then a full-page screenshot is taken. If a scroller does not
react to the viewport height (fixed `max-height`) growing stops. `--no-expand` gives a plain viewport screenshot.
Animations are disabled and `prefers-reduced-motion` is set.

### Problems are reported, not hidden

Per screenshot the script prints console errors, page errors, failed same-origin requests, API responses >= 400 (incl.
**unmocked endpoints**, which answer `404 {"error":"visual-qa: no mock ..."}`), redirects away from the requested route
(guard sent you elsewhere: wrong persona?), failed clicks, and a missing Tailwind CDN for Stitch pages (needs internet).
Exit code is only non-zero with `--strict` (1) or when a screenshot/build crashed (2).

## Personas (`fake-token.mjs`)

| persona | who | roles | typical routes |
|---|---|---|---|
| `guest` | no token | - | `/auth` |
| `raider` | Arcanis (Fire Mage, Crusaders) | raider | `/loot`, `/onboarding?edit=true`, `/roll/demo` |
| `admin` | Lightsworn (Holy Paladin, Crusaders) | raider, admin | `/admin/*` |
| `superadmin` | Dawnpriest (Holy Priest), the real `SUPER_USER_EMAIL` | raider, admin, super_admin | `/raid-plan*`, `/dev-panel`, `/feedback-inbox`, both team columns in `/admin/users` |
| `newbie` | logged in, no raider profile | raider | `/onboarding` (profileGuard) |

`superadmin` also has the `admin` role (as the real super user does): `/admin/*` is guarded by `adminGuard`, which needs `admin`.
If `--persona` is omitted it is inferred from the route. The token is unsigned (`header.payload.signature`, payload
sub/email/displayName/roles/team, exp year 2100) and stored with `page.addInitScript` together with a `refresh_token`
that the mock `/auth/refresh` accepts, so the 401 -> refresh flow of the interceptor works. The app never verifies the
token; `GET /auth/me` is answered from the persona behind the Bearer token. `node scripts/visual-qa/fake-token.mjs admin`
prints a token.

## Fixtures (`fixtures/`)

Plain `.mjs`, deterministic (fixed "now" 2026-10-21, seeded PRNG), built on the **real** `libs/shared/domain` (bundled by
esbuild into `tmp/visual/.cache/domain.mjs`, so enum values, class registry and `canClassReserveItem` are never duplicated).

- `people.mjs`: 32 raiders (24 Crusaders, 8 Templars; all 13 classes; active/inactive/trial), 2 users without profile, personas
- `catalog.mjs`: season "Midnight S2 (T36)", 10 bosses in 3 raids, 96 items (super-rare per team, merged toggle items, tier tokens)
- `loot.mjs`: season config per team, reservations, received items, assignments, peer counts, admin boss loot view with eligible raiders, audit log, feedback, roll session
- `raid-plan.mjs`: 4 raid plans; `plan-1` has 20 raiders in groups 1-4 + 2 bench + 2 absent, boss notes with resources

## Mock API (`mock-api.mjs`)

`installMockApi(context)` uses `context.route()` (robust: no port, no CORS setup). Alternatively
`node scripts/visual-qa/mock-api.mjs --serve [--port 3000]` runs the same handlers as a plain HTTP server, e.g. to click through
the app by hand (`node scripts/visual-qa/serve.mjs` for the frontend; put a token from `fake-token.mjs` in localStorage).
`node scripts/visual-qa/mock-api.mjs` lists all mocked routes. Auth and roles are enforced like the controllers (401/403 when the
persona is wrong). Mutations answer with the status the controller uses and a plausible body (state is not kept).

**Adding a mock:** add one line to `ROUTES` in `mock-api.mjs`:
`['GET', '/path/:param', { auth: REQ.ADMIN }, (ctx) => json(...)]`; data belongs in `fixtures/`.
