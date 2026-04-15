import { AssignmentStatus } from '@crusaders-bis-list/shared-domain';

export interface IReceivedItem {
  id: string;
  raiderId: string;
  itemId: string;
  tier: AssignmentStatus;
  createdAt: Date;
}

export interface CreateReceivedItemDto {
  raiderId: string;
  itemId: string;
  tier: AssignmentStatus;
}

export interface IReceivedItemRepository {
  findByRaider(raiderId: string): Promise<IReceivedItem[]>;
  findByRaiderAndItem(raiderId: string, itemId: string): Promise<IReceivedItem | null>;
  save(dto: CreateReceivedItemDto): Promise<IReceivedItem>;
  delete(id: string): Promise<void>;
}

export const RECEIVED_ITEM_REPOSITORY = Symbol('IReceivedItemRepository');
