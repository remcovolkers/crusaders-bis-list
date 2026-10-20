// Guild roster: 31 raiders (all 13 classes / many specs, both teams, statuses active/inactive/trial)
// plus a few raider-less users, and the personas used by the visual QA harness.
import {
  RaiderStatus as St,
  Team,
  UserRole as R,
  WowClass as C,
  WowSpec as Sp,
  SUPER_USER_EMAIL,
} from './domain.mjs';
import { iso } from './helpers.mjs';

const CR = Team.CRUSADERS;
const TP = Team.TEMPLARS;
const ACT = St.ACTIVE;

// [key, characterName, player (displayName), class, spec, team, status, realm, extra]
const ROSTER = [
  // ── Crusaders, raid plan "Venomous Abyss": groups 1-4 (20 players) ──
  ['thorgrim', 'Thorgrim', 'Joris', C.WARRIOR, Sp.PROTECTION_WARRIOR, CR, ACT, 'Draenor'],
  ['bloodmourne', 'Bloodmourne', 'Sanne', C.DEATH_KNIGHT, Sp.BLOOD, CR, ACT, 'Draenor'],
  ['lightsworn', 'Lightsworn', 'Bram', C.PALADIN, Sp.HOLY_PALADIN, CR, ACT, 'Tarren Mill', { roles: [R.RAIDER, R.ADMIN], bnet: 'Bram#2271' }],
  ['mistwalker', 'Mistwalker', 'Femke', C.MONK, Sp.MISTWEAVER, CR, ACT, 'Draenor'],
  ['arcanis', 'Arcanis', 'Lars', C.MAGE, Sp.FIRE, CR, ACT, 'Draenor', { bnet: 'Lars#1884' }],
  ['sylvanar', 'Sylvanar', 'Daan', C.DRUID, Sp.RESTORATION_DRUID, CR, ACT, 'Kazzak'],
  ['dawnpriest', 'Dawnpriest', 'Remco', C.PRIEST, Sp.HOLY_PRIEST, CR, ACT, 'Draenor', { roles: [R.RAIDER, R.ADMIN, R.SUPER_ADMIN], email: SUPER_USER_EMAIL, bnet: 'Remco#2002' }],
  ['tidecaller', 'Tidecaller', 'Noor', C.SHAMAN, Sp.RESTORATION_SHAMAN, CR, ACT, 'Draenor'],
  ['shadowstep', 'Shadowstep', 'Milan', C.ROGUE, Sp.SUBTLETY, CR, ACT, 'Tarren Mill'],
  ['felhunter', 'Felhunter', 'Eva', C.DEMON_HUNTER, Sp.HAVOC, CR, ACT, 'Draenor'],
  ['starfall', 'Starfall', 'Ruben', C.DRUID, Sp.BALANCE, CR, ACT, 'Kazzak'],
  ['dreadlock', 'Dreadlock', 'Tim', C.WARLOCK, Sp.AFFLICTION, CR, St.TRIAL, 'Draenor'],
  ['eaglefury', 'Eaglefury', 'Lotte', C.HUNTER, Sp.BEAST_MASTERY, CR, ACT, 'Draenor'],
  ['stormcaller', 'Stormcaller', 'Jesse', C.SHAMAN, Sp.ELEMENTAL, CR, ACT, 'Tarren Mill'],
  ['embershard', 'Embershard', 'Iris', C.EVOKER, Sp.DEVASTATION, CR, ACT, 'Draenor'],
  ['ironhide', 'Ironhide', 'Thijs', C.WARRIOR, Sp.ARMS, CR, ACT, 'Kazzak'],
  ['frostbane', 'Frostbane', 'Anouk', C.DEATH_KNIGHT, Sp.FROST_DK, CR, ACT, 'Draenor'],
  ['shadowweave', 'Shadowweave', 'Bas', C.PRIEST, Sp.SHADOW, CR, ACT, 'Draenor'],
  ['justicar', 'Justicar', 'Kevin', C.PALADIN, Sp.RETRIBUTION, CR, ACT, 'Tarren Mill'],
  ['tigerpaw', 'Tigerpaw', 'Maud', C.MONK, Sp.WINDWALKER, CR, ACT, 'Draenor'],
  // ── Crusaders: bench + absent ──
  ['pyromancer', 'Pyromancer', 'Stijn', C.MAGE, Sp.FROST_MAGE, CR, ACT, 'Draenor'],
  ['gardener', 'Gardener', 'Fleur', C.DRUID, Sp.GUARDIAN, CR, ACT, 'Kazzak'],
  ['longshot', 'Longshot', 'Gerrit', C.HUNTER, Sp.MARKSMANSHIP, CR, St.INACTIVE, 'Draenor'],
  ['timewarden', 'Timewarden', 'Yara', C.EVOKER, Sp.AUGMENTATION, CR, St.INACTIVE, 'Draenor'],
  // ── Templars ──
  ['aegis', 'Aegis', 'Pieter', C.PALADIN, Sp.PROTECTION_PALADIN, TP, ACT, 'Kazzak', { roles: [R.RAIDER, R.ADMIN] }],
  ['hellscream', 'Hellscream', 'Wout', C.DEMON_HUNTER, Sp.VENGEANCE, TP, ACT, 'Kazzak'],
  ['serenity', 'Serenity', 'Linde', C.PRIEST, Sp.DISCIPLINE, TP, ACT, 'Kazzak'],
  ['imp', 'Imp', 'Dennis', C.WARLOCK, Sp.DEMONOLOGY, TP, ACT, 'Kazzak'],
  ['snaketooth', 'Snaketooth', 'Rick', C.HUNTER, Sp.SURVIVAL, TP, St.INACTIVE, 'Kazzak'],
  ['cutlass', 'Cutlass', 'Julia', C.ROGUE, Sp.OUTLAW, TP, St.TRIAL, 'Kazzak'],
  ['voidgaze', 'Voidgaze', 'Niels', C.DEMON_HUNTER, Sp.DEVOURER, TP, St.TRIAL, 'Kazzak'],
  ['rampage', 'Rampage', 'Sven', C.WARRIOR, Sp.FURY, TP, ACT, 'Kazzak'],
];

