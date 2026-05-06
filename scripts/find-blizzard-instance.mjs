/**
 * Script: find-blizzard-instance.mjs
 *
 * Queries the Blizzard journal-instance index and prints the ID + encounters
 * for any raid whose name contains the given search term.
 *
 * Usage:
 *   node --env-file=.env scripts/find-blizzard-instance.mjs "manaforge"
 */

// Credentials loaded via Node's --env-file flag (Node 20+)
const CLIENT_ID = process.env['BLIZZARD_CLIENT_ID'];
const CLIENT_SECRET = process.env['BLIZZARD_CLIENT_SECRET'];
const REGION = process.env['BLIZZARD_REGION'] ?? 'eu';
const SEARCH_TERM = (process.argv[2] ?? 'manaforge').toLowerCase();

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('BLIZZARD_CLIENT_ID / BLIZZARD_CLIENT_SECRET not set.');
  console.error('Run with: node --env-file=.env scripts/find-blizzard-instance.mjs');
  process.exit(1);
}

// ── OAuth token ───────────────────────────────────────────────────────────────
async function getToken() {
  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const res = await fetch('https://oauth.battle.net/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body,
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

// ── Blizzard GET helper ───────────────────────────────────────────────────────
async function blizzardGet(token, path, extraParams = {}) {
  const url = new URL(`https://${REGION}.api.blizzard.com${path}`);
  url.searchParams.set('namespace', `static-${REGION}`);
  url.searchParams.set('locale', 'en_US');
  for (const [k, v] of Object.entries(extraParams)) url.searchParams.set(k, v);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    // Retry with static-preview namespace (needed for PTR seasons)
    url.searchParams.set('namespace', `static-preview-${REGION}`);
    const res2 = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res2.ok) throw new Error(`${path} → HTTP ${res2.status}`);
    return res2.json();
  }
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────
const token = await getToken();

console.log(`Fetching journal-instance index (region: ${REGION}) …`);
const index = await blizzardGet(token, '/data/wow/journal-instance/index');

const matches = (index.instances ?? []).filter((i) => i.name.toLowerCase().includes(SEARCH_TERM));

if (matches.length === 0) {
  console.log(`No instances found matching "${SEARCH_TERM}"`);
  console.log('All instances:');
  for (const i of index.instances ?? []) {
    console.log(`  [${i.id}] ${i.name}`);
  }
  process.exit(0);
}

for (const match of matches) {
  console.log(`\nFound: [${match.id}] ${match.name}`);
  console.log('Fetching encounter details …');

  try {
    const detail = await blizzardGet(token, `/data/wow/journal-instance/${match.id}`);
    const encounters = detail.encounters ?? [];
    console.log(`  instanceId: ${match.id}`);
    console.log(`  Encounters (${encounters.length}):`);
    for (const enc of encounters) {
      console.log(`    { id: ${enc.id}, name: '${enc.name}' }`);
    }
    console.log('\n  fallbackEncounterIds: [' + encounters.map((e) => e.id).join(', ') + ']');
  } catch (err) {
    console.error(`  Could not fetch details: ${err.message}`);
  }
}
