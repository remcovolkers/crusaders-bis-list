import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IEquippedItemRepository, EquippedItemRow } from '@crusaders-bis-list/backend-domain';
import { IEquippedItem } from '@crusaders-bis-list/shared-domain';
import { RaiderEquippedItemOrmEntity } from '../entities/raider-equipped-item.orm-entity';

@Injectable()
export class EquippedItemRepository implements IEquippedItemRepository {
  constructor(
    @InjectRepository(RaiderEquippedItemOrmEntity)
    private readonly repo: Repository<RaiderEquippedItemOrmEntity>,
  ) {}

  private toModel(e: RaiderEquippedItemOrmEntity): IEquippedItem {
    return {
      slot: e.slot,
      itemId: e.itemId,
      name: e.itemName,
      itemLevel: e.itemLevel,
      tier: e.tier,
      tierLabel: e.tierLabel,
      iconUrl: e.iconUrl,
      syncedAt: e.syncedAt,
    };
  }

  async findByRaider(raiderId: string): Promise<IEquippedItem[]> {
    const rows = await this.repo.find({ where: { raiderId } });
    return rows.map((e) => this.toModel(e));
  }

  async replaceForRaider(raiderId: string, items: EquippedItemRow[], syncedAt: Date): Promise<void> {
    await this.repo.manager.transaction(async (manager) => {
      await manager.delete(RaiderEquippedItemOrmEntity, { raiderId });
      if (items.length === 0) return;
      await manager.insert(
        RaiderEquippedItemOrmEntity,
        items.map((i) => ({
          raiderId,
          slot: i.slot,
          itemId: i.itemId,
          itemName: i.name,
          itemLevel: i.itemLevel,
          tier: i.tier,
          tierLabel: i.tierLabel,
          iconUrl: i.iconUrl,
          syncedAt,
        })),
      );
    });
  }

  async lastSyncedAt(raiderId: string): Promise<Date | null> {
    const row = await this.repo.findOne({ where: { raiderId }, order: { syncedAt: 'DESC' } });
    return row?.syncedAt ?? null;
  }
}
