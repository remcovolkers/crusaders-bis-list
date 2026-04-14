import { IBossLootView, IEligibleRaider } from '@crusaders-bis-list/shared-domain';

export interface ILootQueryRepository {
  getBossLootView(bossId: string, raidSeasonId: string): Promise<IBossLootView>;
  getEligibleRaiders(itemId: string, raidSeasonId: string): Promise<IEligibleRaider[]>;
}

export const LOOT_QUERY_REPOSITORY = Symbol('ILootQueryRepository');
