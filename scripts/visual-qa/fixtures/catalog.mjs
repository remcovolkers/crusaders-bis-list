// Season, bosses and the loot catalog (items incl. super-rare, merged toggle items and tier tokens).
// Mirrors the active backend season "Midnight - Season 2 (Tier 36)" (see
// libs/backend/application/src/lib/seasons/midnight-t36.season.ts). Item names are made up.
import { ArmorType, ItemCategory, PrimaryStat as S, Team, WeaponType as W } from './domain.mjs';
import { icon, iso } from './helpers.mjs';

export const SEASON_ID = 'season-midnight-s2';

export const SEASON = {
  id: SEASON_ID,
  name: 'Midnight - Season 2 (Tier 36)',
  slug: 'midnight-s2-t36',
  isActive: true,
  startDate: iso(-35, 0),
};

export const PREVIOUS_SEASON = {
  id: 'season-midnight-s1',
  name: 'Midnight - Season 1 (Tier 35)',
  slug: 'midnight-s1-t35',
  isActive: false,
  startDate: iso(-140, 0),
  endDate: iso(-36, 0),
};

const RAIDS = [
  { id: 1317, name: 'The Tidebound Grotto', color: '#0ea5e9' },
  { id: 1320, name: 'The Venomous Abyss', color: '#16a34a' },
  { id: 1324, name: "The Unbinding of Kith'ix", color: '#7c3aed' },
];

const BOSS_DEFS = [
  { key: 'nymrissa', name: 'Nymrissa Wavecaller', raid: 0, enc: 2849 },
  { key: 'nekzali', name: "Nek'zali the Soulcoiler", raid: 1, enc: 2888 },
  { key: 'sentinels', name: 'Entombed Sentinels', raid: 1, enc: 2874 },
  { key: 'explorers', name: 'The Lost Explorers', raid: 1, enc: 2894 },
  { key: 'vashnik', name: 'Vashnik the Malignant', raid: 1, enc: 2882 },
  { key: 'sszorak', name: 'Sszorak', raid: 1, enc: 2871 },
  { key: 'fangs', name: 'The Twin Fangs', raid: 1, enc: 2887 },
  { key: 'altar', name: 'The Coiled Altar', raid: 1, enc: 2883 },
  { key: 'ulatek', name: "Ula'tek", raid: 1, enc: 2895 },
  { key: 'kithix', name: "Kith'ix", raid: 2, enc: 2896 },
];

export const BOSSES = BOSS_DEFS.map((b, i) => ({
  id: `boss-${b.key}`,
  name: b.name,
  raidSeasonId: SEASON_ID,
  raidId: RAIDS[b.raid].id,
  raidName: RAIDS[b.raid].name,
  raidAccentColor: RAIDS[b.raid].color,
  wowEncounterId: b.enc,
  order: i + 1,
}));

// ── item builders ───────────────────────────────────────────────────────────────
let nextWowId = 249000;
const T = (name, stats, extra = {}) => ({ name, kind: 'trinket', stats, ...extra });
const Wp = (name, weaponType, stats, slot = 'One-Hand', extra = {}) => ({
  name,
  kind: 'weapon',
  weaponType,
  stats,
  slot,
  ...extra,
});
const Of = (name, weaponType, stats, slot = 'Held In Off-hand', extra = {}) => ({
  name,
  kind: 'offhand',
  weaponType,
  stats,
  slot,
  ...extra,
});
const J = (name, slot, extra = {}) => ({ name, kind: 'jewelry', slot, ...extra });
const A = (name, armorType, slot, extra = {}) => ({ name, kind: 'armor', armorType, slot, ...extra });
const tokens = (word, slot) => [
  A(`Venomforged ${word}`, ArmorType.PLATE, `Tier: ${slot}`, { token: true }),
  A(`Venomcured ${word}`, ArmorType.LEATHER, `Tier: ${slot}`, { token: true }),
  A(`Venomcast ${word}`, ArmorType.MAIL, `Tier: ${slot}`, { token: true }),
  A(`Venomwoven ${word}`, ArmorType.CLOTH, `Tier: ${slot}`, { token: true }),
];

