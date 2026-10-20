// Loads the REAL shared-domain (enums, wow registry, canClassReserveItem, ...) by bundling
// libs/shared/domain/src/index.ts with esbuild into tmp/visual/.cache/domain.mjs.
// This keeps the fixtures in sync with the TypeScript models: enum string values, class colours
// and the eligibility rules come from the source of truth, nothing is duplicated here.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SRC = path.join(ROOT, 'libs', 'shared', 'domain', 'src');
const OUT = path.join(ROOT, 'tmp', 'visual', '.cache', 'domain.mjs');

function newestMtime(dir) {
  let newest = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    newest = Math.max(newest, e.isDirectory() ? newestMtime(p) : fs.statSync(p).mtimeMs);
  }
  return newest;
}

function ensureBundle() {
  const stale = !fs.existsSync(OUT) || fs.statSync(OUT).mtimeMs < newestMtime(SRC);
  if (!stale) return;
  const require = createRequire(path.join(ROOT, 'package.json'));
  const esbuild = require('esbuild');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  esbuild.buildSync({
    entryPoints: [path.join(SRC, 'index.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: OUT,
    logLevel: 'error',
  });
}

ensureBundle();
const domain = await import(pathToFileURL(OUT).href + `?v=${fs.statSync(OUT).mtimeMs}`);

export const {
  ArmorType,
  AssignmentStatus,
  ItemCategory,
  PrimaryStat,
  RaidDifficulty,
  RaidParticipantRole,
  RaiderStatus,
  Team,
  UserRole,
  WeaponType,
  WowClass,
  WowSpec,
  WOW_CLASS_REGISTRY,
  WOW_SPEC_REGISTRY,
  canClassReserveItem,
  getClassData,
  SUPER_USER_EMAIL,
} = domain;
