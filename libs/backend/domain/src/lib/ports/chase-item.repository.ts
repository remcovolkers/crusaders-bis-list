import { ChaseMethod, IChaseItem } from '@crusaders-bis-list/shared-domain';

export interface CreateChaseItemData {
  raiderId: string;
  itemId: string;
  raidSeasonId: string;
  methods: ChaseMethod[];
}

export interface IChaseItemRepository {
  findById(id: string): Promise<IChaseItem | null>;
  findByRaider(raiderId: string, raidSeasonId: string): Promise<IChaseItem[]>;
  findExisting(raiderId: string, itemId: string, raidSeasonId: string): Promise<IChaseItem | null>;
  save(data: CreateChaseItemData): Promise<IChaseItem>;
  updateMethods(id: string, methods: ChaseMethod[]): Promise<IChaseItem>;
  delete(id: string): Promise<void>;
  deleteByRaiderAndItem(raiderId: string, itemId: string): Promise<void>;
}

export const CHASE_ITEM_REPOSITORY = Symbol('IChaseItemRepository');
