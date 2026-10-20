#!/usr/bin/env node
// Visual QA screenshots of the authenticated Angular screens, without backend or Google login.
//
//   node scripts/visual-qa/screenshot.mjs --route /admin/users --persona admin --viewports desktop,tablet,mobile --out tmp/visual/admin-users
//   node scripts/visual-qa/screenshot.mjs --preset all --out tmp/visual/all
//   node scripts/visual-qa/screenshot.mjs --stitch admin-user-management,raid-planner --out tmp/visual/stitch
//
// See scripts/visual-qa/README.md for all options.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { installMockApi, DEFAULT_API_BASE } from './mock-api.mjs';
import { installPersona, personaNames } from './fake-token.mjs';
import { ensureBuilt, startStaticServer, ROOT } from './serve.mjs';
import { PLAN_ID } from './fixtures/index.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright'));

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 820, height: 1180 },
  mobile: { width: 390, height: 844 },
};

const STITCH_TARGETS = ['admin-user-management', 'raid-planner', 'design-system'];
const STITCH_DIR = path.join(ROOT, 'libs', 'frontend', 'stitch-design');

/** Every route of the app with the persona that can actually see it. */
const PRESET_ALL = [
  { name: 'auth', route: '/auth', persona: 'guest' },
  { name: 'unauthorized', route: '/unauthorized', persona: 'raider' },
  { name: 'onboarding', route: '/onboarding', persona: 'newbie' },
  { name: 'onboarding-edit', route: '/onboarding?edit=true', persona: 'raider' },
  { name: 'loot', route: '/loot', persona: 'raider' },
  { name: 'loot-admin', route: '/loot', persona: 'admin' },
  { name: 'admin-boss-view', route: '/admin/boss-view', persona: 'admin' },
  { name: 'admin-boss-view-hero', route: '/admin/boss-view', persona: 'admin', click: ['.diff-btn:has-text("Hero")'] },
  { name: 'admin-users', route: '/admin/users', persona: 'admin' },
  { name: 'admin-users-super', route: '/admin/users', persona: 'superadmin' },
  { name: 'admin-users-drawer', route: '/admin/users', persona: 'admin', click: ['.user-row'] },
  { name: 'admin-season-config', route: '/admin/season-config', persona: 'admin' },
  { name: 'admin-audit-log', route: '/admin/audit-log', persona: 'admin' },
  { name: 'raid-plan-list', route: '/raid-plan', persona: 'superadmin' },
  { name: 'raid-plan-new', route: '/raid-plan/new', persona: 'superadmin' },
  { name: 'raid-plan-detail', route: `/raid-plan/${PLAN_ID}`, persona: 'superadmin' },
  { name: 'dev-panel', route: '/dev-panel', persona: 'superadmin' },
  { name: 'feedback-inbox', route: '/feedback-inbox', persona: 'superadmin' },
  { name: 'roll-spectator', route: '/roll/demo', persona: 'raider' },
];

// ── args ───────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { routes: [], clicks: [], stitch: [], viewports: null, persona: null, out: null, preset: null, only: null };
  const flags = new Set(['strict', 'no-build', 'rebuild', 'no-expand', 'headed', 'list', 'help', 'quiet']);
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) throw new Error(`Unexpected argument "${k}"`);
    const name = k.slice(2);
    if (flags.has(name)) {
      a[name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = true;
      continue;
    }
    const v = argv[++i];
    if (v === undefined) throw new Error(`Missing value for ${k}`);
    switch (name) {
      // Git Bash (MSYS) rewrites a leading "/loot" argument to "C:/Program Files/Git/loot": undo that.
      case 'route': a.routes.push(v.replace(/^[A-Za-z]:[\/].*?[\/]Git[\/]/i, '/')); break;
      case 'click': a.clicks.push(v); break;
      case 'stitch': a.stitch.push(...v.split(',').filter(Boolean)); break;
      case 'viewports': a.viewports = v.split(',').filter(Boolean); break;
      case 'persona': a.persona = v; break;
      case 'out': a.out = v; break;
      case 'preset': a.preset = v; break;
      case 'only': a.only = v.split(',').filter(Boolean); break;
      case 'url': a.url = v; break;
      case 'wait-for': a.waitFor = v; break;
      case 'delay': a.delay = Number(v); break;
      case 'browser': a.browser = v; break;
      default: throw new Error(`Unknown option ${k}`);
    }
  }
  return a;
}

