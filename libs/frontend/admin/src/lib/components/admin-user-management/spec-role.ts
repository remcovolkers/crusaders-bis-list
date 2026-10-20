import { WowSpec } from '@crusaders-bis-list/shared-domain';

export type RaidRole = 'tank' | 'healer' | 'dps';

const TANK_SPECS = new Set<string>([
  WowSpec.PROTECTION_WARRIOR,
  WowSpec.PROTECTION_PALADIN,
  WowSpec.BLOOD,
  WowSpec.VENGEANCE,
  WowSpec.GUARDIAN,
  WowSpec.BREWMASTER,
]);

const HEALER_SPECS = new Set<string>([
  WowSpec.HOLY_PALADIN,
  WowSpec.DISCIPLINE,
  WowSpec.HOLY_PRIEST,
  WowSpec.RESTORATION_SHAMAN,
  WowSpec.RESTORATION_DRUID,
  WowSpec.MISTWEAVER,
  WowSpec.PRESERVATION,
]);

/** Derives the raid role from a spec (mirrors the sets of composition-analysis; to be moved to shared-domain). */
export function roleOfSpec(spec: string | undefined | null): RaidRole | null {
  if (!spec) return null;
  if (TANK_SPECS.has(spec)) return 'tank';
  if (HEALER_SPECS.has(spec)) return 'healer';
  return 'dps';
}

export const ROLE_META: Record<RaidRole, { label: string; icon: string }> = {
  tank: { label: 'Tank', icon: 'shield' },
  healer: { label: 'Healer', icon: 'local_hospital' },
  dps: { label: 'DPS', icon: 'swords' },
};

export function classSlug(wowClass: string | undefined | null): string {
  return (wowClass ?? '').toLowerCase().replace(/\s+/g, '-');
}
