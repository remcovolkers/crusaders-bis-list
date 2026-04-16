import { ArmorType, ItemCategory, PrimaryStat, WeaponType } from '@crusaders-bis-list/shared-domain';

export interface UpsertSeasonData {
  name: string;
  slug: string;
  isActive: boolean;
}

export interface UpsertBossData {
  wowEncounterId: number;
  name: string;
  raidSeasonId: string;
  raidId: number;
  raidName: string;
  raidAccentColor: string;
  order: number;
}

export interface UpsertItemData {
  wowItemId: number;
  name: string;
  category: ItemCategory;
  armorType: ArmorType;
  slot: string;
  itemLevel?: number;
  primaryStats: PrimaryStat[];
  weaponType?: WeaponType;
  bossId: string;
  iconUrl?: string;
  isPrioritizable: boolean;
  isSuperRare?: boolean;
}