const LOOT = {
  nymrissa: [
    T("Tidecaller's Pearl", [S.INTELLECT]),
    Wp('Wavecrest Trident', W.POLEARM, [S.STRENGTH], 'Two-Hand'),
    Wp('Brinebite Dagger', W.DAGGER, [S.AGILITY]),
    J('Brineheart Choker', 'Neck'),
    A('Gale-Lashed Mantle', ArmorType.CLOTH, 'Shoulders'),
    A('Sea-Scarred Treads', ArmorType.LEATHER, 'Feet'),
    A('Kelpwoven Girdle', ArmorType.MAIL, 'Waist'),
    A('Tidal Bulwark Greaves', ArmorType.PLATE, 'Legs'),
  ],
  nekzali: [
    T("Soulcoiler's Fang", [S.AGILITY], { superRare: true }),
    Wp("Nek'zali's Coiled Greataxe", W.AXE_2H, [S.STRENGTH], 'Two-Hand'),
    Wp('Venomspire Staff', W.STAFF, [S.INTELLECT], 'Two-Hand'),
    J('Fangbound Signet', 'Finger'),
    A('Scaleguard Helm', ArmorType.PLATE, 'Head'),
    A('Serpentine Wraps', ArmorType.LEATHER, 'Wrist'),
    A('Venomsilk Robes', ArmorType.CLOTH, 'Chest'),
    A('Hissing Chainmail Gloves', ArmorType.MAIL, 'Hands'),
  ],
  sentinels: [
    T('Sentinel Sigil of Stone', [S.STRENGTH, S.AGILITY]),
    Of('Tomb-Warden Shield', W.SHIELD, [S.STRENGTH], 'Shield'),
    Wp('Gravebound Mace', W.MACE_1H, [S.INTELLECT]),
    J('Cloak of Entombed Whispers', 'Back'),
    A('Crypt-Plate Pauldrons', ArmorType.PLATE, 'Shoulders'),
    A('Tombstalker Mask', ArmorType.LEATHER, 'Head'),
    ...tokens('Idol', 'Hands'),
  ],
  explorers: [
    T("Explorer's Cracked Compass", [S.INTELLECT], { superRare: true }),
    Wp('Expedition Warglaive', W.WARGLAIVE, [S.AGILITY]),
    Wp("Lost Mapmaker's Wand", W.WAND, [S.INTELLECT]),
    J("Pathfinder's Ring", 'Finger'),
    A('Weathered Scholar Cowl', ArmorType.CLOTH, 'Head'),
    A("Delver's Boots", ArmorType.MAIL, 'Feet'),
    A('Ruinwalker Gauntlets', ArmorType.PLATE, 'Hands'),
    ...tokens('Remnant', 'Shoulders'),
  ],
  vashnik: [
    T('Malignant Venom Vial', [S.INTELLECT, S.AGILITY, S.STRENGTH], { superRare: true }),
    Wp("Vashnik's Rotfang Blade", W.SWORD_1H, [S.AGILITY]),
    Wp('Spine of the Malignant', W.SWORD_2H, [S.STRENGTH], 'Two-Hand'),
    Of('Venomed Grimoire', W.OFFHAND, [S.INTELLECT]),
    J('Toxic Heartlocket', 'Neck'),
    A('Bile-Stained Breastplate', ArmorType.PLATE, 'Chest'),
    A("Lurker's Leggings", ArmorType.LEATHER, 'Legs'),
    ...tokens('Icon', 'Chest'),
  ],
  sszorak: [
    T("Sszorak's Shed Scale", [S.AGILITY]),
    Wp('Sszorak Spine-Crossbow', W.CROSSBOW, [S.AGILITY], 'Ranged'),
    Wp('Coilcrusher Maul', W.MACE_2H, [S.STRENGTH], 'Two-Hand'),
    J("Sszorak's Scaled Mantle", 'Back'),
    A('Adder-Fang Belt', ArmorType.MAIL, 'Waist'),
    A('Hoodwinked Handwraps', ArmorType.CLOTH, 'Hands'),
    A('Pit-Viper Legplates', ArmorType.PLATE, 'Legs'),
    ...tokens('Relic', 'Legs'),
  ],
  fangs: [
    T('Twin Fang Talisman', [S.STRENGTH]),
    Wp('Left Fang', W.DAGGER, [S.INTELLECT]),
    Wp('Right Fang', W.FIST, [S.AGILITY]),
    Wp('Fang-Strung Longbow', W.BOW, [S.AGILITY], 'Ranged'),
    J('Venomous Band of Dusk', 'Finger'),
    A('Dualhood of the Serpent', ArmorType.LEATHER, 'Head'),
    A('Twinscale Warhelm', ArmorType.PLATE, 'Head'),
    ...tokens('Effigy', 'Head'),
  ],
  altar: [
    T('Heart of the Coiled Altar', [S.INTELLECT], { superRare: true }),
    Wp("Altar-Keeper's Scepter", W.MACE_1H, [S.INTELLECT]),
    Wp('Ritual Gun of Sacrifice', W.GUN, [S.AGILITY], 'Ranged'),
    Of('Offering Bowl', W.OFFHAND, [S.INTELLECT]),
    J("Priest-King's Medallion", 'Neck'),
    A('Venom-Soaked Sash', ArmorType.CLOTH, 'Waist'),
    A('Altar Guard Vambraces', ArmorType.PLATE, 'Wrist'),
    A('Sacrificial Mail Spaulders', ArmorType.MAIL, 'Shoulders'),
  ],
  ulatek: [
    T('Radiant Venomfang', [S.INTELLECT], {
      merged: 'primary',
      pair: 'fang',
      mergedDisplayName: 'Radiant / Umbral Venomfang',
    }),
    T('Umbral Venomfang', [S.INTELLECT], { merged: 'secondary', pair: 'fang' }),
    Wp("Ula'tek's Crown-Cleaver", W.AXE_1H, [S.STRENGTH], 'One-Hand', { superRare: true }),
    Wp('Hatchling Scythe', W.POLEARM, [S.AGILITY], 'Two-Hand'),
    Wp("Venom Queen's Staff", W.STAFF, [S.INTELLECT], 'Two-Hand'),
    J('Eye of the Venom Queen', 'Neck'),
    J('Ring of Poisoned Glory', 'Finger'),
    A('Queensguard Plate Chestguard', ArmorType.PLATE, 'Chest'),
    A('Queenwoven Vestments', ArmorType.CLOTH, 'Chest'),
    A('Shed-Skin Jerkin', ArmorType.LEATHER, 'Chest'),
  ],
  kithix: [
    T("Kith'ix's Gaze", [S.INTELLECT], {
      merged: 'primary',
      pair: 'kithix',
      mergedDisplayName: "Kith'ix's Gaze / Grasp",
    }),
    T("Kith'ix's Grasp", [S.INTELLECT], { merged: 'secondary', pair: 'kithix' }),
    Wp('Unbinder Greatsword', W.SWORD_2H, [S.STRENGTH], 'Two-Hand'),
    Wp('Bindbreaker Dagger', W.DAGGER, [S.AGILITY]),
    Wp('Sundered Chain Mace', W.MACE_1H, [S.INTELLECT]),
    J("Unbound Cloak of Kith'ix", 'Back'),
    A('Shackle-Torn Leather Wraps', ArmorType.LEATHER, 'Wrist'),
    A('Unchained Mail Coif', ArmorType.MAIL, 'Head'),
  ],
};