export const RAIDERS = ROSTER.map(([key, characterName, player, wowClass, spec, team, status, realm, extra = {}], i) => ({
  key,
  id: `raider-${key}`,
  userId: `user-${key}`,
  characterName,
  realm,
  wowClass,
  spec,
  status,
  team,
  player,
  roles: extra.roles ?? [R.RAIDER],
  email: extra.email ?? `${player.toLowerCase()}@example.com`,
  battletag: extra.bnet ?? null,
  createdAt: iso(-120 + i * 2, 19),
  updatedAt: iso(-10 - (i % 7), 12),
}));

export const raiderByKey = (key) => RAIDERS.find((r) => r.key === key);

/** IRaiderProfile */
export const profileOf = (r) => ({
  id: r.id,
  userId: r.userId,
  characterName: r.characterName,
  realm: r.realm,
  wowClass: r.wowClass,
  spec: r.spec,
  status: r.status,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

/** RaiderUser (GET admin/raiders) */
export const raiderUserOf = (r) => ({
  id: r.id,
  userId: r.userId,
  characterName: r.characterName,
  wowClass: r.wowClass,
  spec: r.spec,
  status: r.status,
});

// ── Users ───────────────────────────────────────────────────────────────────────
// Users without a raider profile (signed up, never finished onboarding).
const PROFILELESS = [
  { key: 'newbie', player: 'Chris', team: CR, roles: [R.RAIDER] },
  { key: 'ghost', player: 'Mats', team: TP, roles: [R.RAIDER] },
];

/** IUser (GET admin/users). Admin list has no nested profile/reservations. */
export const USERS = [
  ...RAIDERS.map((r) => ({
    id: r.userId,
    email: r.email,
    googleId: `google-${r.key}`,
    displayName: r.player,
    roles: r.roles,
    team: r.team,
    battletag: r.battletag,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  })),
  ...PROFILELESS.map((p, i) => ({
    id: `user-${p.key}`,
    email: `${p.player.toLowerCase()}@example.com`,
    googleId: `google-${p.key}`,
    displayName: p.player,
    roles: p.roles,
    team: p.team,
    battletag: null,
    createdAt: iso(-3 - i, 20),
    updatedAt: iso(-3 - i, 20),
  })),
];

export const userById = (id) => USERS.find((u) => u.id === id);

// ── Personas ────────────────────────────────────────────────────────────────────
// `raider`/`admin`/`superadmin` map onto real roster users so the data behind them is consistent.
// NOTE superadmin = [raider, admin, super_admin]: the real super user always has the admin role too
// (user.use-case.ts pushes ADMIN and SUPER_ADMIN), and /admin/* is guarded by adminGuard (needs ADMIN).
export const PERSONAS = {
  guest: { userKey: null, token: false, description: 'not logged in (login page, public routes)' },
  raider: { userKey: 'arcanis', token: true, description: 'plain raider (Fire Mage, Crusaders)' },
  admin: { userKey: 'lightsworn', token: true, description: 'team admin (Holy Paladin, Crusaders)' },
  superadmin: { userKey: 'dawnpriest', token: true, description: 'super user (Holy Priest, Crusaders), sees both teams' },
  newbie: { userKey: 'newbie', token: true, description: 'logged in, no raider profile yet (-> onboarding)' },
};

/** Auth user (GET auth/me) for a user id. */
export function authUserOf(userId) {
  const u = userById(userId);
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatarUrl: undefined,
    roles: u.roles,
    team: u.team,
    bnetLinked: !!u.battletag,
    battletag: u.battletag,
  };
}
