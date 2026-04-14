/**
 * Reset DB script — truncates all application tables in dependency order.
 * Reads DATABASE_URL from .env (or the environment).
 *
 * Usage:
 *   node scripts/reset-db.mjs           # truncate data, keep schema
 *   node scripts/reset-db.mjs --drop    # drop all tables (schema rebuilt on next app start)
 */

import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import pg from 'pg';

// ---------------------------------------------------------------------------
// Load .env manually (no external deps required)
// ---------------------------------------------------------------------------
try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && !process.env[key]) {
      process.env[key] = rest.join('=');
    }
  }
} catch {
  // .env not found — rely on environment variables already set
}

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}

// Tables in delete order (children before parents)
const TRUNCATE_ORDER = [
  'assignments',
  'reservations',
  'season_configs',
  'items',
  'bosses',
  'raid_seasons',
  'raider_profiles',
  'users',
];

const DROP_ORDER = [...TRUNCATE_ORDER]; // same order works for DROP TABLE CASCADE

const isDrop = process.argv.includes('--drop');

// ---------------------------------------------------------------------------
// Confirmation prompt
// ---------------------------------------------------------------------------
const rl = createInterface({ input: process.stdin, output: process.stdout });
const question = (q) => new Promise((resolve) => rl.question(q, resolve));

const action = isDrop ? 'DROP all tables' : 'TRUNCATE all data';
const answer = await question(
  `⚠️   This will ${action} in ${DATABASE_URL.replace(/:([^:@]+)@/, ':***@')}.\n    Type "yes" to continue: `,
);
rl.close();

if (answer.trim().toLowerCase() !== 'yes') {
  console.log('Aborted.');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------
const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: process.env['DATABASE_SSL'] === 'true' ? { rejectUnauthorized: false } : false,
});

await client.connect();

try {
  if (isDrop) {
    for (const table of DROP_ORDER) {
      await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      console.log(`  dropped  ${table}`);
    }
    console.log('\n✅  All tables dropped. Restart the app to recreate the schema.');
  } else {
    // Disable triggers during truncate to avoid FK constraint issues
    await client.query('SET session_replication_role = replica');
    for (const table of TRUNCATE_ORDER) {
      await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
      console.log(`  truncated  ${table}`);
    }
    await client.query('SET session_replication_role = DEFAULT');
    console.log('\n✅  All tables truncated. Schema is intact.');
  }
} finally {
  await client.end();
}
