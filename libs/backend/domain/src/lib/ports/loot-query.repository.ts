import { IBossLootView, IEligibleRaider, Team } from '@crusaders-bis-list/shared-domain';

export interface ILootQueryRepository {
  getBossLootView(bossId: string, raidSeasonId: string, team: Team): Promise<IBossLootView>;
  getEligibleRaiders(itemId: string, raidSeasonId: string, team: Team): Promise<IEligibleRaider[]>;
}

export const LOOT_QUERY_REPOSITORY = Symbol('ILootQueryRepository');
