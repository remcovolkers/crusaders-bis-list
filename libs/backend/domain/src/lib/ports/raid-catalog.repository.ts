import { IBoss, IItem, IRaidSeason } from '@crusaders-bis-list/shared-domain';

export interface IRaidCatalogRepository {
  findAllSeasons(): Promise<IRaidSeason[]>;
  findActiveSeason(): Promise<IRaidSeason | null>;
  findSeasonById(id: string): Promise<IRaidSeason | null>;
  findBossesBySeason(seasonId: string): Promise<IBoss[]>;
  findBossById(id: string): Promise<IBoss | null>;
  findItemsByBoss(bossId: string): Promise<IItem[]>;
  findItemById(id: string): Promise<IItem | null>;
  findAllItemsBySeason(seasonId: string): Promise<IItem[]>;
}

export const RAID_CATALOG_REPOSITORY = Symbol('IRaidCatalogRepository');
