// Season config, reservations, received items, assignments, admin boss view and audit log.
// Everything is derived deterministically from the roster (people.mjs) and the catalog (catalog.mjs).
import {
  AssignmentStatus as AS,
  ItemCategory as Cat,
  RaiderStatus,
  Team,
  WowClass,
  canClassReserveItem,
} from './domain.mjs';
import { BOSSES, ITEMS, SEASON_ID, itemsForTeam, secondaryIconFor } from './catalog.mjs';
import { RAIDERS } from './people.mjs';
import { hash, iso, rng } from './helpers.mjs';

// ── Season config per team ─────────────────────────────────────────────────────
export const SEASON_CONFIGS = {
  [Team.CRUSADERS]: {
    id: 'cfg-crusaders',
    raidSeasonId: SEASON_ID,
    team: Team.CRUSADERS,
    trinketLimit: 2,
    weaponLimit: 2,
    jewelryLimit: 1,
    armorLimit: 2,
    superrareLimit: 1,
  },
  [Team.TEMPLARS]: {
    id: 'cfg-templars',
    raidSeasonId: SEASON_ID,
    team: Team.TEMPLARS,
    trinketLimit: 2,
    weaponLimit: 1,
    jewelryLimit: 1,
    armorLimit: 1,
    superrareLimit: 0,
  },
};

// ── Reservations ──────────────────────────────────────────────────────────────
const byName = (name) => ITEMS.find((i) => i.name === name);
const isReservableCategory = (item, cats) => cats.includes(item.category);

// Hand-picked loot lists for the personas so their screens look intentional.
// [itemName, { assign?: tier, received?: tier }]
const MANUAL = {
  arcanis: [
    ['Heart of the Coiled Altar', {}],
    ["Tidecaller's Pearl", { received: AS.HERO_TIER }],
    ["Venom Queen's Staff", {}],
    ['Venomed Grimoire', { received: AS.MYTH_TIER }],
    ['Eye of the Venom Queen', { assign: AS.CHAMPION_TIER }],
    ['Queenwoven Vestments', {}],
    ['Weathered Scholar Cowl', {}],
  ],
  lightsworn: [
    ['Malignant Venom Vial', {}],
    ['Radiant Venomfang', { received: AS.CHAMPION_TIER }],
    ['Gravebound Mace', { assign: AS.HERO_TIER }],
    ['Toxic Heartlocket', {}],
    ['Queensguard Plate Chestguard', {}],
    ['Crypt-Plate Pauldrons', {}],
  ],
  dawnpriest: [
    ['Heart of the Coiled Altar', { received: AS.CHAMPION_TIER }],
    ['Radiant Venomfang', {}],
    ["Altar-Keeper's Scepter", {}],
    ['Priest-King\'s Medallion', {}],
    ['Venom-Soaked Sash', {}],
  ],
};
// Items received without ever being reserved ("received only" rows in the admin drawer).
const RECEIVED_ONLY = {
  arcanis: [['Gale-Lashed Mantle', AS.CHAMPION_TIER]],
  lightsworn: [['Tidal Bulwark Greaves', AS.HERO_TIER]],
};

function autoPick(raider, limits) {
  const rand = rng(hash(raider.key));
  const team = raider.team;
  const items = itemsForTeam(team).filter((i) => i.mergedWithItemId == null && i.itemLevel > 1);
  const eligible = items.filter((i) => canClassReserveItem(raider.wowClass, raider.spec, i));
  const pick = (cats, n) => {
    const pool = eligible.filter((i) => isReservableCategory(i, cats) && !i.name.startsWith('Venom'));
    const out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    return out;
  };
  const scale = raider.status === RaiderStatus.INACTIVE ? 0 : raider.status === RaiderStatus.TRIAL ? 0.5 : 1;
  const n = (limit) => Math.min(limit, Math.round(limit * scale + (scale > 0 && rand() > 0.7 ? -1 : 0)));
  return [
    ...pick([Cat.TRINKET], Math.max(0, n(limits.trinketLimit))),
    ...pick([Cat.WEAPON, Cat.OFFHAND], Math.max(0, n(limits.weaponLimit))),
    ...pick([Cat.JEWELRY], Math.max(0, n(limits.jewelryLimit))),
    ...pick([Cat.OTHER], Math.max(0, n(limits.armorLimit))),
  ];
}

