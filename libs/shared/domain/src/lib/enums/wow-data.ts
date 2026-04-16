import { ArmorType } from './armor-type.enum';
import { PrimaryStat } from './primary-stat.enum';
import { WowClass } from './wow-class.enum';
import { WowSpec } from './wow-spec.enum';

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
