import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IChaseItemRepository, CreateChaseItemData } from '@crusaders-bis-list/backend-domain';
import { ChaseMethod, IChaseItem } from '@crusaders-bis-list/shared-domain';
import { RaiderChaseItemOrmEntity } from '../entities/raider-chase-item.orm-entity';

@Injectable()
export class ChaseItemRepository implements IChaseItemRepository {
  constructor(
    @InjectRepository(RaiderChaseItemOrmEntity)
    private readonly repo: Repository<RaiderChaseItemOrmEntity>,
  ) {}

  private toModel(e: RaiderChaseItemOrmEntity): IChaseItem {
    return {
      id: e.id,
      raiderId: e.raiderId,
      itemId: e.itemId,
      raidSeasonId: e.raidSeasonId,
      methods: e.methods?.length ? e.methods : [ChaseMethod.BOSS_DROP],
      createdAt: e.createdAt,
    };
  }

  async findById(id: string): Promise<IChaseItem | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.toModel(e) : null;
  }

  async findByRaider(raiderId: string, raidSeasonId: string): Promise<IChaseItem[]> {
    const rows = await this.repo.find({ where: { raiderId, raidSeasonId }, order: { createdAt: 'ASC' } });
    return rows.map((e) => this.toModel(e));
  }

  async findExisting(raiderId: string, itemId: string, raidSeasonId: string): Promise<IChaseItem | null> {
    const e = await this.repo.findOne({ where: { raiderId, itemId, raidSeasonId } });
    return e ? this.toModel(e) : null;
  }

  async save(data: CreateChaseItemData): Promise<IChaseItem> {
    const saved = await this.repo.save(this.repo.create(data));
    return this.toModel(saved);
  }

  async updateMethods(id: string, methods: ChaseMethod[]): Promise<IChaseItem> {
    await this.repo.update(id, { methods });
    return this.toModel(await this.repo.findOneOrFail({ where: { id } }));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async deleteByRaiderAndItem(raiderId: string, itemId: string): Promise<void> {
    await this.repo.delete({ raiderId, itemId });
  }
}