const HELP = `Usage: node scripts/visual-qa/screenshot.mjs [options]

  --route <path>          app route to capture (repeatable). ':id' is replaced by the demo raid plan / roll session
  --preset all            capture every route of the app (see --list); --only a,b to filter by name
  --persona <name>        ${personaNames().join(' | ')}  (default: inferred from the route)
  --viewports <list>      desktop,tablet,mobile  (default: all three; --stitch defaults to desktop)
  --out <dir>             output directory (default tmp/visual/latest)
  --stitch <name[,name]>  Stitch design previews: ${STITCH_TARGETS.join(' | ')} | all
  --click <selector>      click the first match after load (repeatable), e.g. --click ".user-row"
  --wait-for <selector>   wait for a selector before the screenshot
  --delay <ms>            extra settle time (default 400)
  --url <base>            use an already running dev server (e.g. http://localhost:4200) instead of building
  --no-build              never build; serve the existing dist/visual-qa/browser
  --rebuild               force a rebuild
  --no-expand             plain viewport screenshot (do not grow the viewport to show inner scroll containers)
  --strict                exit 1 on console errors, page errors, unmocked/failed API calls, unexpected redirects
  --browser <channel>     msedge (default) | chrome | chromium
  --headed                show the browser
  --list                  list preset names`;

