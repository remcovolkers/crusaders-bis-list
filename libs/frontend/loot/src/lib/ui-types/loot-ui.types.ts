import { AssignmentStatus, ChaseMethod, IEquippedItem, IItem, RaidDifficulty } from '@crusaders-bis-list/shared-domain';

// ── Category tab ──────────────────────────────────────────────────────────────

/** Keys used in the filter tab bar. Matches ItemCategory groups shown in the UI. */
export type CategoryTab = 'all' | 'trinket' | 'weapon' | 'jewelry' | 'other';

export interface LootCategoryTab {
  key: CategoryTab;
  label: string;
}

/** Ordered tab definitions (labels are in Dutch, matching the UI language). */
export const LOOT_CATEGORY_TABS: LootCategoryTab[] = [
  { key: 'all', label: 'Alles' },
  { key: 'trinket', label: 'Trinkets' },
  { key: 'weapon', label: 'Wapens' },
  { key: 'jewelry', label: 'Jewelry' },
  { key: 'other', label: 'Armor' },
];

/** Session storage key for the active loot tab. */
export const SESSION_ACTIVE_TAB_KEY = 'raider-loot-active-tab';

/** Session storage key for the "show only reservable items" toggle. */
export const SESSION_ONLY_RESERVABLE_KEY = 'raider-loot-only-reservable';

/** Session storage key for the loot page view (item list or character pane). */
export const SESSION_VIEW_KEY = 'raider-loot-view';

/** The loot page shows either the item list or the World of Warcraft style character pane. */
export type LootView = 'list' | 'character';

// ── Item view model ───────────────────────────────────────────────────────────

/** Domain item enriched with the current user's reservation state. */
export interface ItemWithReservation extends IItem {
  isReserved: boolean;
  reservationId?: string;
  /** On the raider's chase list ("I want this" without a reservation). Never true together with `isReserved`. */
  isChased: boolean;
  chaseItemId?: string;
  /** How the raider hopes to get a chased item: boss drop, bonus roll or both. */
  chaseMethods?: ChaseMethod[];
}

/** HEROIC = Heroic or Mythic works; MYTHIC = only Mythic gives something better; null = nothing better that way. */
export interface DifficultyNeeds {
  drop: RaidDifficulty | null;
  bonusRoll: RaidDifficulty | null;
}

/** An item the raider reserved or put on the chase list, as drawn on the character pane. */
export interface TrackedItem {
  item: ItemWithReservation;
  kind: 'reserved' | 'chased';
  bossName: string;
  /** Tiers the reservation still covers (everything above what the raider already has). Empty for chased items. */
  tiers: AssignmentStatus[];
  /** The raider has this item at the best item level that can still be obtained for it (best in slot). */
  isBis: boolean;
  /** Item level a bonus roll could still upgrade the raider's piece to (Myth item, but not at its best), else null. */
  upgradeTo: number | null;
  /** From which difficulty a drop / bonus roll can still improve the raider's piece (null = nothing to gain). */
  needs: DifficultyNeeds;
  /** The same item as it is currently worn (from the armory sync), or null when it is not worn. */
  equippedItem: IEquippedItem | null;
}

// ── Profile save ──────────────────────────────────────────────────────────────

export interface ProfileSaveDto {
  characterName: string;
  realm: string;
  wowClass: string;
  spec: string;
}

// ── Raid grouping ─────────────────────────────────────────────────────────────

import { IBoss } from '@crusaders-bis-list/shared-domain';

export interface RaidGroup {
  raidName: string;
  color: string;
  bosses: IBoss[];
}
