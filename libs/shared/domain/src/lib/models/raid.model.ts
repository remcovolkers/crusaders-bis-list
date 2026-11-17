import { ArmorType } from '../enums/armor-type.enum';
import { ItemCategory } from '../enums/item-category.enum';
import { PrimaryStat } from '../enums/primary-stat.enum';
import { WeaponType } from '../enums/weapon-type.enum';
import { WowClass } from '../enums/wow-class.enum';

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

/** What a hover on an item shows: the readable parts of the Blizzard item tooltip (no stat values, see the sync). */
export interface IItemTooltip {
  /** Set by the app for worn gear: "Item level 334 · Myth". Not stored. */
  level?: string;
  /** Blizzard quality type: POOR, COMMON, UNCOMMON, RARE, EPIC, LEGENDARY. */
  quality?: string;
  /** e.g. "Trinket" or "Head · Cloth". */
  typeLine?: string;
  /** e.g. "Binds when picked up". */
  binding?: string;
  unique?: string;
  /** Names of the stats the item gives, e.g. ["Intellect", "Mastery"]. */
  stats?: string[];
  /** "Use: ..." and "Equip: ..." effects. */
  effects?: string[];
  description?: string;
  setName?: string;
  /** "(2) Set: ..." bonuses. */
  setEffects?: string[];
}

/** The set (tier) piece a tier token turns into for one class. */
export interface ITierSetPiece {
  /** Blizzard item id of the set piece. */
  wowItemId: number;
  name: string;
  iconUrl?: string;
  tooltip?: IItemTooltip;
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
  /**
   * When set, only these WoW classes may reserve this item.
   * Used for class-group tier tokens where the restriction isn't expressible
   * via a single armor type (e.g. T34 Dreadful = DK + DH + Warlock).
   * When absent, the normal armor-type / primary-stat eligibility applies.
   */
  allowedClasses?: WowClass[];
  /**
   * Tier tokens only: the set piece this token turns into, per class. Lets the app show the item a raider really
   * gets (and recognise it when it is worn) instead of the token. Absent when it is unknown (e.g. new patch).
   */
  tierSetItems?: Partial<Record<WowClass, ITierSetPiece>>;
  /** Hover text, from the Blizzard item API (filled by the catalog sync). */
  tooltip?: IItemTooltip;
  /** UI only (set by the app, not stored): the set piece of the raider's class that is shown instead of this token. */
  tierPiece?: ITierSetPiece;
  /** UI only: the name of the token, when the set piece is shown instead ("via Venomforged Effigy"). */
  tierTokenName?: string;
}
