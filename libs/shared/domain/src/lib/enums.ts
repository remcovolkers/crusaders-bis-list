export enum UserRole {
  RAIDER = 'raider',
  ADMIN = 'admin',
}

export enum ItemCategory {
  TRINKET = 'trinket',
  WEAPON = 'weapon',
  OFFHAND = 'offhand',
  CLOTH = 'cloth',
  LEATHER = 'leather',
  MAIL = 'mail',
  PLATE = 'plate',
  JEWELRY = 'jewelry',
  OTHER = 'other', // legacy fallback
}

export enum ArmorType {
  CLOTH = 'cloth',
  LEATHER = 'leather',
  MAIL = 'mail',
  PLATE = 'plate',
  NONE = 'none',
}

export enum PrimaryStat {
  STRENGTH = 'strength',
  AGILITY = 'agility',
  INTELLECT = 'intellect',
}

export enum AssignmentStatus {
  CHAMPION_TIER = 'champion_tier',
  HERO_TIER = 'hero_tier',
  MYTH_TIER = 'myth_tier',
  NIET_MEER_NODIG = 'niet_meer_nodig',
}

export enum WowClass {
  WARRIOR = 'Warrior',
  PALADIN = 'Paladin',
  HUNTER = 'Hunter',
  ROGUE = 'Rogue',
  PRIEST = 'Priest',
  SHAMAN = 'Shaman',
  MAGE = 'Mage',
  WARLOCK = 'Warlock',
  DRUID = 'Druid',
  DEATH_KNIGHT = 'Death Knight',
  MONK = 'Monk',
  DEMON_HUNTER = 'Demon Hunter',
  EVOKER = 'Evoker',
}

export enum WowSpec {
  // Warrior
  ARMS = 'Arms',
  FURY = 'Fury',
  PROTECTION_WARRIOR = 'Protection (Warrior)',
  // Paladin
  HOLY_PALADIN = 'Holy (Paladin)',
  PROTECTION_PALADIN = 'Protection (Paladin)',
  RETRIBUTION = 'Retribution',
  // Hunter
  BEAST_MASTERY = 'BeastMastery',
  MARKSMANSHIP = 'Marksmanship',
  SURVIVAL = 'Survival',
  // Rogue
  ASSASSINATION = 'Assassination',
  OUTLAW = 'Outlaw',
  SUBTLETY = 'Subtlety',
  // Priest
  DISCIPLINE = 'Discipline',
  HOLY_PRIEST = 'Holy (Priest)',
  SHADOW = 'Shadow',
  // Shaman
  ELEMENTAL = 'Elemental',
  ENHANCEMENT = 'Enhancement',
  RESTORATION_SHAMAN = 'Restoration (Shaman)',
  // Mage
  ARCANE = 'Arcane',
  FIRE = 'Fire',
  FROST_MAGE = 'Frost (Mage)',
  // Warlock
  AFFLICTION = 'Affliction',
  DEMONOLOGY = 'Demonology',
  DESTRUCTION = 'Destruction',
  // Druid
  BALANCE = 'Balance',
  FERAL = 'Feral',
  GUARDIAN = 'Guardian',
  RESTORATION_DRUID = 'Restoration (Druid)',
  // Death Knight
  BLOOD = 'Blood',
  FROST_DK = 'Frost (DK)',
  UNHOLY = 'Unholy',
  // Monk
  BREWMASTER = 'Brewmaster',
  MISTWEAVER = 'Mistweaver',
  WINDWALKER = 'Windwalker',
  // Demon Hunter
  HAVOC = 'Havoc',
  VENGEANCE = 'Vengeance',
  DEVOURER = 'Devourer',
  // Evoker
  DEVASTATION = 'Devastation',
  PRESERVATION = 'Preservation',
  AUGMENTATION = 'Augmentation',
}

export enum RaiderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRIAL = 'trial',
}