const slug = (s) =>
  s
    .replace(/^\//, '')
    .replace(/[?&=]/g, '-')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'root';

function personaForRoute(route) {
  const p = route.split('?')[0];
  if (p.startsWith('/auth')) return 'guest';
  if (p.startsWith('/onboarding')) return 'raider';
  if (p.startsWith('/admin')) return 'admin';
  if (p.startsWith('/raid-plan') || p.startsWith('/dev-panel') || p.startsWith('/feedback-inbox')) return 'superadmin';
  return 'raider';
}

const fillParams = (route) => route.replace(/\/:id\b/, route.startsWith('/roll') ? '/demo' : `/${PLAN_ID}`).replace(/\/:sessionId\b/, '/demo');

// ── browser ────────────────────────────────────────────────────────────────────
async function launchBrowser({ browser, headed }) {
  const headless = !headed;
  const order = browser ? [browser] : ['msedge', 'chromium'];
  const errors = [];
  for (const b of order) {
    try {
      const instance = await chromium.launch(b === 'chromium' ? { headless } : { channel: b, headless });
      console.log(`[browser] ${b === 'msedge' ? 'Microsoft Edge' : b}`);
      return instance;
    } catch (e) {
      errors.push(`${b}: ${String(e.message).split('\n')[0]}`);
    }
  }
  throw new Error(`Could not launch a browser (${errors.join(' | ')}). Install Edge/Chrome or run "npx playwright install chromium".`);
}

// ── full-page capture of apps with inner scroll containers ─────────────────────
/** Largest amount (px) any scroll container (or the document) is still clipping. */
const measureClipped = () => {
  const doc = document.documentElement;
  let extra = Math.max(doc.scrollHeight - window.innerHeight, document.body.scrollHeight - window.innerHeight, 0);
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (!/(auto|scroll)/.test(cs.overflowY) || cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (el.clientHeight === 0) continue;
    const clipped = el.scrollHeight - el.clientHeight;
    if (clipped > 2) extra = Math.max(extra, clipped);
  }
  return extra;
};

/**
 * The app has `html, body { overflow: hidden }` and scrolls inside containers, so fullPage alone only captures
 * one viewport. We grow the viewport height until nothing is clipped any more (100vh based layouts follow the
 * viewport). If growing does not reduce the clipping (fixed max-height scroller) we revert and stop.
 */
async function expandViewport(page, viewport, maxHeight = 16000) {
  let height = viewport.height;
  for (let i = 0; i < 6; i++) {
    const before = await page.evaluate(measureClipped);
    if (before <= 2 || height >= maxHeight) break;
    const next = Math.min(maxHeight, height + before);
    await page.setViewportSize({ width: viewport.width, height: next });
    await page.waitForTimeout(200);
    const after = await page.evaluate(measureClipped);
    if (after >= before - 2) {
      // no progress: this scroller is not tied to the viewport height
      await page.setViewportSize({ width: viewport.width, height });
      await page.waitForTimeout(100);
      break;
    }
    height = next;
  }
  return height;
}

// ── one screenshot ─────────────────────────────────────────────────────────────
function isExternal(urlStr, origins) {
  try {
    const u = new URL(urlStr);
    if (u.protocol === 'data:' || u.protocol === 'blob:' || u.protocol === 'file:') return false;
    return !origins.some((o) => u.origin === o);
  } catch {
    return false;
  }
}

async function shoot(browser, job, viewportName, ctxOpts) {
  const viewport = VIEWPORTS[viewportName];
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    locale: 'nl-NL',
    timezoneId: 'Europe/Amsterdam',
    reducedMotion: 'reduce',
  });
  const problems = [];
  const notes = [];
  let api = null;
  try {
    if (job.type === 'app') {
      await installPersona(context, job.persona);
      api = await installMockApi(context, { apiBase: ctxOpts.apiBase });
    }
    const page = await context.newPage();
    const origins = [new URL(job.url).origin, new URL(ctxOpts.apiBase).origin];

    page.on('pageerror', (e) => problems.push(`page error: ${e.message.split('\n')[0]}`));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const loc = m.location()?.url ?? '';
      if (loc && isExternal(loc, origins)) return notes.push(`external resource error: ${loc.slice(0, 80)}`);
      if (loc.startsWith(ctxOpts.apiBase) && /Failed to load resource/.test(m.text())) return; // tracked via mock failures
      if (/favicon/.test(loc)) return;
      if (/Failed to load resource/.test(m.text())) return; // reported with its URL by the response listener
      problems.push(`console error: ${m.text().split('\n')[0].slice(0, 220)}`);
    });
    page.on('response', (r) => {
      const u = r.url();
      if (r.status() < 400 || u.startsWith(ctxOpts.apiBase) || /favicon/.test(u)) return;
      if (isExternal(u, origins)) notes.push(`external ${r.status()}: ${u.slice(0, 90)}`);
      else problems.push(`HTTP ${r.status()} for ${u}`);
    });
    page.on('requestfailed', (r) => {
      if (isExternal(r.url(), origins)) notes.push(`external request failed: ${new URL(r.url()).host}`);
      else if (!/favicon/.test(r.url())) problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`);
    });

    await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => notes.push('network did not go idle in 15s'));
    await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
    if (job.type === 'app') {
      await page.waitForFunction(() => (document.querySelector('app-root')?.children.length ?? 0) > 0, null, { timeout: 15000 }).catch(() => problems.push('app-root stayed empty (Angular did not bootstrap)'));
    } else {
      const tw = await page.evaluate(() => typeof window.tailwind !== 'undefined').catch(() => false);
      if (!tw) problems.push('Tailwind CDN script did not load (offline?): the Stitch preview is unstyled');
    }
    await page.waitForTimeout(ctxOpts.delay);

    for (const sel of job.click ?? []) {
      try {
        await page.locator(sel).first().click({ timeout: 5000 });
        await page.waitForTimeout(400);
      } catch {
        problems.push(`click "${sel}" failed (selector not found?)`);
      }
    }
    if (ctxOpts.waitFor) await page.waitForSelector(ctxOpts.waitFor, { timeout: 10000 }).catch(() => problems.push(`wait-for "${ctxOpts.waitFor}" timed out`));
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);

    if (job.type === 'app') {
      const landed = new URL(page.url());
      const expected = new URL(job.url);
      if (landed.pathname !== expected.pathname) problems.push(`redirected: ${expected.pathname} -> ${landed.pathname} (wrong persona or missing mock?)`);
    }

    const height = ctxOpts.noExpand ? viewport.height : await expandViewport(page, viewport);
    await page.waitForTimeout(150);
    const file = path.join(ctxOpts.out, `${job.file}-${viewportName}.png`);
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    if (api) {
      for (const f of api.failures) problems.push(`API ${f}`);
    }
    return { file, height, problems, notes: [...new Set(notes)], unmocked: api?.unmocked ?? [], calls: api?.calls.length ?? 0 };
  } finally {
    await context.close();
  }
}

// ── main ───────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return console.log(HELP);
  if (args.list) {
    console.log(PRESET_ALL.map((p) => `${p.name.padEnd(22)} ${p.persona.padEnd(11)} ${p.route}${p.click ? `  (click ${p.click.join(', ')})` : ''}`).join('\n'));
    return;
  }

  const jobs = [];
  if (args.preset) {
    if (args.preset !== 'all') throw new Error(`Unknown preset "${args.preset}" (only "all")`);
    for (const p of PRESET_ALL) if (!args.only || args.only.includes(p.name)) jobs.push({ type: 'app', ...p, file: p.name });
  }
  for (const r of args.routes) {
    const route = fillParams(r.startsWith('/') ? r : `/${r}`);
    const persona = args.persona ?? personaForRoute(route);
    if (!personaNames().includes(persona)) throw new Error(`Unknown persona "${persona}" (${personaNames().join(', ')})`);
    jobs.push({ type: 'app', route, persona, click: args.clicks, file: `${slug(route)}-${persona}` });
  }
  const stitchNames = args.stitch.includes('all') ? STITCH_TARGETS : args.stitch;
  for (const n of stitchNames) {
    if (!STITCH_TARGETS.includes(n)) throw new Error(`Unknown stitch target "${n}" (${STITCH_TARGETS.join(', ')})`);
    jobs.push({ type: 'stitch', name: n, click: args.clicks, file: `stitch-${n}` });
  }
  if (!jobs.length) {
    console.log(HELP);
    process.exitCode = 2;
    return;
  }

  const viewportNames = args.viewports ?? (jobs.every((j) => j.type === 'stitch') ? ['desktop'] : ['desktop', 'tablet', 'mobile']);
  for (const v of viewportNames) if (!VIEWPORTS[v]) throw new Error(`Unknown viewport "${v}" (${Object.keys(VIEWPORTS).join(', ')})`);

  const out = path.resolve(ROOT, args.out ?? 'tmp/visual/latest');
  fs.mkdirSync(out, { recursive: true });

  // Stitch previews: assemble when missing
  for (const j of jobs.filter((j) => j.type === 'stitch')) {
    const html = path.join(STITCH_DIR, '_build', `${j.name}.html`);
    if (!fs.existsSync(html)) {
      console.log(`[stitch] ${j.name}.html missing, running assemble.mjs`);
      execFileSync(process.execPath, [path.join(STITCH_DIR, 'tools', 'assemble.mjs')], { stdio: 'inherit' });
    }
    j.url = pathToFileURL(html).href;
  }

  // App: build + serve unless --url
  let staticServer = null;
  if (jobs.some((j) => j.type === 'app')) {
    let base = args.url;
    if (!base) {
      const dir = await ensureBuilt({ noBuild: args.noBuild, rebuild: args.rebuild });
      staticServer = await startStaticServer(dir, 0);
      base = staticServer.url;
    }
    base = base.replace(/\/$/, '');
    for (const j of jobs.filter((j) => j.type === 'app')) j.url = base + j.route;
  }

  const browser = await launchBrowser({ browser: args.browser, headed: args.headed });
  const ctxOpts = { out, apiBase: DEFAULT_API_BASE, delay: args.delay ?? 400, waitFor: args.waitFor, noExpand: args.noExpand };
  const results = [];
  let fatal = 0;
  try {
    for (const job of jobs) {
      for (const vp of viewportNames) {
        const label = `${job.file} @ ${vp}`;
        try {
          const r = await shoot(browser, job, vp, ctxOpts);
          results.push({ label, ...r });
          const rel = path.relative(ROOT, r.file);
          console.log(`${r.problems.length ? 'WARN' : ' OK '} ${label} (${r.calls} api calls, ${r.height}px) -> ${rel}`);
          for (const p of r.problems) console.log(`       ! ${p}`);
          for (const n of r.notes) console.log(`       - ${n}`);
          for (const u of r.unmocked) console.log(`       !! UNMOCKED ${u}`);
        } catch (e) {
          fatal++;
          results.push({ label, problems: [`FAILED: ${e.message}`], notes: [], unmocked: [] });
          console.log(`FAIL ${label}: ${String(e.message).split('\n')[0]}`);
        }
      }
    }
  } finally {
    await browser.close();
    staticServer?.server.close();
  }

  const withProblems = results.filter((r) => r.problems.length);
  const unmocked = [...new Set(results.flatMap((r) => r.unmocked))];
  console.log(`\n${results.length - withProblems.length}/${results.length} screenshots clean, ${withProblems.length} with problems -> ${path.relative(ROOT, out)}`);
  if (unmocked.length) console.log(`Unmocked endpoints: ${unmocked.join(', ')}`);
  if (fatal) process.exitCode = 2;
  else if (args.strict && withProblems.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`[visual-qa] ${e.message}`);
  process.exitCode = 2;
});
