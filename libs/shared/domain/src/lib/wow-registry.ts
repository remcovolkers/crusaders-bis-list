import { ArmorType } from './enums/armor-type.enum';
import { PrimaryStat } from './enums/primary-stat.enum';
import { WowClass } from './enums/wow-class.enum';
import { WowSpec } from './enums/wow-spec.enum';
import { WeaponType } from './enums/weapon-type.enum';
import { IItem } from './models/raid.model';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface IWowClassData {
  id: WowClass;
  armorType: ArmorType;
  /** Official hex color used in the WoW UI */
  color: string;
  specs: WowSpec[];
}

export interface IWowSpecData {
  id: WowSpec;
  class: WowClass;
  primaryStat: PrimaryStat;
  /** Weapon types this spec can equip (used for frontend item filtering) */
  usableWeaponTypes: WeaponType[];
}

// ── Class Registry ───────────────────────────────────────────────────────────

export const WOW_CLASS_REGISTRY: Record<WowClass, IWowClassData> = {
  [WowClass.WARRIOR]: {
    id: WowClass.WARRIOR,
    armorType: ArmorType.PLATE,
    color: '#C69B3A',
    specs: [WowSpec.ARMS, WowSpec.FURY, WowSpec.PROTECTION_WARRIOR],
  },
  [WowClass.PALADIN]: {
    id: WowClass.PALADIN,
    armorType: ArmorType.PLATE,
    color: '#F48CBA',
    specs: [WowSpec.HOLY_PALADIN, WowSpec.PROTECTION_PALADIN, WowSpec.RETRIBUTION],
  },
  [WowClass.HUNTER]: {
    id: WowClass.HUNTER,
    armorType: ArmorType.MAIL,
    color: '#AAD372',
    specs: [WowSpec.BEAST_MASTERY, WowSpec.MARKSMANSHIP, WowSpec.SURVIVAL],
  },
  [WowClass.ROGUE]: {
    id: WowClass.ROGUE,
    armorType: ArmorType.LEATHER,
    color: '#FFF468',
    specs: [WowSpec.ASSASSINATION, WowSpec.OUTLAW, WowSpec.SUBTLETY],
  },
  [WowClass.PRIEST]: {
    id: WowClass.PRIEST,
    armorType: ArmorType.CLOTH,
    color: '#FFFFFF',
    specs: [WowSpec.DISCIPLINE, WowSpec.HOLY_PRIEST, WowSpec.SHADOW],
  },
  [WowClass.SHAMAN]: {
    id: WowClass.SHAMAN,
    armorType: ArmorType.MAIL,
    color: '#0070DD',
    specs: [WowSpec.ELEMENTAL, WowSpec.ENHANCEMENT, WowSpec.RESTORATION_SHAMAN],
  },
  [WowClass.MAGE]: {
    id: WowClass.MAGE,
    armorType: ArmorType.CLOTH,
    color: '#3FC7EB',
    specs: [WowSpec.ARCANE, WowSpec.FIRE, WowSpec.FROST_MAGE],
  },
  [WowClass.WARLOCK]: {
    id: WowClass.WARLOCK,
    armorType: ArmorType.CLOTH,
    color: '#8788EE',
    specs: [WowSpec.AFFLICTION, WowSpec.DEMONOLOGY, WowSpec.DESTRUCTION],
  },
  [WowClass.DRUID]: {
    id: WowClass.DRUID,
    armorType: ArmorType.LEATHER,
    color: '#FF7C0A',
    specs: [WowSpec.BALANCE, WowSpec.FERAL, WowSpec.GUARDIAN, WowSpec.RESTORATION_DRUID],
  },
  [WowClass.DEATH_KNIGHT]: {
    id: WowClass.DEATH_KNIGHT,
    armorType: ArmorType.PLATE,
    color: '#C41E3A',
    specs: [WowSpec.BLOOD, WowSpec.FROST_DK, WowSpec.UNHOLY],
  },
  [WowClass.MONK]: {
    id: WowClass.MONK,
    armorType: ArmorType.LEATHER,
    color: '#00FF98',
    specs: [WowSpec.BREWMASTER, WowSpec.MISTWEAVER, WowSpec.WINDWALKER],
  },
  [WowClass.DEMON_HUNTER]: {
    id: WowClass.DEMON_HUNTER,
    armorType: ArmorType.LEATHER,
    color: '#A330C9',
    specs: [WowSpec.HAVOC, WowSpec.VENGEANCE, WowSpec.DEVOURER],
  },
  [WowClass.EVOKER]: {
    id: WowClass.EVOKER,
    armorType: ArmorType.MAIL,
    color: '#33937F',
    specs: [WowSpec.DEVASTATION, WowSpec.PRESERVATION, WowSpec.AUGMENTATION],
  },
};