export const CLASS_ARMOR_TYPE: Record<WowClass, ArmorType> = {
  [WowClass.WARRIOR]: ArmorType.PLATE,
  [WowClass.PALADIN]: ArmorType.PLATE,
  [WowClass.DEATH_KNIGHT]: ArmorType.PLATE,
  [WowClass.HUNTER]: ArmorType.MAIL,
  [WowClass.SHAMAN]: ArmorType.MAIL,
  [WowClass.EVOKER]: ArmorType.MAIL,
  [WowClass.ROGUE]: ArmorType.LEATHER,
  [WowClass.DRUID]: ArmorType.LEATHER,
  [WowClass.MONK]: ArmorType.LEATHER,
  [WowClass.DEMON_HUNTER]: ArmorType.LEATHER,
  [WowClass.MAGE]: ArmorType.CLOTH,
  [WowClass.WARLOCK]: ArmorType.CLOTH,
  [WowClass.PRIEST]: ArmorType.CLOTH,
};

export const SPEC_PRIMARY_STAT: Record<WowSpec, PrimaryStat> = {
  // Warrior
  [WowSpec.ARMS]: PrimaryStat.STRENGTH,
  [WowSpec.FURY]: PrimaryStat.STRENGTH,
  [WowSpec.PROTECTION_WARRIOR]: PrimaryStat.STRENGTH,
  // Paladin
  [WowSpec.HOLY_PALADIN]: PrimaryStat.INTELLECT,
  [WowSpec.PROTECTION_PALADIN]: PrimaryStat.STRENGTH,
  [WowSpec.RETRIBUTION]: PrimaryStat.STRENGTH,
  // Hunter
  [WowSpec.BEAST_MASTERY]: PrimaryStat.AGILITY,
  [WowSpec.MARKSMANSHIP]: PrimaryStat.AGILITY,
  [WowSpec.SURVIVAL]: PrimaryStat.AGILITY,
  // Rogue
  [WowSpec.ASSASSINATION]: PrimaryStat.AGILITY,
  [WowSpec.OUTLAW]: PrimaryStat.AGILITY,
  [WowSpec.SUBTLETY]: PrimaryStat.AGILITY,
  // Priest
  [WowSpec.DISCIPLINE]: PrimaryStat.INTELLECT,
  [WowSpec.HOLY_PRIEST]: PrimaryStat.INTELLECT,
  [WowSpec.SHADOW]: PrimaryStat.INTELLECT,
  // Shaman
  [WowSpec.ELEMENTAL]: PrimaryStat.INTELLECT,
  [WowSpec.ENHANCEMENT]: PrimaryStat.AGILITY,
  [WowSpec.RESTORATION_SHAMAN]: PrimaryStat.INTELLECT,
  // Mage
  [WowSpec.ARCANE]: PrimaryStat.INTELLECT,
  [WowSpec.FIRE]: PrimaryStat.INTELLECT,
  [WowSpec.FROST_MAGE]: PrimaryStat.INTELLECT,
  // Warlock
  [WowSpec.AFFLICTION]: PrimaryStat.INTELLECT,
  [WowSpec.DEMONOLOGY]: PrimaryStat.INTELLECT,
  [WowSpec.DESTRUCTION]: PrimaryStat.INTELLECT,
  // Druid
  [WowSpec.BALANCE]: PrimaryStat.INTELLECT,
  [WowSpec.FERAL]: PrimaryStat.AGILITY,
  [WowSpec.GUARDIAN]: PrimaryStat.AGILITY,
  [WowSpec.RESTORATION_DRUID]: PrimaryStat.INTELLECT,
  // Death Knight
  [WowSpec.BLOOD]: PrimaryStat.STRENGTH,
  [WowSpec.FROST_DK]: PrimaryStat.STRENGTH,
  [WowSpec.UNHOLY]: PrimaryStat.STRENGTH,
  // Monk
  [WowSpec.BREWMASTER]: PrimaryStat.AGILITY,
  [WowSpec.MISTWEAVER]: PrimaryStat.INTELLECT,
  [WowSpec.WINDWALKER]: PrimaryStat.AGILITY,
  // Demon Hunter
  [WowSpec.HAVOC]: PrimaryStat.AGILITY,
  [WowSpec.VENGEANCE]: PrimaryStat.AGILITY,
  [WowSpec.DEVOURER]: PrimaryStat.INTELLECT,
  // Evoker
  [WowSpec.DEVASTATION]: PrimaryStat.INTELLECT,
  [WowSpec.PRESERVATION]: PrimaryStat.INTELLECT,
  [WowSpec.AUGMENTATION]: PrimaryStat.INTELLECT,
};

