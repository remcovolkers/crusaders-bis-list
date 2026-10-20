// Mock backend for the visual QA harness.
//
//   Playwright (default):  const api = await installMockApi(context);   // intercepts http://localhost:3000/api/**
//   Standalone server:     node scripts/visual-qa/mock-api.mjs --serve [--port 3000]
//
// Both use the same pure `handle()` function. The persona is derived from the Bearer token in the request
// (see fake-token.mjs), so one mock serves every persona. Endpoints mirror the NestJS controllers in
// libs/backend/adapters/src/lib/controllers. Anything that is not mocked answers 404 JSON
// `{ error: 'visual-qa: no mock ...' }` and is recorded in `api.unmocked`.
//
// To add a mock: add a line to ROUTES below (method, '/path/:param', options, handler).
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import * as fx from './fixtures/index.mjs';
import { buildToken, userIdFromToken } from './fake-token.mjs';

export const DEFAULT_API_BASE = 'http://localhost:3000/api';
const { Team, UserRole } = fx;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'authorization,content-type,x-retry',
  'access-control-max-age': '600',
};

// ── response helpers ───────────────────────────────────────────────────────────
const json = (body, status = 200) => ({ status, body: JSON.stringify(body), type: 'application/json' });
const noContent = () => ({ status: 204, body: '', type: 'application/json' });
const err = (status, message) => json({ statusCode: status, message, error: 'visual-qa' }, status);
const clone = (v) => JSON.parse(JSON.stringify(v));

// ── context helpers ────────────────────────────────────────────────────────────
const userOf = (ctx) => fx.userById(ctx.userId);
const raiderOf = (ctx) => fx.RAIDERS.find((r) => r.userId === ctx.userId) ?? null;
const teamOfUser = (ctx) => userOf(ctx)?.team ?? Team.CRUSADERS;
/** Admin endpoints: only the hardcoded super user may pick a team via ?team=. */
const adminTeam = (ctx) => {
  const requested = ctx.query.get('team');
  if (userOf(ctx)?.email === fx.SUPER_USER_EMAIL && requested) return requested;
  return teamOfUser(ctx);
};

const REQ = { ANY: 'any', ADMIN: 'admin', SUPER: 'super' };