// ── Spec Registry ────────────────────────────────────────────────────────────

export const WOW_SPEC_REGISTRY: Record<WowSpec, IWowSpecData> = {
  // ── Warrior ──
  [WowSpec.ARMS]: {
    id: WowSpec.ARMS,
    class: WowClass.WARRIOR,
    primaryStat: PrimaryStat.STRENGTH,
    usableWeaponTypes: [WeaponType.AXE_2H, WeaponType.MACE_2H, WeaponType.SWORD_2H, WeaponType.POLEARM],
  },
  [WowSpec.FURY]: {
    id: WowSpec.FURY,
    class: WowClass.WARRIOR,
    primaryStat: PrimaryStat.STRENGTH,
    usableWeaponTypes: [
      WeaponType.AXE_1H,
      WeaponType.AXE_2H,
      WeaponType.MACE_1H,
      WeaponType.MACE_2H,
      WeaponType.SWORD_1H,
      WeaponType.SWORD_2H,
      WeaponType.DAGGER,
      WeaponType.FIST,
    ],
  },
  [WowSpec.PROTECTION_WARRIOR]: {
    id: WowSpec.PROTECTION_WARRIOR,
    class: WowClass.WARRIOR,
    primaryStat: PrimaryStat.STRENGTH,
    usableWeaponTypes: [
      WeaponType.AXE_1H,
      WeaponType.MACE_1H,
      WeaponType.SWORD_1H,
      WeaponType.DAGGER,
      WeaponType.FIST,
      WeaponType.SHIELD,
    ],
  },
  // ── Paladin ──
  [WowSpec.HOLY_PALADIN]: {
    id: WowSpec.HOLY_PALADIN,
    class: WowClass.PALADIN,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [
      WeaponType.MACE_1H,
      WeaponType.SWORD_1H,
      WeaponType.MACE_2H,
      WeaponType.SWORD_2H,
      WeaponType.POLEARM,
      WeaponType.SHIELD,
      WeaponType.OFFHAND,
    ],
  },
  [WowSpec.PROTECTION_PALADIN]: {
    id: WowSpec.PROTECTION_PALADIN,
    class: WowClass.PALADIN,
    primaryStat: PrimaryStat.STRENGTH,
    usableWeaponTypes: [WeaponType.AXE_1H, WeaponType.MACE_1H, WeaponType.SWORD_1H, WeaponType.SHIELD],
  },
  [WowSpec.RETRIBUTION]: {
    id: WowSpec.RETRIBUTION,
    class: WowClass.PALADIN,
    primaryStat: PrimaryStat.STRENGTH,
    usableWeaponTypes: [WeaponType.AXE_2H, WeaponType.MACE_2H, WeaponType.SWORD_2H, WeaponType.POLEARM],
  },
  // ── Hunter ──
  [WowSpec.BEAST_MASTERY]: {
    id: WowSpec.BEAST_MASTERY,
    class: WowClass.HUNTER,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [WeaponType.BOW, WeaponType.CROSSBOW, WeaponType.GUN],
  },
  [WowSpec.MARKSMANSHIP]: {
    id: WowSpec.MARKSMANSHIP,
    class: WowClass.HUNTER,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [WeaponType.BOW, WeaponType.CROSSBOW, WeaponType.GUN],
  },
  [WowSpec.SURVIVAL]: {
    id: WowSpec.SURVIVAL,
    class: WowClass.HUNTER,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [WeaponType.POLEARM, WeaponType.STAFF],
  },
  // ── Rogue ──
  [WowSpec.ASSASSINATION]: {
    id: WowSpec.ASSASSINATION,
    class: WowClass.ROGUE,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [WeaponType.DAGGER, WeaponType.FIST],
  },
  [WowSpec.OUTLAW]: {
    id: WowSpec.OUTLAW,
    class: WowClass.ROGUE,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [WeaponType.AXE_1H, WeaponType.MACE_1H, WeaponType.SWORD_1H, WeaponType.DAGGER, WeaponType.FIST],
  },
  [WowSpec.SUBTLETY]: {
    id: WowSpec.SUBTLETY,
    class: WowClass.ROGUE,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [WeaponType.DAGGER, WeaponType.FIST],
  },
  // ── Priest ──
  [WowSpec.DISCIPLINE]: {
    id: WowSpec.DISCIPLINE,
    class: WowClass.PRIEST,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [
      WeaponType.STAFF,
      WeaponType.WAND,
      WeaponType.MACE_1H,
      WeaponType.SWORD_1H,
      WeaponType.DAGGER,
      WeaponType.OFFHAND,
    ],
  },
  [WowSpec.HOLY_PRIEST]: {
    id: WowSpec.HOLY_PRIEST,
    class: WowClass.PRIEST,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [
      WeaponType.STAFF,
      WeaponType.WAND,
      WeaponType.MACE_1H,
      WeaponType.SWORD_1H,
      WeaponType.DAGGER,
      WeaponType.OFFHAND,
    ],
  },
  [WowSpec.SHADOW]: {
    id: WowSpec.SHADOW,
    class: WowClass.PRIEST,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [
      WeaponType.STAFF,
      WeaponType.WAND,
      WeaponType.MACE_1H,
      WeaponType.SWORD_1H,
      WeaponType.DAGGER,
      WeaponType.OFFHAND,
    ],
  },
  // ── Shaman ──
  [WowSpec.ELEMENTAL]: {
    id: WowSpec.ELEMENTAL,
    class: WowClass.SHAMAN,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [
      WeaponType.STAFF,
      WeaponType.MACE_1H,
      WeaponType.AXE_1H,
      WeaponType.DAGGER,
      WeaponType.SHIELD,
      WeaponType.OFFHAND,
    ],
  },
  [WowSpec.ENHANCEMENT]: {
    id: WowSpec.ENHANCEMENT,
    class: WowClass.SHAMAN,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [WeaponType.AXE_1H, WeaponType.MACE_1H, WeaponType.FIST],
  },
  [WowSpec.RESTORATION_SHAMAN]: {
    id: WowSpec.RESTORATION_SHAMAN,
    class: WowClass.SHAMAN,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [
      WeaponType.STAFF,
      WeaponType.MACE_1H,
      WeaponType.AXE_1H,
      WeaponType.DAGGER,
      WeaponType.SHIELD,
      WeaponType.OFFHAND,
    ],
  },
  // ── Mage ──
  [WowSpec.ARCANE]: {
    id: WowSpec.ARCANE,
    class: WowClass.MAGE,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [WeaponType.STAFF, WeaponType.WAND, WeaponType.SWORD_1H, WeaponType.DAGGER, WeaponType.OFFHAND],
  },
  [WowSpec.FIRE]: {
    id: WowSpec.FIRE,
    class: WowClass.MAGE,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [WeaponType.STAFF, WeaponType.WAND, WeaponType.SWORD_1H, WeaponType.DAGGER, WeaponType.OFFHAND],
  },
  [WowSpec.FROST_MAGE]: {
    id: WowSpec.FROST_MAGE,
    class: WowClass.MAGE,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [WeaponType.STAFF, WeaponType.WAND, WeaponType.SWORD_1H, WeaponType.DAGGER, WeaponType.OFFHAND],
  },
  // ── Warlock ──
  [WowSpec.AFFLICTION]: {
    id: WowSpec.AFFLICTION,
    class: WowClass.WARLOCK,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [WeaponType.STAFF, WeaponType.WAND, WeaponType.SWORD_1H, WeaponType.DAGGER, WeaponType.OFFHAND],
  },
  [WowSpec.DEMONOLOGY]: {
    id: WowSpec.DEMONOLOGY,
    class: WowClass.WARLOCK,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [WeaponType.STAFF, WeaponType.WAND, WeaponType.SWORD_1H, WeaponType.DAGGER, WeaponType.OFFHAND],
  },
  [WowSpec.DESTRUCTION]: {
    id: WowSpec.DESTRUCTION,
    class: WowClass.WARLOCK,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [WeaponType.STAFF, WeaponType.WAND, WeaponType.SWORD_1H, WeaponType.DAGGER, WeaponType.OFFHAND],
  },
  // ── Druid ──
  [WowSpec.BALANCE]: {
    id: WowSpec.BALANCE,
    class: WowClass.DRUID,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [WeaponType.STAFF, WeaponType.MACE_1H, WeaponType.DAGGER, WeaponType.FIST, WeaponType.OFFHAND],
  },
  [WowSpec.FERAL]: {
    id: WowSpec.FERAL,
    class: WowClass.DRUID,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [WeaponType.STAFF, WeaponType.MACE_2H, WeaponType.POLEARM, WeaponType.FIST],
  },
  [WowSpec.GUARDIAN]: {
    id: WowSpec.GUARDIAN,
    class: WowClass.DRUID,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [WeaponType.STAFF, WeaponType.MACE_2H, WeaponType.POLEARM, WeaponType.FIST],
  },
  [WowSpec.RESTORATION_DRUID]: {
    id: WowSpec.RESTORATION_DRUID,
    class: WowClass.DRUID,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [WeaponType.STAFF, WeaponType.MACE_1H, WeaponType.DAGGER, WeaponType.FIST, WeaponType.OFFHAND],
  },
  // ── Death Knight ──
  [WowSpec.BLOOD]: {
    id: WowSpec.BLOOD,
    class: WowClass.DEATH_KNIGHT,
    primaryStat: PrimaryStat.STRENGTH,
    usableWeaponTypes: [WeaponType.AXE_2H, WeaponType.MACE_2H, WeaponType.SWORD_2H, WeaponType.POLEARM],
  },
  [WowSpec.FROST_DK]: {
    id: WowSpec.FROST_DK,
    class: WowClass.DEATH_KNIGHT,
    primaryStat: PrimaryStat.STRENGTH,
    usableWeaponTypes: [
      WeaponType.AXE_1H,
      WeaponType.AXE_2H,
      WeaponType.MACE_1H,
      WeaponType.MACE_2H,
      WeaponType.SWORD_1H,
      WeaponType.SWORD_2H,
      WeaponType.POLEARM,
    ],
  },
  [WowSpec.UNHOLY]: {
    id: WowSpec.UNHOLY,
    class: WowClass.DEATH_KNIGHT,
    primaryStat: PrimaryStat.STRENGTH,
    usableWeaponTypes: [WeaponType.AXE_2H, WeaponType.MACE_2H, WeaponType.SWORD_2H, WeaponType.POLEARM],
  },
  // ── Monk ──
  [WowSpec.BREWMASTER]: {
    id: WowSpec.BREWMASTER,
    class: WowClass.MONK,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [
      WeaponType.AXE_1H,
      WeaponType.MACE_1H,
      WeaponType.SWORD_1H,
      WeaponType.FIST,
      WeaponType.STAFF,
      WeaponType.POLEARM,
    ],
  },
  [WowSpec.MISTWEAVER]: {
    id: WowSpec.MISTWEAVER,
    class: WowClass.MONK,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [WeaponType.STAFF, WeaponType.MACE_1H, WeaponType.AXE_1H, WeaponType.FIST, WeaponType.OFFHAND],
  },
  [WowSpec.WINDWALKER]: {
    id: WowSpec.WINDWALKER,
    class: WowClass.MONK,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [
      WeaponType.AXE_1H,
      WeaponType.MACE_1H,
      WeaponType.SWORD_1H,
      WeaponType.FIST,
      WeaponType.STAFF,
      WeaponType.POLEARM,
    ],
  },
  // ── Demon Hunter ──
  [WowSpec.HAVOC]: {
    id: WowSpec.HAVOC,
    class: WowClass.DEMON_HUNTER,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [
      WeaponType.WARGLAIVE,
      WeaponType.SWORD_1H,
      WeaponType.AXE_1H,
      WeaponType.DAGGER,
      WeaponType.FIST,
    ],
  },
  [WowSpec.VENGEANCE]: {
    id: WowSpec.VENGEANCE,
    class: WowClass.DEMON_HUNTER,
    primaryStat: PrimaryStat.AGILITY,
    usableWeaponTypes: [
      WeaponType.WARGLAIVE,
      WeaponType.SWORD_1H,
      WeaponType.AXE_1H,
      WeaponType.DAGGER,
      WeaponType.FIST,
    ],
  },
  [WowSpec.DEVOURER]: {
    id: WowSpec.DEVOURER,
    class: WowClass.DEMON_HUNTER,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [WeaponType.WARGLAIVE, WeaponType.SWORD_1H, WeaponType.AXE_1H],
  },
  // ── Evoker ──
  [WowSpec.DEVASTATION]: {
    id: WowSpec.DEVASTATION,
    class: WowClass.EVOKER,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [
      WeaponType.STAFF,
      WeaponType.AXE_1H,
      WeaponType.MACE_1H,
      WeaponType.SWORD_1H,
      WeaponType.DAGGER,
      WeaponType.FIST,
      WeaponType.OFFHAND,
    ],
  },
  [WowSpec.PRESERVATION]: {
    id: WowSpec.PRESERVATION,
    class: WowClass.EVOKER,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [
      WeaponType.STAFF,
      WeaponType.AXE_1H,
      WeaponType.MACE_1H,
      WeaponType.SWORD_1H,
      WeaponType.DAGGER,
      WeaponType.FIST,
      WeaponType.OFFHAND,
    ],
  },
  [WowSpec.AUGMENTATION]: {
    id: WowSpec.AUGMENTATION,
    class: WowClass.EVOKER,
    primaryStat: PrimaryStat.INTELLECT,
    usableWeaponTypes: [
      WeaponType.STAFF,
      WeaponType.AXE_1H,
      WeaponType.MACE_1H,
      WeaponType.SWORD_1H,
      WeaponType.DAGGER,
      WeaponType.FIST,
      WeaponType.OFFHAND,
    ],
  },
};

