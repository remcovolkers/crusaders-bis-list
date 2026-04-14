import { Inject, Injectable } from '@nestjs/common';
import { LOOT_QUERY_REPOSITORY, ILootQueryRepository } from '@crusaders-bis-list/backend-domain';
import { RAID_CATALOG_REPOSITORY, IRaidCatalogRepository } from '@crusaders-bis-list/backend-domain';
import { IBossLootView, IBoss, IItem, IRaidSeason } from '@crusaders-bis-list/shared-domain';

@Injectable()
export class GetBossLootViewUseCase {
  constructor(
    @Inject(LOOT_QUERY_REPOSITORY)
    private readonly lootQueryRepo: ILootQueryRepository,
  ) {}

  async execute(bossId: string, raidSeasonId: string): Promise<IBossLootView> {
    return this.lootQueryRepo.getBossLootView(bossId, raidSeasonId);
  }
}

@Injectable()
export class GetRaidCatalogUseCase {
  constructor(
    @Inject(RAID_CATALOG_REPOSITORY)
    private readonly catalogRepo: IRaidCatalogRepository,
  ) {}

  async getActiveSeasonWithBossesAndItems(): Promise<{
    season: IRaidSeason;
    bosses: (IBoss & { items: IItem[] })[];
  } | null> {
    const season = await this.catalogRepo.findActiveSeason();
    if (!season) return null;

    const bosses = await this.catalogRepo.findBossesBySeason(season.id);
    const bossesWithItems = await Promise.all(
      bosses.map(async (boss) => {
        const items = await this.catalogRepo.findItemsByBoss(boss.id);
        return { ...boss, items };
      }),
    );

    return { season, bosses: bossesWithItems };
  }

  async getAllItemsForSeason(seasonId: string): Promise<IItem[]> {
    return this.catalogRepo.findAllItemsBySeason(seasonId);
  }
}