// ── routes ─────────────────────────────────────────────────────────────────────
// [method, pattern, { auth }, handler(ctx) -> response]
// auth: false = public, REQ.ANY = any valid token, REQ.ADMIN = admin role, REQ.SUPER = super_admin role
const ROUTES = [
  // ── auth ──
  ['GET', '/auth/me', { auth: REQ.ANY }, (ctx) => json(fx.authUserOf(ctx.userId))],
  [
    'POST',
    '/auth/refresh',
    { auth: false },
    (ctx) => {
      const userId = userIdFromToken(ctx.body?.refreshToken);
      if (!userId || !fx.userById(userId)) return err(401, 'Invalid refresh token');
      return json({ token: buildToken(userId) }, 201);
    },
  ],
  ['POST', '/auth/bnet/link/init', { auth: REQ.ANY }, () => json({ linkToken: 'visual-qa-link-token' }, 201)],

  // ── raider ──
  [
    'GET',
    '/raider/my-profile',
    { auth: REQ.ANY },
    (ctx) => {
      const r = raiderOf(ctx);
      return { status: 200, body: r ? JSON.stringify(fx.profileOf(r)) : 'null', type: 'application/json' };
    },
  ],
  ['GET', '/raider/wow-characters', { auth: REQ.ANY }, () => json(fx.WOW_CHARACTERS)],
  [
    'POST',
    '/raider/profile',
    { auth: REQ.ANY },
    (ctx) => json({ id: 'raider-new', userId: ctx.userId, status: 'active', ...ctx.body }, 201),
  ],
  [
    'PUT',
    '/raider/profile',
    { auth: REQ.ANY },
    (ctx) => json({ ...(raiderOf(ctx) ? fx.profileOf(raiderOf(ctx)) : { id: 'raider-new' }), ...ctx.body }),
  ],
  ['GET', '/raider/season-config', { auth: REQ.ANY }, (ctx) => json(fx.SEASON_CONFIGS[teamOfUser(ctx)])],
  ['GET', '/raider/catalog', { auth: REQ.ANY }, (ctx) => json(fx.catalogFor(teamOfUser(ctx)))],
  [
    'GET',
    '/raider/reservations',
    { auth: REQ.ANY },
    (ctx) => json(raiderOf(ctx) ? fx.reservationsOf(raiderOf(ctx).id) : []),
  ],
  ['POST', '/raider/reservations', { auth: REQ.ANY }, () => json({ message: 'Reserved successfully' }, 201)],
  ['DELETE', '/raider/reservations/:id', { auth: REQ.ANY }, () => noContent()],
  [
    'GET',
    '/raider/received-items',
    { auth: REQ.ANY },
    (ctx) => json(raiderOf(ctx) ? fx.receivedOf(raiderOf(ctx).id) : []),
  ],
  [
    'POST',
    '/raider/received-items',
    { auth: REQ.ANY },
    (ctx) =>
      json(
        {
          id: `rcv-new-${ctx.body?.itemId ?? 'x'}`,
          raiderId: raiderOf(ctx)?.id ?? 'raider-new',
          itemId: ctx.body?.itemId,
          tier: ctx.body?.tier,
          createdAt: new Date().toISOString(),
        },
        201,
      ),
  ],
  ['DELETE', '/raider/received-items/:id', { auth: REQ.ANY }, () => noContent()],
  [
    'GET',
    '/raider/item-peers/:itemId',
    { auth: REQ.ANY },
    (ctx) => json(raiderOf(ctx) ? fx.peersOf(raiderOf(ctx), ctx.params.itemId) : []),
  ],
  [
    'GET',
    '/raider/item-peer-counts',
    { auth: REQ.ANY },
    (ctx) => json(raiderOf(ctx) ? fx.peerCountsFor(raiderOf(ctx)) : {}),
  ],

  // ── admin ──
  ['GET', '/admin/raiders', { auth: REQ.ADMIN }, (ctx) => {
    const team = adminTeam(ctx);
    return json(fx.RAIDERS.filter((r) => r.team === team).map(fx.raiderUserOf));
  }],
  ['GET', '/admin/users', { auth: REQ.ADMIN }, (ctx) => {
    const team = adminTeam(ctx);
    return json(fx.USERS.filter((u) => u.team === team));
  }],
  ['POST', '/admin/users/:userId/roles', { auth: REQ.ADMIN }, (ctx) =>
    json({ ...fx.userById(ctx.params.userId), roles: ctx.body?.roles ?? [UserRole.RAIDER] }),
  ],
  ['POST', '/admin/users/:userId/team', { auth: REQ.ADMIN }, (ctx) =>
    json({ ...fx.userById(ctx.params.userId), team: ctx.body?.team }),
  ],
  ['DELETE', '/admin/users/:userId', { auth: REQ.ADMIN }, () => noContent()],
  ['DELETE', '/admin/users/:userId/bnet', { auth: REQ.ADMIN }, () => noContent()],
  ['DELETE', '/admin/raiders/:raiderId', { auth: REQ.ADMIN }, () => noContent()],
  ['DELETE', '/admin/raiders/:raiderId/received-items/:itemId', { auth: REQ.ADMIN }, () => noContent()],
  ['GET', '/admin/catalog', { auth: REQ.ADMIN }, (ctx) => json(fx.catalogFor(adminTeam(ctx)))],
  ['GET', '/admin/boss/:bossId/loot/:seasonId', { auth: REQ.ADMIN }, (ctx) => {
    const view = fx.bossLootView(ctx.params.bossId, adminTeam(ctx));
    return view ? json(view) : err(404, 'Boss not found');
  }],
  ['POST', '/admin/assignments', { auth: REQ.ADMIN }, () => json({ message: 'Assignment created' }, 201)],
  ['POST', '/admin/assignments/:id/status', { auth: REQ.ADMIN }, (ctx) => json({ id: ctx.params.id, status: ctx.body?.status })],
  ['GET', '/admin/reservations', { auth: REQ.ADMIN }, (ctx) => json(fx.reservationSummaries(adminTeam(ctx)))],
  ['DELETE', '/admin/reservations/:id', { auth: REQ.ADMIN }, () => noContent()],
  ['POST', '/admin/reservations/reset-all', { auth: REQ.ADMIN }, () => noContent()],
  ['GET', '/admin/audit-log', { auth: REQ.ADMIN }, (ctx) => {
    const team = adminTeam(ctx);
    return json(fx.AUDIT_LOG.filter((e) => e.team === team));
  }],
  ['GET', '/admin/season-config', { auth: REQ.ADMIN }, (ctx) => json(fx.SEASON_CONFIGS[adminTeam(ctx)])],
  ['PUT', '/admin/season-config/:seasonId', { auth: REQ.ADMIN }, (ctx) =>
    json({ ...fx.SEASON_CONFIGS[adminTeam(ctx)], ...ctx.body }),
  ],
  ['POST', '/admin/sync', { auth: REQ.ADMIN }, () => json({ message: 'Catalogus gesynchroniseerd met Blizzard.' }, 200)],
  ['POST', '/admin/reset-and-sync', { auth: REQ.ADMIN }, () =>
    json({ message: 'Catalogus gereset en opnieuw gesynchroniseerd met Blizzard.' }, 200),
  ],
  ['PUT', '/admin/items/:itemId/super-rare', { auth: REQ.ADMIN }, (ctx) => {
    const item = fx.findItem(ctx.params.itemId, adminTeam(ctx));
    return item ? json({ ...item, isSuperRare: !!ctx.body?.isSuperRare }) : err(404, 'Item not found');
  }],

  // ── roll sessions (create/start need admin; read + SSE stream are public by design) ──
  ['POST', '/roll-sessions', { auth: REQ.ADMIN }, () => json({ sessionId: 'demo' }, 201)],
  ['POST', '/roll-sessions/:id/start', { auth: REQ.ADMIN }, () => noContent()],
  ['GET', '/roll-sessions/:id', { auth: false }, (ctx) =>
    ctx.params.id === 'missing' ? err(404, 'Sessie niet gevonden') : json({ ...fx.ROLL_SESSION, sessionId: ctx.params.id }),
  ],
  ['GET', '/roll-sessions/:id/stream', { auth: false }, () => ({
    status: 200,
    type: 'text/event-stream',
    body: `data: ${JSON.stringify({ type: 'spectators', name: '', spectators: fx.ROLL_SESSION.spectators })}\n\n`,
    extraHeaders: { 'cache-control': 'no-cache' },
  })],

  // ── feedback (super admin) ──
  ['POST', '/feedback', { auth: REQ.ANY }, () => json({ ok: true }, 201)],
  ['GET', '/feedback', { auth: REQ.SUPER }, () => json(fx.FEEDBACK)],
  ['PATCH', '/feedback/:id/resolve', { auth: REQ.SUPER }, () => json({ ok: true })],
  ['PATCH', '/feedback/:id/unresolve', { auth: REQ.SUPER }, () => json({ ok: true })],

  // ── raid plans (super admin). Specific paths before ':id'. ──
  ['GET', '/raid-plans/seasons', { auth: REQ.SUPER }, () => json(fx.SEASONS)],
  ['GET', '/raid-plans/seasons/active/bosses', { auth: REQ.SUPER }, () => json(fx.BOSSES)],
  ['GET', '/raid-plans/seasons/:seasonId/bosses', { auth: REQ.SUPER }, (ctx) =>
    json(ctx.params.seasonId === fx.SEASON_ID ? fx.BOSSES : []),
  ],
  ['GET', '/raid-plans', { auth: REQ.SUPER }, () => json(fx.RAID_PLANS)],
  ['POST', '/raid-plans', { auth: REQ.SUPER }, (ctx) =>
    json({ ...clone(fx.RAID_PLANS[0]), id: 'plan-new', ...ctx.body, participants: [] }, 201),
  ],
  ['GET', '/raid-plans/:id', { auth: REQ.SUPER }, (ctx) => {
    const p = fx.planById(ctx.params.id);
    return p ? json(p) : err(404, 'Raid plan not found');
  }],
  ['PATCH', '/raid-plans/:id', { auth: REQ.SUPER }, (ctx) => json({ ...(fx.planById(ctx.params.id) ?? fx.RAID_PLANS[0]), ...ctx.body })],
  ['DELETE', '/raid-plans/:id', { auth: REQ.SUPER }, () => noContent()],
  ['POST', '/raid-plans/:id/notify', { auth: REQ.SUPER }, () => json({ ok: true }, 201)],
  ['PATCH', '/raid-plans/:id/discord-schedule', { auth: REQ.SUPER }, (ctx) =>
    json({ ...(fx.planById(ctx.params.id) ?? fx.RAID_PLANS[0]), scheduledDiscordAt: ctx.body?.scheduledDiscordAt ?? null }),
  ],
  ['GET', '/raid-plans/:id/bosses', { auth: REQ.SUPER }, (ctx) => json(ctx.params.id === fx.PLAN_ID ? fx.BOSS_NOTES : [])],
  ['PATCH', '/raid-plans/:id/bosses/:bossId', { auth: REQ.SUPER }, (ctx) => {
    const note = fx.BOSS_NOTES.find((n) => n.bossId === ctx.params.bossId);
    return json({
      id: `note-${ctx.params.bossId}`,
      raidPlanId: ctx.params.id,
      bossId: ctx.params.bossId,
      notes: '',
      status: 'progression',
      resources: [],
      createdAt: fx.iso(0),
      updatedAt: fx.iso(0),
      ...note,
      ...ctx.body,
    });
  }],
  ['POST', '/raid-plans/:id/bosses/:bossId/resources', { auth: REQ.SUPER }, (ctx) => {
    const note = fx.BOSS_NOTES.find((n) => n.bossId === ctx.params.bossId);
    return json(
      {
        ...(note ?? { id: `note-${ctx.params.bossId}`, raidPlanId: ctx.params.id, bossId: ctx.params.bossId, notes: '', status: 'progression', createdAt: fx.iso(0), updatedAt: fx.iso(0) }),
        resources: [...(note?.resources ?? []), { id: 'res-new', bossNoteId: note?.id ?? 'note-new', ...ctx.body }],
      },
      201,
    );
  }],
  ['DELETE', '/raid-plans/:id/bosses/:bossId/resources/:resourceId', { auth: REQ.SUPER }, () => noContent()],
];

