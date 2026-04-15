import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IRaidCatalogRepository,
  UpsertSeasonData,
  UpsertBossData,
  UpsertItemData,
} from '@crusaders-bis-list/backend-domain';
import { ArmorType, IBoss, IItem, IRaidSeason, ItemCategory, PrimaryStat, WeaponType } from '@crusaders-bis-list/shared-domain';
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

  private toIItem(i: ItemOrmEntity, bossName: string): IItem {
    return {
      id: i.id,
      name: i.name,
      wowItemId: i.wowItemId,
      category: i.category as ItemCategory,
      armorType: (i.armorType as ArmorType) ?? ArmorType.NONE,
      slot: i.slot ?? 'Unknown',
      itemLevel: i.itemLevel,
      primaryStat: i.primaryStat as PrimaryStat | undefined,
      weaponType: i.weaponType as WeaponType | undefined,
      bossId: i.bossId,
      bossName,
      iconUrl: i.iconUrl,
      isPrioritizable: i.isPrioritizable,
      isSuperRare: i.isSuperRare,
    };
  }

  private toIBoss(b: BossOrmEntity): IBoss {
    return {
      id: b.id,
      name: b.name,
      raidSeasonId: b.raidSeasonId,
      raidId: b.raidId,
      raidName: b.raidName,
      raidAccentColor: b.raidAccentColor,
      wowEncounterId: b.wowEncounterId,
      order: b.order,
    };
  }

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
    const bosses = await this.bossRepo.find({ where: { raidSeasonId: seasonId }, order: { order: 'ASC' } });
    return bosses.map((b) => this.toIBoss(b));
  }

  async findBossById(id: string): Promise<IBoss | null> {
    const b = await this.bossRepo.findOne({ where: { id } });
    return b ? this.toIBoss(b) : null;
  }

  async findItemsByBoss(bossId: string): Promise<IItem[]> {
    const items = await this.itemRepo.find({ where: { bossId } });
    const boss = await this.bossRepo.findOne({ where: { id: bossId } });
    return items.map((i) => this.toIItem(i, boss?.name ?? ''));
  }

  async findItemById(id: string): Promise<IItem | null> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) return null;
    const boss = await this.bossRepo.findOne({ where: { id: item.bossId } });
    return this.toIItem(item, boss?.name ?? '');
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

    return items.map((i) => this.toIItem(i, bossMap.get(i.bossId) ?? ''));
  }

  async upsertSeason(data: UpsertSeasonData): Promise<IRaidSeason> {
    let season = await this.seasonRepo.findOne({ where: { slug: data.slug } });
    if (season) {
      await this.seasonRepo.update(season.id, { name: data.name, isActive: data.isActive });
      return this.seasonRepo.findOneOrFail({ where: { id: season.id } });
    }
    season = this.seasonRepo.create({
      name: data.name,
      slug: data.slug,
      isActive: data.isActive,
      startDate: new Date(),
    });
    return this.seasonRepo.save(season);
  }

  async upsertBoss(data: UpsertBossData): Promise<IBoss> {
    let boss = await this.bossRepo.findOne({ where: { wowEncounterId: data.wowEncounterId } });
    if (boss) {
      await this.bossRepo.update(boss.id, {
        name: data.name,
        raidId: data.raidId,
        raidName: data.raidName,
        raidAccentColor: data.raidAccentColor,
        order: data.order,
      });
      return this.toIBoss(await this.bossRepo.findOneOrFail({ where: { id: boss.id } }));
    }
    boss = this.bossRepo.create({ ...data });
    return this.toIBoss(await this.bossRepo.save(boss));
  }

  async upsertItem(data: UpsertItemData): Promise<IItem> {
    let item = await this.itemRepo.findOne({ where: { wowItemId: data.wowItemId } });
    const bossName = (await this.bossRepo.findOne({ where: { id: data.bossId } }))?.name ?? '';

    if (item) {
      await this.itemRepo.update(item.id, {
        name: data.name,
        category: data.category,
        armorType: data.armorType,
        slot: data.slot,
        itemLevel: data.itemLevel,
        primaryStat: data.primaryStat,
        weaponType: data.weaponType,
        bossId: data.bossId,
        // Only overwrite iconUrl if a new value was successfully fetched
        ...(data.iconUrl ? { iconUrl: data.iconUrl } : {}),
        isPrioritizable: data.isPrioritizable,
        // Preserve admin-set isSuperRare — only update if not already true in DB
        isSuperRare: item.isSuperRare || (data.isSuperRare ?? false),
      });
      return this.toIItem(await this.itemRepo.findOneOrFail({ where: { id: item.id } }), bossName);
    }

    item = this.itemRepo.create({ ...data });
    return this.toIItem(await this.itemRepo.save(item), bossName);
  }

  async updateItemSuperRare(itemId: string, isSuperRare: boolean): Promise<IItem> {
    await this.itemRepo.update(itemId, { isSuperRare });
    const item = await this.itemRepo.findOneOrFail({ where: { id: itemId } });
    const bossName = (await this.bossRepo.findOne({ where: { id: item.bossId } }))?.name ?? '';
    return this.toIItem(item, bossName);
  }

  async clearCatalog(): Promise<void> {
    await this.itemRepo.query('TRUNCATE TABLE items, bosses, raid_seasons RESTART IDENTITY CASCADE');
  }

  async clearItems(): Promise<void> {
    await this.itemRepo.query('TRUNCATE TABLE items RESTART IDENTITY CASCADE');
  }
}