export const WOW_CLASS_COLOR: Record<WowClass, string> = {
  [WowClass.WARRIOR]: '#C69B3A',
  [WowClass.PALADIN]: '#F48CBA',
  [WowClass.HUNTER]: '#AAD372',
  [WowClass.ROGUE]: '#FFF468',
  [WowClass.PRIEST]: '#FFFFFF',
  [WowClass.SHAMAN]: '#0070DD',
  [WowClass.MAGE]: '#3FC7EB',
  [WowClass.WARLOCK]: '#8788EE',
  [WowClass.DRUID]: '#FF7C0A',
  [WowClass.DEATH_KNIGHT]: '#C41E3A',
  [WowClass.MONK]: '#00FF98',
  [WowClass.DEMON_HUNTER]: '#A330C9',
  [WowClass.EVOKER]: '#33937F',
};

export const SPECS_BY_CLASS: Record<WowClass, WowSpec[]> = {
  [WowClass.WARRIOR]: [WowSpec.ARMS, WowSpec.FURY, WowSpec.PROTECTION_WARRIOR],
  [WowClass.PALADIN]: [WowSpec.HOLY_PALADIN, WowSpec.PROTECTION_PALADIN, WowSpec.RETRIBUTION],
  [WowClass.HUNTER]: [WowSpec.BEAST_MASTERY, WowSpec.MARKSMANSHIP, WowSpec.SURVIVAL],
  [WowClass.ROGUE]: [WowSpec.ASSASSINATION, WowSpec.OUTLAW, WowSpec.SUBTLETY],
  [WowClass.PRIEST]: [WowSpec.DISCIPLINE, WowSpec.HOLY_PRIEST, WowSpec.SHADOW],
  [WowClass.SHAMAN]: [WowSpec.ELEMENTAL, WowSpec.ENHANCEMENT, WowSpec.RESTORATION_SHAMAN],
  [WowClass.MAGE]: [WowSpec.ARCANE, WowSpec.FIRE, WowSpec.FROST_MAGE],
  [WowClass.WARLOCK]: [WowSpec.AFFLICTION, WowSpec.DEMONOLOGY, WowSpec.DESTRUCTION],
  [WowClass.DRUID]: [WowSpec.BALANCE, WowSpec.FERAL, WowSpec.GUARDIAN, WowSpec.RESTORATION_DRUID],
  [WowClass.DEATH_KNIGHT]: [WowSpec.BLOOD, WowSpec.FROST_DK, WowSpec.UNHOLY],
  [WowClass.MONK]: [WowSpec.BREWMASTER, WowSpec.MISTWEAVER, WowSpec.WINDWALKER],
  [WowClass.DEMON_HUNTER]: [WowSpec.HAVOC, WowSpec.VENGEANCE, WowSpec.DEVOURER],
  [WowClass.EVOKER]: [WowSpec.DEVASTATION, WowSpec.PRESERVATION, WowSpec.AUGMENTATION],
};

export const RESERVABLE_CATEGORIES = new Set<ItemCategory>([
  ItemCategory.TRINKET,
  ItemCategory.WEAPON,
  ItemCategory.OFFHAND,
  ItemCategory.JEWELRY,
  ItemCategory.OTHER,
  ItemCategory.CLOTH,
  ItemCategory.LEATHER,
  ItemCategory.MAIL,
  ItemCategory.PLATE,
]);

