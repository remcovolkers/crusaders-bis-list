import { ArmorType } from '../enums/armor-type.enum';
import { ItemCategory } from '../enums/item-category.enum';
import { PrimaryStat } from '../enums/primary-stat.enum';
import { WeaponType } from '../enums/weapon-type.enum';

export interface IRaidSeason {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface IBoss {
  id: string;
  name: string;
  raidSeasonId: string;
  raidId?: number;
  raidName?: string;
  raidAccentColor?: string;
  wowEncounterId?: number;
  order: number;
}

export interface IItem {
  id: string;
  name: string;
  wowItemId?: number;
  category: ItemCategory;
  armorType: ArmorType;
  slot: string;
  itemLevel?: number;
  /** Primary stats this item provides. Multiple values = adaptive (e.g. Str/Agi trinket). */
  primaryStats: PrimaryStat[];
  weaponType?: WeaponType;
  bossId: string;
  bossName: string;
  iconUrl?: string;
  isPrioritizable: boolean;
  isSuperRare?: boolean;
}