export const RESERVATIONS = []; // IReservation + { _raider }
export const RECEIVED = []; // IReceivedItem
export const ASSIGNMENTS = []; // { id, raiderId, itemId, status, assignedAt }
let seq = 0;
const stamp = () => iso(-28 + (seq++ % 25), 10 + (seq % 9), (seq * 7) % 60);

for (const raider of RAIDERS) {
  const limits = SEASON_CONFIGS[raider.team];
  const rand = rng(hash(raider.key + 'x'));
  const picks = MANUAL[raider.key]
    ? MANUAL[raider.key].map(([name, opts]) => ({ item: byName(name), opts }))
    : autoPick(raider, limits).map((item) => ({
        item,
        opts: {
          assign: rand() > 0.82 ? [AS.CHAMPION_TIER, AS.HERO_TIER][Math.floor(rand() * 2)] : undefined,
          received: rand() > 0.8 ? [AS.CHAMPION_TIER, AS.HERO_TIER, AS.MYTH_TIER][Math.floor(rand() * 3)] : undefined,
        },
      }));
  for (const { item, opts } of picks) {
    const createdAt = stamp();
    const res = {
      id: `res-${raider.key}-${item.wowItemId}`,
      raiderId: raider.id,
      raiderName: raider.characterName,
      itemId: item.id,
      itemName: item.mergedDisplayName ?? item.name,
      raidSeasonId: SEASON_ID,
      createdAt,
      assignment: opts.assign ? { status: opts.assign } : null,
    };
    RESERVATIONS.push(res);
    if (opts.assign) {
      ASSIGNMENTS.push({
        id: `asg-${raider.key}-${item.wowItemId}`,
        raiderId: raider.id,
        itemId: item.id,
        status: opts.assign,
        assignedAt: iso(-6, 21, 15),
      });
    }
    if (opts.received) {
      RECEIVED.push({
        id: `rcv-${raider.key}-${item.wowItemId}`,
        raiderId: raider.id,
        itemId: item.id,
        tier: opts.received,
        createdAt: iso(-9, 22),
      });
    }
  }
  for (const [name, tier] of RECEIVED_ONLY[raider.key] ?? []) {
    const item = byName(name);
    RECEIVED.push({ id: `rcv-${raider.key}-${item.wowItemId}`, raiderId: raider.id, itemId: item.id, tier, createdAt: iso(-12, 22) });
  }
}

export const reservationsOf = (raiderId) =>
  RESERVATIONS.filter((r) => r.raiderId === raiderId).map(({ ...r }) => r);
export const receivedOf = (raiderId) => RECEIVED.filter((r) => r.raiderId === raiderId);

const TIER_ORDER = { [AS.CHAMPION_TIER]: 0, [AS.HERO_TIER]: 1, [AS.MYTH_TIER]: 2 };
const TIERS = [AS.CHAMPION_TIER, AS.HERO_TIER, AS.MYTH_TIER];
const teamRaiders = (team) => RAIDERS.filter((r) => r.team === team);

/** GET raider/item-peer-counts (same algorithm as RaiderController). */
export function peerCountsFor(raider) {
  const mine = new Set(reservationsOf(raider.id).map((r) => r.itemId));
  const peers = new Set(teamRaiders(raider.team).map((r) => r.id));
  const out = {};
  for (const itemId of mine) {
    const counts = { [AS.CHAMPION_TIER]: 0, [AS.HERO_TIER]: 0, [AS.MYTH_TIER]: 0 };
    const others = new Set(
      RESERVATIONS.filter((r) => r.itemId === itemId && r.raiderId !== raider.id && peers.has(r.raiderId)).map((r) => r.raiderId),
    );
    if (!others.size) continue;
    for (const raiderId of others) {
      const rcv = RECEIVED.find((x) => x.raiderId === raiderId && x.itemId === itemId);
      const idx = rcv ? TIER_ORDER[rcv.tier] : -1;
      for (const tier of TIERS) if (idx < TIER_ORDER[tier]) counts[tier]++;
    }
    out[itemId] = counts;
  }
  return out;
}

/** GET raider/item-peers/:itemId */
export function peersOf(raider, itemId) {
  const peers = new Set(teamRaiders(raider.team).map((r) => r.id));
  return RESERVATIONS.filter((r) => r.itemId === itemId && peers.has(r.raiderId)).map((r) => {
    const rcv = RECEIVED.find((x) => x.raiderId === r.raiderId && x.itemId === itemId);
    const who = RAIDERS.find((x) => x.id === r.raiderId);
    return { characterName: who.characterName, receivedTier: rcv?.tier ?? null };
  });
}