/** All armor sub-categories (cloth/leather/mail/plate + legacy OTHER). */
export const ARMOR_ITEM_CATEGORIES: ReadonlySet<ItemCategory> = new Set([
  ItemCategory.CLOTH,
  ItemCategory.LEATHER,
  ItemCategory.MAIL,
  ItemCategory.PLATE,
  ItemCategory.OTHER,
]);

/** Human-readable labels for every ItemCategory (authoritative, used front + back). */
export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  [ItemCategory.TRINKET]: 'Trinket',
  [ItemCategory.WEAPON]: 'Weapon',
  [ItemCategory.OFFHAND]: 'Off-hand',
  [ItemCategory.CLOTH]: 'Cloth',
  [ItemCategory.LEATHER]: 'Leather',
  [ItemCategory.MAIL]: 'Mail',
  [ItemCategory.PLATE]: 'Plate',
  [ItemCategory.JEWELRY]: 'Jewelry',
  [ItemCategory.OTHER]: 'Armor',
};

/** Display labels for loot-assignment tiers. */
export const TIER_LABELS: Record<AssignmentStatus, string> = {
  [AssignmentStatus.CHAMPION_TIER]: 'Champion',
  [AssignmentStatus.HERO_TIER]: 'Heroic',
  [AssignmentStatus.MYTH_TIER]: 'Mythic',
  [AssignmentStatus.NIET_MEER_NODIG]: 'Niet meer nodig',
};

/**
 * Specs that may equip an item in the off-hand slot (includes shields).
 * All other specs dual-wield or use two-handed weapons and cannot use an off-hand.
 */
export const SPECS_WITH_OFFHAND: ReadonlySet<WowSpec> = new Set([
  // Druid
  WowSpec.BALANCE,
  WowSpec.RESTORATION_DRUID,
  // Evoker
  WowSpec.DEVASTATION,
  WowSpec.PRESERVATION,
  WowSpec.AUGMENTATION,
  // Mage
  WowSpec.ARCANE,
  WowSpec.FIRE,
  WowSpec.FROST_MAGE,
  // Monk
  WowSpec.MISTWEAVER,
  // Paladin (shield)
  WowSpec.HOLY_PALADIN,
  WowSpec.PROTECTION_PALADIN,
  // Priest
  WowSpec.DISCIPLINE,
  WowSpec.HOLY_PRIEST,
  WowSpec.SHADOW,
  // Shaman
  WowSpec.ELEMENTAL,
  WowSpec.RESTORATION_SHAMAN,
  // Warrior (shield)
  WowSpec.PROTECTION_WARRIOR,
  // Warlock
  WowSpec.AFFLICTION,
  WowSpec.DEMONOLOGY,
  WowSpec.DESTRUCTION,
]);

/**
 * Subset of SPECS_WITH_OFFHAND that may specifically equip a shield.
 * Enhancement Shaman and other specs that dual-wield are intentionally excluded.
 */
export const SPECS_WITH_SHIELD: ReadonlySet<WowSpec> = new Set([
  WowSpec.HOLY_PALADIN,
  WowSpec.PROTECTION_PALADIN,
  WowSpec.ELEMENTAL,
  WowSpec.RESTORATION_SHAMAN,
  WowSpec.PROTECTION_WARRIOR,
]);

export enum WeaponType {
  AXE_1H = 'axe_1h',
  AXE_2H = 'axe_2h',
  BOW = 'bow',
  CROSSBOW = 'crossbow',
  DAGGER = 'dagger',
  FIST = 'fist',
  GUN = 'gun',
  MACE_1H = 'mace_1h',
  MACE_2H = 'mace_2h',
  POLEARM = 'polearm',
  STAFF = 'staff',
  SWORD_1H = 'sword_1h',
  SWORD_2H = 'sword_2h',
  WAND = 'wand',
  WARGLAIVE = 'warglaive',
  SHIELD = 'shield',
  OTHER = 'other_weapon',
}

/**
 * Classes that may equip a given weapon type.
 * Types not listed here are usable by all classes with the correct primary stat.
 */
