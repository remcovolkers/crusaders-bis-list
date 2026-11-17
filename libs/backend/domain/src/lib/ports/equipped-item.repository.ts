import { IEquippedItem } from '@crusaders-bis-list/shared-domain';

export type EquippedItemRow = Omit<IEquippedItem, 'syncedAt'>;

export interface IEquippedItemRepository {
  findByRaider(raiderId: string): Promise<IEquippedItem[]>;
  /** Replaces everything stored for the raider with the given items (one transaction). */
  replaceForRaider(raiderId: string, items: EquippedItemRow[], syncedAt: Date): Promise<void>;
  lastSyncedAt(raiderId: string): Promise<Date | null>;
}

export const EQUIPPED_ITEM_REPOSITORY = Symbol('IEquippedItemRepository');