const GLYPH = { trinket: 'T', weapon: 'W', offhand: 'O', jewelry: 'J', armor: 'A' };
const CATEGORY = {
  trinket: ItemCategory.TRINKET,
  weapon: ItemCategory.WEAPON,
  offhand: ItemCategory.OFFHAND,
  jewelry: ItemCategory.JEWELRY,
  armor: ItemCategory.OTHER, // the sync stores every armor piece / tier token as category OTHER
};
const ILVL = { trinket: 282, weapon: 282, offhand: 282, jewelry: 279, armor: 276 };

/** All catalog items (without per-team super-rare flag). `_superRare` is internal metadata. */
export const ITEMS = [];
const primaryByPair = {};
for (const boss of BOSSES) {
  const key = boss.id.replace('boss-', '');
  for (const row of LOOT[key]) {
    const wowItemId = nextWowId++;
    const item = {
      id: `item-${wowItemId}`,
      name: row.name,
      wowItemId,
      category: CATEGORY[row.kind],
      armorType: row.kind === 'armor' ? row.armorType : ArmorType.NONE,
      slot: row.slot ?? (row.kind === 'trinket' ? 'Trinket' : 'Misc'),
      itemLevel: row.token ? 276 : ILVL[row.kind],
      primaryStats: row.stats ?? [],
      bossId: boss.id,
      bossName: boss.name,
      iconUrl: icon(row.name, row.token ? 'T' : GLYPH[row.kind]),
      isPrioritizable: true,
      isSuperRare: false,
      _superRare: !!row.superRare,
    };
    if (row.weaponType) item.weaponType = row.weaponType;
    if (row.merged === 'primary') {
      item.mergedDisplayName = row.mergedDisplayName;
      primaryByPair[row.pair] = item;
    }
    if (row.merged === 'secondary') item.mergedWithItemId = primaryByPair[row.pair].wowItemId;
    ITEMS.push(item);
  }
}

// Super-rare flags are per team: Crusaders and Templars configure them separately.
const TEMPLAR_EXTRA_SUPER_RARE = new Set(['Radiant Venomfang']);
const TEMPLAR_NO_SUPER_RARE = new Set(["Explorer's Cracked Compass"]);

export function itemsForTeam(team) {
  return ITEMS.map(({ _superRare, ...item }) => {
    let rare = _superRare;
    if (team === Team.TEMPLARS) {
      if (TEMPLAR_EXTRA_SUPER_RARE.has(item.name)) rare = true;
      if (TEMPLAR_NO_SUPER_RARE.has(item.name)) rare = false;
    }
    return { ...item, isSuperRare: rare };
  });
}

/** Response of GET raider/catalog and GET admin/catalog (CatalogResponse). */
export function catalogFor(team) {
  const items = itemsForTeam(team);
  return {
    season: SEASON,
    bosses: BOSSES.map((b) => ({ ...b, items: items.filter((i) => i.bossId === b.id) })),
  };
}

export function findItem(itemId, team = Team.CRUSADERS) {
  return itemsForTeam(team).find((i) => i.id === itemId);
}

/** Icon of the merged partner, used as `secondaryIconUrl` in the admin boss view (split icon). */
export function secondaryIconFor(item) {
  if (item.wowItemId == null) return undefined;
  return ITEMS.find((i) => i.mergedWithItemId === item.wowItemId)?.iconUrl;
}
