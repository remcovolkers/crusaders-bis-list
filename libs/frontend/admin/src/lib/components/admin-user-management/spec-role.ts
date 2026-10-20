import { SpecRole, specRole, WowSpec } from '@crusaders-bis-list/shared-domain';

export type RaidRole = SpecRole;

/** Derives the raid role from a spec; null when the spec is unknown/empty. */
export function roleOfSpec(spec: string | undefined | null): RaidRole | null {
  return spec ? specRole(spec as WowSpec) : null;
}

export const ROLE_META: Record<RaidRole, { label: string; icon: string }> = {
  tank: { label: 'Tank', icon: 'shield' },
  healer: { label: 'Healer', icon: 'local_hospital' },
  dps: { label: 'DPS', icon: 'swords' },
};

export function classSlug(wowClass: string | undefined | null): string {
  return (wowClass ?? '').toLowerCase().replace(/\s+/g, '-');
}
