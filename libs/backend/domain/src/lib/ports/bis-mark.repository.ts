import { BisMarkReason, EquipmentSlot, IBisMark } from '@crusaders-bis-list/shared-domain';

export interface BisMarkRow {
  slot: EquipmentSlot;
  itemId: number;
  reason: BisMarkReason;
  note: string | null;
}

export interface IBisMarkRepository {
  findByRaider(raiderId: string): Promise<IBisMark[]>;
  /** One mark per slot: marking a slot again replaces the previous mark. */
  upsert(raiderId: string, row: BisMarkRow): Promise<void>;
  delete(raiderId: string, slot: EquipmentSlot): Promise<void>;
  /** Removes the marks whose item is no longer worn in that slot. */
  deleteStale(raiderId: string, worn: { slot: EquipmentSlot; itemId: number }[]): Promise<void>;
}

export const BIS_MARK_REPOSITORY = Symbol('IBisMarkRepository');
