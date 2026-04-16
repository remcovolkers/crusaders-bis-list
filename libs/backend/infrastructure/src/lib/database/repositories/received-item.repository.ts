import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IReceivedItemRepository, IReceivedItem, CreateReceivedItemDto } from '@crusaders-bis-list/backend-domain';
import { RaiderReceivedItemOrmEntity } from '../entities/raider-received-item.orm-entity';

@Injectable()
export class ReceivedItemRepository implements IReceivedItemRepository {
  constructor(
    @InjectRepository(RaiderReceivedItemOrmEntity)
    private readonly repo: Repository<RaiderReceivedItemOrmEntity>,
  ) {}

  private toModel(e: RaiderReceivedItemOrmEntity): IReceivedItem {
    return {
      id: e.id,
      raiderId: e.raiderId,
      itemId: e.itemId,
      tier: e.tier,
      createdAt: e.createdAt,
    };
  }

  async findByRaider(raiderId: string): Promise<IReceivedItem[]> {
    const rows = await this.repo.find({ where: { raiderId } });
    return rows.map((e) => this.toModel(e));
  }

  async findByRaiderAndItem(raiderId: string, itemId: string): Promise<IReceivedItem | null> {
    const e = await this.repo.findOne({ where: { raiderId, itemId } });
    return e ? this.toModel(e) : null;
  }

  async save(dto: CreateReceivedItemDto): Promise<IReceivedItem> {
    // Upsert: update tier if record already exists for same raider+item
    const existing = await this.repo.findOne({ where: { raiderId: dto.raiderId, itemId: dto.itemId } });
    if (existing) {
      await this.repo.update(existing.id, { tier: dto.tier });
      const updated = await this.repo.findOneOrFail({ where: { id: existing.id } });
      return this.toModel(updated);
    }
    const orm = this.repo.create({ raiderId: dto.raiderId, itemId: dto.itemId, tier: dto.tier });
    const saved = await this.repo.save(orm);
    return this.toModel(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async deleteByRaiderAndItem(raiderId: string, itemId: string): Promise<void> {
    await this.repo.delete({ raiderId, itemId });
  }
}
