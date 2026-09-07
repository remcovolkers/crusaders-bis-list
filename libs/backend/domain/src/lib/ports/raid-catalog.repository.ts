import { IBoss, IItem, IRaidSeason, Team } from '@crusaders-bis-list/shared-domain';
import { UpsertSeasonData, UpsertBossData, UpsertItemData } from './raid-catalog.types';

export interface IRaidCatalogRepository {
  findAllSeasons(): Promise<IRaidSeason[]>;
  findActiveSeason(): Promise<IRaidSeason | null>;
  findSeasonById(id: string): Promise<IRaidSeason | null>;
  findBossesBySeason(seasonId: string): Promise<IBoss[]>;
  findBossById(id: string): Promise<IBoss | null>;
  findItemsByBoss(bossId: string): Promise<IItem[]>;
  findItemById(id: string): Promise<IItem | null>;
  findAllItemsBySeason(seasonId: string): Promise<IItem[]>;
  upsertSeason(data: UpsertSeasonData): Promise<IRaidSeason>;
  upsertBoss(data: UpsertBossData): Promise<IBoss>;
  upsertItem(data: UpsertItemData): Promise<IItem>;
  findItemByWowId(wowItemId: number): Promise<IItem | null>;
  updateItemMerge(wowItemId: number, mergedWithItemId: number | null, mergedDisplayName: string | null): Promise<void>;
  /** Per-team super-rare override: itemId -> isSuperRare, for every item that has one for this team. */
  getSuperRareOverrides(team: Team): Promise<Record<string, boolean>>;
  updateItemSuperRare(itemId: string, team: Team, isSuperRare: boolean): Promise<IItem>;
  /** Remove all items, bosses and seasons (in FK order). */
  clearCatalog(): Promise<void>;
  /** Remove only items — bosses and seasons are preserved. */
  clearItems(): Promise<void>;
}

export const RAID_CATALOG_REPOSITORY = Symbol('IRaidCatalogRepository');