const compiled = ROUTES.map(([method, pattern, opts, handler]) => {
  const names = [];
  const re = new RegExp(
    '^' +
      pattern.replace(/:([A-Za-z]+)/g, (_, n) => {
        names.push(n);
        return '([^/]+)';
      }) +
      '/?$',
  );
  return { method, pattern, opts, handler, re, names };
});

// ── core ───────────────────────────────────────────────────────────────────────
/**
 * @param {{method:string, url:string, headers:Record<string,string>, body?:string|null}} req
 * @returns {{status:number, body:string, type:string, extraHeaders?:Record<string,string>}}
 */
function route(req, apiBase) {
  const url = new URL(req.url);
  const path = url.pathname.replace(new URL(apiBase).pathname, '') || '/';
  const method = req.method.toUpperCase();
  const authHeader = req.headers['authorization'] ?? req.headers['Authorization'] ?? '';
  const bearer = authHeader.replace(/^Bearer\s+/i, '');
  const userId = userIdFromToken(bearer);
  const validUser = userId && fx.userById(userId) ? userId : null;

  let body = null;
  if (req.body) {
    try {
      body = JSON.parse(req.body);
    } catch {
      body = null;
    }
  }

  let sawPath = false;
  for (const r of compiled) {
    const m = r.re.exec(path);
    if (!m) continue;
    sawPath = true;
    if (r.method !== method) continue;
    const params = Object.fromEntries(r.names.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
    const ctx = { params, query: url.searchParams, body, userId: validUser, path, method };
    if (r.opts.auth) {
      if (!validUser) return { ...err(401, 'Unauthorized'), matched: r.pattern };
      const roles = fx.userById(validUser).roles;
      if (r.opts.auth === REQ.ADMIN && !roles.includes(UserRole.ADMIN)) return { ...err(403, 'Forbidden resource'), matched: r.pattern };
      if (r.opts.auth === REQ.SUPER && !roles.includes(UserRole.SUPER_ADMIN)) return { ...err(403, 'Forbidden'), matched: r.pattern };
    }
    return { ...r.handler(ctx), matched: r.pattern };
  }
  return {
    ...json(
      {
        statusCode: 404,
        error: 'visual-qa: no mock',
        message: `visual-qa: no mock for ${method} ${path}${sawPath ? ' (path exists, method not mocked)' : ''}. Add it to scripts/visual-qa/mock-api.mjs`,
      },
      404,
    ),
    unmocked: true,
  };
}

/** Create a mock API instance with its own call log. */
export function createMockApi({ apiBase = DEFAULT_API_BASE, onUnmocked } = {}) {
  const api = {
    apiBase,
    calls: [], // { method, path, status }
    unmocked: [], // unique "METHOD /path"
    failures: [], // unique "METHOD /path -> status" for every 4xx/5xx we returned (incl. unmocked)
    handle(req) {
      const res = route(req, apiBase);
      const url = new URL(req.url);
      const pathname = url.pathname.replace(new URL(apiBase).pathname, '') || '/';
      const label = `${req.method.toUpperCase()} ${pathname}`;
      api.calls.push({ method: req.method.toUpperCase(), path: pathname + url.search, status: res.status });
      if (res.status >= 400) {
        const f = `${label} -> ${res.status}`;
        if (!api.failures.includes(f)) api.failures.push(f);
      }
      if (res.unmocked && !api.unmocked.includes(label)) {
        api.unmocked.push(label);
        onUnmocked?.(label);
      }
      return res;
    },
  };
  return api;
}

const toFulfill = (res) => ({
  status: res.status,
  headers: { ...CORS, 'content-type': res.type, ...(res.extraHeaders ?? {}) },
  body: res.body,
});

/** Intercept the API with a Playwright BrowserContext (or Page). Returns the api instance (call logs). */
export async function installMockApi(target, opts = {}) {
  const api = createMockApi(opts);
  const prefix = api.apiBase.replace(/\/$/, '') + '/';
  await target.route(
    (url) => url.href.startsWith(prefix),
    async (route) => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS, body: '' });
        return;
      }
      const res = api.handle({
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        body: request.postData(),
      });
      await route.fulfill(toFulfill(res));
    },
  );
  return api;
}

