import { WowSpec } from '../enums/wow-spec.enum';

export type SpecRole = 'tank' | 'healer' | 'dps';

export const TANK_SPECS: ReadonlySet<WowSpec> = new Set<WowSpec>([
  WowSpec.PROTECTION_WARRIOR,
  WowSpec.PROTECTION_PALADIN,
  WowSpec.BLOOD,
  WowSpec.VENGEANCE,
  WowSpec.GUARDIAN,
  WowSpec.BREWMASTER,
]);

export const HEALER_SPECS: ReadonlySet<WowSpec> = new Set<WowSpec>([
  WowSpec.HOLY_PALADIN,
  WowSpec.DISCIPLINE,
  WowSpec.HOLY_PRIEST,
  WowSpec.RESTORATION_SHAMAN,
  WowSpec.RESTORATION_DRUID,
  WowSpec.MISTWEAVER,
  WowSpec.PRESERVATION,
]);

/** DPS specs that fight at range; every other DPS spec counts as melee. */
export const RANGED_DPS_SPECS: ReadonlySet<WowSpec> = new Set<WowSpec>([
  WowSpec.BALANCE,
  WowSpec.SHADOW,
  WowSpec.ELEMENTAL,
  WowSpec.ARCANE,
  WowSpec.FIRE,
  WowSpec.FROST_MAGE,
  WowSpec.AFFLICTION,
  WowSpec.DEMONOLOGY,
  WowSpec.DESTRUCTION,
  WowSpec.MARKSMANSHIP,
  WowSpec.BEAST_MASTERY,
  WowSpec.DEVASTATION,
  WowSpec.AUGMENTATION,
  WowSpec.DEVOURER,
]);

/** Raid role (tank / healer / dps) of a spec. */
export function specRole(spec: WowSpec): SpecRole {
  if (TANK_SPECS.has(spec)) return 'tank';
  if (HEALER_SPECS.has(spec)) return 'healer';
  return 'dps';
}
