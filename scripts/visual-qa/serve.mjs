// Builds the Angular app (development configuration) and serves it as a static SPA.
//
//   node scripts/visual-qa/serve.mjs [--port 4300] [--no-build] [--rebuild]
//
// Build output goes to dist/visual-qa/browser (NOT the default dist/apps/... folder) so that
//   1. we never serve a stale *production* build (its apiUrl points at onrender, not localhost:3000), and
//   2. we do not clobber builds other people made.
// The development configuration uses environment.ts -> apiUrl http://localhost:3000/api, which is exactly what
// mock-api.mjs intercepts.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const OUTPUT_PATH = 'dist/visual-qa';
export const BROWSER_DIR = path.join(ROOT, OUTPUT_PATH, 'browser');
const STAMP = path.join(ROOT, OUTPUT_PATH, '.built-at');

const SOURCE_DIRS = [
  'apps/crusaders-bis-list-frontend/src',
  'apps/crusaders-bis-list-frontend/public',
  'libs/frontend',
  'libs/shared',
];
const SOURCE_FILES = [
  'apps/crusaders-bis-list-frontend/project.json',
  'apps/crusaders-bis-list-frontend/tsconfig.app.json',
  'tsconfig.base.json',
  'package.json',
];
const IGNORE = new Set(['node_modules', 'stitch-design', '.git']);

function newestSourceMtime() {
  let newest = 0;
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (IGNORE.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (!/\.(spec\.ts|md)$/.test(e.name)) newest = Math.max(newest, fs.statSync(p).mtimeMs);
    }
  };
  for (const d of SOURCE_DIRS) walk(path.join(ROOT, d));
  for (const f of SOURCE_FILES) {
    try {
      newest = Math.max(newest, fs.statSync(path.join(ROOT, f)).mtimeMs);
    } catch {
      /* optional */
    }
  }
  return newest;
}

export function isBuildFresh() {
  try {
    return fs.existsSync(path.join(BROWSER_DIR, 'index.html')) && fs.statSync(STAMP).mtimeMs >= newestSourceMtime();
  } catch {
    return false;
  }
}

function runBuild() {
  return new Promise((resolve) => {
    const args = [
      'nx',
      'build',
      'crusaders-bis-list-frontend',
      '--configuration=development',
      `--output-path=${OUTPUT_PATH}`,
      '--skip-nx-cache',
    ];
    console.log(`[serve] npx ${args.join(' ')}`);
    const started = Date.now();
    const child = spawn(`npx ${args.join(' ')}`, { cwd: ROOT, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let tail = '';
    const keep = (d) => {
      tail = (tail + d.toString()).slice(-6000);
    };
    child.stdout.on('data', keep);
    child.stderr.on('data', keep);
    child.on('close', (code) => {
      const ok = code === 0 && fs.existsSync(path.join(BROWSER_DIR, 'index.html'));
      resolve({ ok, tail, seconds: Math.round((Date.now() - started) / 1000) });
    });
  });
}

/**
 * Make sure a development build exists.
 * - noBuild: never build, fail if there is no build.
 * - rebuild: always build.
 * - default: build only when the sources are newer than the last build.
 * A failed build is retried once after 60s (other agents edit the tree concurrently).
 */
export async function ensureBuilt({ noBuild = false, rebuild = false } = {}) {
  if (noBuild) {
    if (!fs.existsSync(path.join(BROWSER_DIR, 'index.html')))
      throw new Error(`--no-build given but ${BROWSER_DIR} has no build. Run once without --no-build.`);
    return BROWSER_DIR;
  }
  if (!rebuild && isBuildFresh()) {
    console.log('[serve] build is up to date, skipping (use --rebuild to force)');
    return BROWSER_DIR;
  }
  let result = await runBuild();
  if (!result.ok) {
    console.warn(`[serve] build failed (transient edits by other agents?). Retrying in 60s.\n${result.tail.slice(-1500)}`);
    await new Promise((r) => setTimeout(r, 60000));
    result = await runBuild();
  }
  if (!result.ok) throw new Error(`Angular build failed twice. Last output:\n${result.tail}`);
  fs.mkdirSync(path.dirname(STAMP), { recursive: true });
  fs.writeFileSync(STAMP, new Date().toISOString());
  console.log(`[serve] build finished in ${result.seconds}s -> ${BROWSER_DIR}`);
  return BROWSER_DIR;
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
};

/** Static SPA server (history fallback to index.html). port 0 = pick a free port. */
export function startStaticServer(dir = BROWSER_DIR, port = 0) {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(dir, pathname);
    if (!file.startsWith(dir)) {
      res.writeHead(403).end();
      return;
    }
    const exists = fs.existsSync(file) && fs.statSync(file).isFile();
    if (!exists) {
      if (path.extname(pathname)) {
        res.writeHead(404).end('not found');
        return;
      }
      file = path.join(dir, 'index.html');
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const { port: p } = server.address();
      resolve({ server, port: p, url: `http://127.0.0.1:${p}` });
    });
  });
}

// CLI
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const dir = await ensureBuilt({ noBuild: args.includes('--no-build'), rebuild: args.includes('--rebuild') });
  const pi = args.indexOf('--port');
  const { url } = await startStaticServer(dir, pi >= 0 ? Number(args[pi + 1]) : 0);
  console.log(`[serve] ${url}  (API calls go to http://localhost:3000/api: run "node scripts/visual-qa/mock-api.mjs --serve")`);
}
