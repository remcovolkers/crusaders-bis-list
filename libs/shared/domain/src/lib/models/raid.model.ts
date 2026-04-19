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
  /**
   * When set, this item is the secondary form of a toggle item. The value is the
   * `wowItemId` of the primary item. Secondary items are hidden in the UI and
   * their reservations are counted against the primary.
   */
  mergedWithItemId?: number;
  /**
   * Overrides the display name when two items are merged (shown on the primary item).
   * E.g. "Radiant / Umbral Plume"
   */
  mergedDisplayName?: string;
  /**
   * Icon URL of the first secondary merged item. Only populated in loot-view contexts
   * (admin boss view) for split-icon rendering. Not stored in DB.
   */
  secondaryIconUrl?: string;
}
