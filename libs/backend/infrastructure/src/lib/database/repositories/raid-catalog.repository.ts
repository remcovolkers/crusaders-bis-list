import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRaidCatalogRepository } from '@crusaders-bis-list/backend-domain';
import { IBoss, IItem, IRaidSeason, ItemCategory } from '@crusaders-bis-list/shared-domain';
import { RaidSeasonOrmEntity, BossOrmEntity, ItemOrmEntity } from '../entities/catalog.orm-entity';

@Injectable()
export class RaidCatalogRepository implements IRaidCatalogRepository {
  constructor(
    @InjectRepository(RaidSeasonOrmEntity)
    private readonly seasonRepo: Repository<RaidSeasonOrmEntity>,
    @InjectRepository(BossOrmEntity)
    private readonly bossRepo: Repository<BossOrmEntity>,
    @InjectRepository(ItemOrmEntity)
    private readonly itemRepo: Repository<ItemOrmEntity>,
  ) {}

  async findAllSeasons(): Promise<IRaidSeason[]> {
    return this.seasonRepo.find({ order: { startDate: 'DESC' } });
  }

  async findActiveSeason(): Promise<IRaidSeason | null> {
    return this.seasonRepo.findOne({ where: { isActive: true } });
  }

  async findSeasonById(id: string): Promise<IRaidSeason | null> {
    return this.seasonRepo.findOne({ where: { id } });
  }

  async findBossesBySeason(seasonId: string): Promise<IBoss[]> {
    return this.bossRepo.find({ where: { raidSeasonId: seasonId }, order: { order: 'ASC' } });
  }

  async findBossById(id: string): Promise<IBoss | null> {
    return this.bossRepo.findOne({ where: { id } });
  }

  async findItemsByBoss(bossId: string): Promise<IItem[]> {
    const items = await this.itemRepo.find({ where: { bossId } });
    const boss = await this.bossRepo.findOne({ where: { id: bossId } });
    return items.map((i) => ({ ...i, category: i.category as ItemCategory, bossName: boss?.name ?? '' }));
  }

  async findItemById(id: string): Promise<IItem | null> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) return null;
    const boss = await this.bossRepo.findOne({ where: { id: item.bossId } });
    return { ...item, category: item.category as ItemCategory, bossName: boss?.name ?? '' };
  }

  async findAllItemsBySeason(seasonId: string): Promise<IItem[]> {
    const bosses = await this.bossRepo.find({ where: { raidSeasonId: seasonId } });
    const bossMap = new Map(bosses.map((b) => [b.id, b.name]));
    const bossIds = bosses.map((b) => b.id);
    if (bossIds.length === 0) return [];

    const items = await this.itemRepo
      .createQueryBuilder('item')
      .where('item.boss_id IN (:...bossIds)', { bossIds })
      .getMany();

    return items.map((i) => ({
      ...i,
      category: i.category as ItemCategory,
      bossName: bossMap.get(i.bossId) ?? '',
    }));
  }
}