/** GET admin/reservations (RaiderReservationSummary[]) for a team. */
export function reservationSummaries(team) {
  const items = new Map(itemsForTeam(team).map((i) => [i.id, i]));
  return teamRaiders(team).map((raider) => {
    const asg = new Map(ASSIGNMENTS.filter((a) => a.raiderId === raider.id).map((a) => [a.itemId, a]));
    const received = new Map(receivedOf(raider.id).map((r) => [r.itemId, r]));
    const entries = reservationsOf(raider.id).map((r) => {
      const item = items.get(r.itemId);
      const a = asg.get(r.itemId);
      return {
        id: r.id,
        itemId: r.itemId,
        itemName: r.itemName,
        iconUrl: item.iconUrl,
        secondaryIconUrl: secondaryIconFor(item),
        itemCategory: item.category,
        isSuperRare: !!item.isSuperRare,
        createdAt: r.createdAt,
        assignment: a ? { id: a.id, status: a.status, assignedAt: a.assignedAt } : null,
        receivedTier: received.get(r.itemId)?.tier ?? null,
      };
    });
    const reserved = new Set(entries.map((e) => e.itemId));
    for (const rcv of received.values()) {
      if (reserved.has(rcv.itemId)) continue;
      const item = items.get(rcv.itemId);
      entries.push({
        id: null,
        itemId: rcv.itemId,
        itemName: item.mergedDisplayName ?? item.name,
        iconUrl: item.iconUrl,
        secondaryIconUrl: secondaryIconFor(item),
        itemCategory: item.category,
        isSuperRare: !!item.isSuperRare,
        createdAt: rcv.createdAt,
        assignment: null,
        receivedTier: rcv.tier,
        receivedOnly: true,
      });
    }
    return {
      raiderId: raider.id,
      userId: raider.userId,
      characterName: raider.characterName,
      wowClass: raider.wowClass,
      spec: raider.spec,
      reservations: entries,
    };
  });
}

/** GET admin/boss/:bossId/loot/:seasonId (IBossLootView) for a team. */
export function bossLootView(bossId, team) {
  const boss = BOSSES.find((b) => b.id === bossId);
  if (!boss) return null;
  const items = itemsForTeam(team).filter((i) => i.bossId === bossId && i.mergedWithItemId == null && i.itemLevel > 1);
  const drops = items.map((item) => {
    const eligible = teamRaiders(team)
      .filter((r) => r.status !== RaiderStatus.INACTIVE && canClassReserveItem(r.wowClass, r.spec, item))
      .map((r) => {
        const res = RESERVATIONS.find((x) => x.raiderId === r.id && x.itemId === item.id);
        const asg = ASSIGNMENTS.find((x) => x.raiderId === r.id && x.itemId === item.id);
        const rcv = RECEIVED.find((x) => x.raiderId === r.id && x.itemId === item.id);
        return {
          raiderId: r.id,
          raiderName: r.characterName,
          characterName: r.characterName,
          wowClass: r.wowClass,
          spec: r.spec,
          hasReservation: !!res,
          ...(res ? { reservationCreatedAt: res.createdAt, reservationId: res.id } : {}),
          assignment: asg ? { id: asg.id, status: asg.status, assignedAt: asg.assignedAt } : null,
          receivedTier: rcv?.tier ?? null,
        };
      })
      .sort((a, b) => Number(b.hasReservation) - Number(a.hasReservation) || a.characterName.localeCompare(b.characterName));
    return { item: { ...item, secondaryIconUrl: secondaryIconFor(item) }, eligibleRaiders: eligible };
  });
  return { boss, drops };
}

// ── Audit log ─────────────────────────────────────────────────────────────────
const ACTORS = {
  [Team.CRUSADERS]: ['Bram', 'Remco'],
  [Team.TEMPLARS]: ['Pieter'],
};

