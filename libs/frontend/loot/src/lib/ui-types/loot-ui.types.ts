import { IItem } from '@crusaders-bis-list/shared-domain';

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

// ── Item view model ───────────────────────────────────────────────────────────

/** Domain item enriched with the current user's reservation state. */
export interface ItemWithReservation extends IItem {
  isReserved: boolean;
  reservationId?: string;
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