// ── Helper Functions ─────────────────────────────────────────────────────────

export function getClassData(cls: WowClass): IWowClassData {
  return WOW_CLASS_REGISTRY[cls];
}

export function getSpecData(spec: WowSpec): IWowSpecData {
  return WOW_SPEC_REGISTRY[spec];
}

export function canSpecUseWeapon(spec: WowSpec, weaponType: WeaponType): boolean {
  return WOW_SPEC_REGISTRY[spec].usableWeaponTypes.includes(weaponType);
}

/**
 * Single source of truth for item eligibility per class.
 * - Armor items: matched via the class armor type from the registry.
 * - Weapon items (armorType = NONE, weaponType set): filtered by spec usable weapon types.
 * - Other non-armor items (trinkets, jewelry, etc.):
 *     - primaryStats with 1+ values: spec must have a matching primaryStat.
 *     - empty primaryStats (proc-only): available to all.
 */
export function canClassReserveItem(wowClass: WowClass, spec: WowSpec, item: IItem): boolean {
  if (item.armorType === ArmorType.NONE) {
    if (item.weaponType) {
      if (!canSpecUseWeapon(spec, item.weaponType)) return false;
      if (item.primaryStats.length > 0) return item.primaryStats.includes(WOW_SPEC_REGISTRY[spec].primaryStat);
      return true;
    }
    if (item.primaryStats.length > 0) return item.primaryStats.includes(WOW_SPEC_REGISTRY[spec].primaryStat);
    return true;
  }
  return getClassData(wowClass).armorType === item.armorType;
}