export const WEAPON_TYPE_CLASSES: Partial<Record<WeaponType, ReadonlySet<WowClass>>> = {
  [WeaponType.BOW]: new Set([WowClass.HUNTER]),
  [WeaponType.GUN]: new Set([WowClass.HUNTER]),
  [WeaponType.CROSSBOW]: new Set([WowClass.HUNTER]),
  [WeaponType.WAND]: new Set([WowClass.PRIEST, WowClass.MAGE, WowClass.WARLOCK]),
  [WeaponType.WARGLAIVE]: new Set([WowClass.DEMON_HUNTER]),
};

/**
 * Weapon types allowed per spec.
 * When a spec is listed here, only the listed weapon types are shown in the loot UI.
 * This enforces spec-level restrictions (e.g. Rogue Assassination only sees Daggers).
 */
export const SPEC_WEAPON_TYPES: Partial<Record<WowSpec, ReadonlySet<WeaponType>>> = {
  // ── Death Knight ──────────────────────────────────────────────────────
  [WowSpec.BLOOD]: new Set([WeaponType.AXE_2H, WeaponType.MACE_2H, WeaponType.SWORD_2H, WeaponType.POLEARM]),
  [WowSpec.FROST_DK]: new Set([
    WeaponType.AXE_1H,
    WeaponType.AXE_2H,
    WeaponType.MACE_1H,
    WeaponType.MACE_2H,
    WeaponType.SWORD_1H,
    WeaponType.SWORD_2H,
    WeaponType.POLEARM,
  ]),
  [WowSpec.UNHOLY]: new Set([WeaponType.AXE_2H, WeaponType.MACE_2H, WeaponType.SWORD_2H, WeaponType.POLEARM]),
  // ── Demon Hunter ─────────────────────────────────────────────────────
  [WowSpec.HAVOC]: new Set([WeaponType.WARGLAIVE, WeaponType.SWORD_1H, WeaponType.AXE_1H, WeaponType.FIST]),
  [WowSpec.VENGEANCE]: new Set([WeaponType.WARGLAIVE, WeaponType.SWORD_1H, WeaponType.AXE_1H, WeaponType.FIST]),
  [WowSpec.DEVOURER]: new Set([WeaponType.WARGLAIVE, WeaponType.SWORD_1H, WeaponType.FIST]),
  // ── Druid ─────────────────────────────────────────────────────────────
  [WowSpec.BALANCE]: new Set([WeaponType.STAFF, WeaponType.DAGGER, WeaponType.MACE_1H]),
  [WowSpec.FERAL]: new Set([WeaponType.POLEARM, WeaponType.STAFF]),
  [WowSpec.GUARDIAN]: new Set([WeaponType.POLEARM, WeaponType.STAFF]),
  [WowSpec.RESTORATION_DRUID]: new Set([WeaponType.STAFF, WeaponType.DAGGER, WeaponType.MACE_1H]),
  // ── Evoker ────────────────────────────────────────────────────────────
  [WowSpec.DEVASTATION]: new Set([
    WeaponType.STAFF,
    WeaponType.DAGGER,
    WeaponType.SWORD_1H,
    WeaponType.MACE_1H,
    WeaponType.AXE_1H,
  ]),
  [WowSpec.PRESERVATION]: new Set([
    WeaponType.STAFF,
    WeaponType.DAGGER,
    WeaponType.SWORD_1H,
    WeaponType.MACE_1H,
    WeaponType.AXE_1H,
  ]),
  [WowSpec.AUGMENTATION]: new Set([
    WeaponType.STAFF,
    WeaponType.DAGGER,
    WeaponType.SWORD_1H,
    WeaponType.MACE_1H,
    WeaponType.AXE_1H,
  ]),
  // ── Hunter ────────────────────────────────────────────────────────────
  [WowSpec.BEAST_MASTERY]: new Set([WeaponType.BOW, WeaponType.CROSSBOW, WeaponType.GUN]),
  [WowSpec.MARKSMANSHIP]: new Set([WeaponType.BOW, WeaponType.CROSSBOW, WeaponType.GUN]),
  [WowSpec.SURVIVAL]: new Set([WeaponType.POLEARM, WeaponType.STAFF, WeaponType.SWORD_2H, WeaponType.AXE_2H]),
  // ── Mage ──────────────────────────────────────────────────────────────
  [WowSpec.ARCANE]: new Set([WeaponType.STAFF, WeaponType.DAGGER, WeaponType.SWORD_1H, WeaponType.WAND]),
  [WowSpec.FIRE]: new Set([WeaponType.STAFF, WeaponType.DAGGER, WeaponType.SWORD_1H, WeaponType.WAND]),
  [WowSpec.FROST_MAGE]: new Set([WeaponType.STAFF, WeaponType.DAGGER, WeaponType.SWORD_1H, WeaponType.WAND]),
  // ── Monk ──────────────────────────────────────────────────────────────
  [WowSpec.BREWMASTER]: new Set([
    WeaponType.STAFF,
    WeaponType.POLEARM,
    WeaponType.SWORD_1H,
    WeaponType.MACE_1H,
    WeaponType.AXE_1H,
    WeaponType.FIST,
  ]),
  [WowSpec.MISTWEAVER]: new Set([WeaponType.STAFF, WeaponType.SWORD_1H, WeaponType.MACE_1H]),
  [WowSpec.WINDWALKER]: new Set([WeaponType.SWORD_1H, WeaponType.MACE_1H, WeaponType.AXE_1H, WeaponType.FIST]),
  // ── Paladin ───────────────────────────────────────────────────────────
  [WowSpec.HOLY_PALADIN]: new Set([
    WeaponType.SWORD_1H,
    WeaponType.MACE_1H,
    WeaponType.SWORD_2H,
    WeaponType.MACE_2H,
    WeaponType.POLEARM,
  ]),
  [WowSpec.PROTECTION_PALADIN]: new Set([WeaponType.SWORD_1H, WeaponType.MACE_1H, WeaponType.AXE_1H]),
  [WowSpec.RETRIBUTION]: new Set([WeaponType.SWORD_2H, WeaponType.AXE_2H, WeaponType.MACE_2H, WeaponType.POLEARM]),
  // ── Priest ────────────────────────────────────────────────────────────
  [WowSpec.DISCIPLINE]: new Set([WeaponType.STAFF, WeaponType.DAGGER, WeaponType.MACE_1H, WeaponType.WAND]),
  [WowSpec.HOLY_PRIEST]: new Set([WeaponType.STAFF, WeaponType.DAGGER, WeaponType.MACE_1H, WeaponType.WAND]),
  [WowSpec.SHADOW]: new Set([WeaponType.STAFF, WeaponType.DAGGER, WeaponType.MACE_1H, WeaponType.WAND]),
  // ── Rogue ─────────────────────────────────────────────────────────────
  [WowSpec.ASSASSINATION]: new Set([WeaponType.DAGGER]),
  [WowSpec.OUTLAW]: new Set([
    WeaponType.SWORD_1H,
    WeaponType.AXE_1H,
    WeaponType.MACE_1H,
    WeaponType.FIST,
    WeaponType.DAGGER,
  ]),
  [WowSpec.SUBTLETY]: new Set([WeaponType.DAGGER]),
  // ── Shaman ────────────────────────────────────────────────────────────
  [WowSpec.ELEMENTAL]: new Set([WeaponType.STAFF, WeaponType.MACE_1H, WeaponType.DAGGER, WeaponType.FIST]),
  [WowSpec.ENHANCEMENT]: new Set([WeaponType.MACE_1H, WeaponType.AXE_1H, WeaponType.FIST]),
  [WowSpec.RESTORATION_SHAMAN]: new Set([WeaponType.STAFF, WeaponType.MACE_1H, WeaponType.DAGGER, WeaponType.FIST]),
  // ── Warlock ───────────────────────────────────────────────────────────
  [WowSpec.AFFLICTION]: new Set([WeaponType.STAFF, WeaponType.DAGGER, WeaponType.SWORD_1H, WeaponType.WAND]),
  [WowSpec.DEMONOLOGY]: new Set([WeaponType.STAFF, WeaponType.DAGGER, WeaponType.SWORD_1H, WeaponType.WAND]),
  [WowSpec.DESTRUCTION]: new Set([WeaponType.STAFF, WeaponType.DAGGER, WeaponType.SWORD_1H, WeaponType.WAND]),
  // ── Warrior ───────────────────────────────────────────────────────────
  [WowSpec.ARMS]: new Set([WeaponType.SWORD_2H, WeaponType.AXE_2H, WeaponType.MACE_2H, WeaponType.POLEARM]),
  [WowSpec.FURY]: new Set([
    WeaponType.SWORD_1H,
    WeaponType.SWORD_2H,
    WeaponType.AXE_1H,
    WeaponType.AXE_2H,
    WeaponType.MACE_1H,
    WeaponType.MACE_2H,
    WeaponType.POLEARM,
    WeaponType.FIST,
  ]),
  [WowSpec.PROTECTION_WARRIOR]: new Set([WeaponType.SWORD_1H, WeaponType.AXE_1H, WeaponType.MACE_1H]),
};

