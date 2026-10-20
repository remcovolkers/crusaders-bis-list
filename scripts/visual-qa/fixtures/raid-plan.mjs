// Raid plans: list + one fully populated plan (20 raiders in groups 1-4, bench, absent) with boss notes.
import { RaidDifficulty, RaidParticipantRole as Role, Team } from './domain.mjs';
import { BOSSES, SEASON_ID, PREVIOUS_SEASON, SEASON } from './catalog.mjs';
import { RAIDERS } from './people.mjs';
import { iso, thumb } from './helpers.mjs';

export const SEASONS = [SEASON, PREVIOUS_SEASON];

const crusaders = RAIDERS.filter((r) => r.team === Team.CRUSADERS);
const GROUPS = [
  ['thorgrim', 'bloodmourne', 'lightsworn', 'mistwalker', 'arcanis'],
  ['sylvanar', 'dawnpriest', 'tidecaller', 'shadowstep', 'felhunter'],
  ['starfall', 'dreadlock', 'eaglefury', 'stormcaller', 'embershard'],
  ['ironhide', 'frostbane', 'shadowweave', 'justicar', 'tigerpaw'],
];
const BENCH = ['pyromancer', 'gardener'];
const ABSENT = ['longshot', 'timewarden'];

export const PLAN_ID = 'plan-1';

function participant(planId, key, role, groupNumber) {
  const r = RAIDERS.find((x) => x.key === key);
  return {
    id: `part-${planId}-${key}`,
    raidPlanId: planId,
    userId: r.userId,
    displayName: r.player,
    characterName: r.characterName,
    wowClass: r.wowClass,
    spec: r.spec,
    role,
    groupNumber,
  };
}

function participants(planId) {
  return [
    ...GROUPS.flatMap((g, gi) => g.map((k) => participant(planId, k, Role.RAIDER, gi + 1))),
    ...BENCH.map((k) => participant(planId, k, Role.BENCH, null)),
    ...ABSENT.map((k) => participant(planId, k, Role.ABSENT, null)),
  ];
}

const plan = (id, over) => ({
  id,
  raidSeasonId: SEASON_ID,
  raidName: 'The Venomous Abyss + The Tidebound Grotto',
  difficulty: RaidDifficulty.HEROIC,
  scheduledAt: iso(1, 18, 30),
  notes:
    'Pull om 20:45, buffs en flasks klaar om 20:30.\nTanks: Thorgrim start op Nek\'zali, wissel bij 3 stacks.\nHeals: Mistwalker op de externals rooster.',
  scheduledDiscordAt: iso(0, 18, 0),
  discordSentAt: null,
  createdAt: iso(-4, 12),
  updatedAt: iso(-1, 9),
  ...over,
});

export const RAID_PLANS = [
  plan(PLAN_ID, { participants: participants(PLAN_ID) }),
  plan('plan-2', {
    raidName: "The Unbinding of Kith'ix",
    difficulty: RaidDifficulty.MYTHIC,
    scheduledAt: iso(8, 18, 30),
    notes: 'Mythic progress, alleen de vaste 20.',
    scheduledDiscordAt: null,
    participants: participants('plan-2').map((p) => ({ ...p, role: p.role === Role.ABSENT ? Role.BENCH : p.role })),
  }),
  plan('plan-3', {
    raidName: 'The Venomous Abyss',
    difficulty: RaidDifficulty.NORMAL,
    scheduledAt: iso(-6, 18, 30),
    notes: undefined,
    discordSentAt: iso(-7, 16, 0),
    scheduledDiscordAt: iso(-7, 16, 0),
    participants: participants('plan-3').slice(0, 16),
  }),
  plan('plan-4', {
    raidName: 'The Venomous Abyss',
    difficulty: RaidDifficulty.HEROIC,
    scheduledAt: iso(-13, 18, 30),
    discordSentAt: iso(-14, 16, 0),
    scheduledDiscordAt: iso(-14, 16, 0),
    participants: participants('plan-4'),
  }),
];

export const planById = (id) => RAID_PLANS.find((p) => p.id === id);

// ── Boss notes for the main plan ───────────────────────────────────────────────
const NOTE_DEFS = [
  ['nymrissa', 'farm', 'Kill in <3 min. Healers: cooldowns bij de tweede golf.', []],
  [
    'nekzali',
    'progression',
    'Fase 2: tanks wisselen bij 3 stacks.\nRange: spreid tijdens Coil Crush.\nBloodlust bij 35%.',
    [
      ['youtube', 'Nek\'zali Heroic guide (Method)', 'https://www.youtube.com/watch?v=mock-nekzali'],
      ['link', 'WoWhead encounter notes', 'https://www.wowhead.com/guide/mock-nekzali'],
    ],
  ],
  ['sentinels', 'progression', 'Stenen 1 en 2 tegelijk, kicks op Stone Slam.', [['youtube', 'Entombed Sentinels quick guide', 'https://www.youtube.com/watch?v=mock-sentinels']]],
  ['explorers', 'farm', '', []],
  ['vashnik', 'progression', 'Gifstacks: dispel bij 4. Raid cooldown op de intermission.', []],
  ['sszorak', 'skip', 'Deze week overslaan, we mikken eerst op Vashnik.', []],
];

export const BOSS_NOTES = NOTE_DEFS.map(([key, status, notes, resources], i) => {
  const boss = BOSSES.find((b) => b.id === `boss-${key}`);
  const id = `note-${key}`;
  return {
    id,
    raidPlanId: PLAN_ID,
    bossId: boss.id,
    notes,
    status,
    resources: resources.map(([type, title, url], j) => ({
      id: `res-${key}-${j}`,
      bossNoteId: id,
      url,
      title,
      type,
      ...(type === 'youtube' ? { thumbnailUrl: thumb(url, title) } : {}),
    })),
    createdAt: iso(-3, 12),
    updatedAt: iso(-1 - i * 0.1, 18),
  };
});