/** Standalone HTTP server (alternative to Playwright interception, e.g. to run the app by hand). */
export function startMockServer({ port = 3000, apiBase = DEFAULT_API_BASE } = {}) {
  const api = createMockApi({ apiBase, onUnmocked: (l) => console.warn(`[mock-api] UNMOCKED ${l}`) });
  const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS).end();
      return;
    }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const out = api.handle({
        method: req.method,
        url: `http://localhost:${port}${req.url}`,
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8') || null,
      });
      const f = toFulfill(out);
      res.writeHead(f.status, f.headers).end(f.body);
    });
  });
  return new Promise((resolve) => server.listen(port, () => resolve({ server, api, port })));
}

// CLI: node scripts/visual-qa/mock-api.mjs --serve [--port 3000]
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.includes('--serve')) {
    const port = Number(args[args.indexOf('--port') + 1]) || 3000;
    const { port: p } = await startMockServer({ port });
    console.log(`[mock-api] listening on http://localhost:${p}/api  (personas: log in with tokens from fake-token.mjs)`);
  } else {
    console.log(
      `Routes:\n${compiled.map((r) => `  ${r.method.padEnd(6)} ${r.pattern}`).join('\n')}\n\nUse --serve [--port 3000] to run standalone.`,
    );
  }
}