/**
 * Returns true if a class+spec combination may reserve this item.
 *
 * Armor: compared against armorType (all armor is stored as category OTHER with
 * an armorType sub-field). ArmorType.NONE means a tier token → visible to all.
 * Weapons: checked against SPEC_WEAPON_TYPES first (spec-level restriction),
 * falling back to WEAPON_TYPE_CLASSES (class-level), then primary stat.
 * Everything else (trinkets, jewelry, …) is always allowed.
 */
export function canClassReserveItem(
  wowClass: WowClass,
  spec: WowSpec,
  item: {
    category: ItemCategory;
    armorType?: ArmorType;
    slot?: string;
    primaryStat?: PrimaryStat;
    weaponType?: WeaponType;
  },
): boolean {
  // ── Armor ──────────────────────────────────────────────────────────────
  if (item.category === ItemCategory.OTHER) {
    const at = item.armorType;
    if (!at || at === ArmorType.NONE) return true; // tier token: everyone
    return (CLASS_ARMOR_TYPE[wowClass] as string) === (at as string);
  }

  // ── Weapons ─────────────────────────────────────────────────────────────
  if (item.category === ItemCategory.WEAPON) {
    if (item.weaponType) {
      const specAllowed = SPEC_WEAPON_TYPES[spec];
      if (specAllowed) {
        // Spec-level restriction takes full priority
        if (!specAllowed.has(item.weaponType)) return false;
      } else {
        // Fall back to class-level restriction for specs not in SPEC_WEAPON_TYPES
        const eligible = WEAPON_TYPE_CLASSES[item.weaponType];
        if (eligible && !eligible.has(wowClass)) return false;
      }
    }
    if (item.primaryStat) {
      return SPEC_PRIMARY_STAT[spec] === item.primaryStat;
    }
    return true;
  }

  // ── Off-hands (including shields) ────────────────────────────────────────
  if (item.category === ItemCategory.OFFHAND) {
    // Most specs dual-wield or use 2H and cannot equip an off-hand at all
    if (!SPECS_WITH_OFFHAND.has(spec)) return false;
    // Shields are further restricted to tank/healer specs
    if (item.weaponType === WeaponType.SHIELD && !SPECS_WITH_SHIELD.has(spec)) return false;
    if (item.primaryStat) {
      return SPEC_PRIMARY_STAT[spec] === item.primaryStat;
    }
    return true;
  }

  // ── Everything else (trinkets, jewelry, …) ────────────────────────────
  if (item.primaryStat) {
    return SPEC_PRIMARY_STAT[spec] === item.primaryStat;
  }
  return true;
}

/** Tiers a raider can mark an item as "already received". */
export const RECEIVABLE_TIERS: ReadonlyArray<AssignmentStatus> = [
  AssignmentStatus.CHAMPION_TIER,
  AssignmentStatus.HERO_TIER,
  AssignmentStatus.MYTH_TIER,
];