function buildAudit() {
  const out = [];
  let n = 0;
  const rand = rng(77);
  for (const team of [Team.CRUSADERS, Team.TEMPLARS]) {
    const raiders = teamRaiders(team);
    const count = team === Team.CRUSADERS ? 34 : 9;
    for (let i = 0; i < count; i++) {
      const raider = raiders[Math.floor(rand() * raiders.length)];
      const res = RESERVATIONS.filter((r) => r.raiderId === raider.id);
      const itemName = res.length ? res[Math.floor(rand() * res.length)].itemName : 'Tidecaller\'s Pearl';
      const kind = ['reservation_created', 'reservation_created', 'reservation_cancelled', 'loot_assigned', 'received_item_marked', 'assignment_updated'][
        Math.floor(rand() * 6)
      ];
      const admin = ACTORS[team][Math.floor(rand() * ACTORS[team].length)];
      const adminAction = kind === 'loot_assigned' || kind === 'assignment_updated';
      const tier = [AS.CHAMPION_TIER, AS.HERO_TIER, AS.MYTH_TIER][Math.floor(rand() * 3)];
      out.push({
        id: `audit-${++n}`,
        action: kind,
        actorId: adminAction ? `user-admin-${team}` : raider.userId,
        actorName: adminAction ? admin : raider.player,
        team,
        raiderName: raider.characterName,
        itemName,
        details: adminAction || kind === 'received_item_marked' ? { status: tier, tier } : null,
        createdAt: iso(-0.05 - i * 0.37 - rand() * 0.2),
      });
    }
  }
  out.push({
    id: `audit-${++n}`,
    action: 'reservation_reset_all',
    actorId: 'user-dawnpriest',
    actorName: 'Remco',
    team: Team.CRUSADERS,
    raiderName: null,
    itemName: null,
    details: { reason: 'Nieuw seizoen: Midnight Season 2' },
    createdAt: iso(-34, 20, 5),
  });
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export const AUDIT_LOG = buildAudit();

// ── Misc ───────────────────────────────────────────────────────────────────────
export const WOW_CHARACTERS = [
  { name: 'Arcanis', realm: 'Draenor', realmSlug: 'draenor', wowClass: WowClass.MAGE, level: 90 },
  { name: 'Arcanisx', realm: 'Draenor', realmSlug: 'draenor', wowClass: WowClass.WARLOCK, level: 90 },
  { name: 'Hollowfang', realm: 'Tarren Mill', realmSlug: 'tarren-mill', wowClass: WowClass.ROGUE, level: 88 },
  { name: 'Bearhugs', realm: 'Draenor', realmSlug: 'draenor', wowClass: WowClass.DRUID, level: 80 },
];

export const ROLL_SESSION = {
  sessionId: 'demo',
  itemName: 'Heart of the Coiled Altar',
  itemIconUrl: byName('Heart of the Coiled Altar').iconUrl,
  difficulty: 'Heroic',
  raiders: [
    { raiderId: 'raider-arcanis', name: 'Arcanis', color: '#3FC7EB' },
    { raiderId: 'raider-dawnpriest', name: 'Dawnpriest', color: '#FFFFFF' },
    { raiderId: 'raider-sylvanar', name: 'Sylvanar', color: '#FF7C0A' },
    { raiderId: 'raider-embershard', name: 'Embershard', color: '#33937F' },
    { raiderId: 'raider-lightsworn', name: 'Lightsworn', color: '#F48CBA' },
    { raiderId: 'raider-stormcaller', name: 'Stormcaller', color: '#0070DD' },
  ],
  status: 'waiting',
  spectators: [{ displayName: 'Remco' }, { displayName: 'Bram' }],
  winner: null,
};

export const FEEDBACK = [
  ['dawnpriest', 'Kan de reserve-knop op mobiel iets groter? Ik tik steeds ernaast.', '/loot', false, -0.3],
  ['arcanis', 'Mijn spec klopt niet meer, ik speel nu Frost in plaats van Fire.', '/loot', false, -1.1],
  ['sylvanar', 'Super dat je nu kunt zien hoeveel mensen hetzelfde item willen!', '/loot', true, -2.4],
  ['thorgrim', 'De raid planner laadt traag als ik veel bosses open heb staan.', '/raid-plan/plan-1', false, -3.2],
  ['tigerpaw', 'Kunnen we de audit log exporteren?', '/admin/audit-log', false, -4.8],
  ['mistwalker', 'Bug: na het annuleren van een reservering blijft de teller staan tot ik ververs.', '/loot', true, -6.5],
  ['shadowweave', 'Kan er een donkere modus komen voor de login pagina?', '/auth', true, -9],
].map(([key, message, pageContext, resolved, days], i) => {
  const r = RAIDERS.find((x) => x.key === key);
  return {
    id: `fb-${i + 1}`,
    userId: r.userId,
    userEmail: r.email,
    userName: r.player,
    message,
    pageContext,
    createdAt: iso(days, 19, 20),
    resolved,
    resolvedAt: resolved ? iso(days + 0.6, 9, 40) : null,
  };
});

