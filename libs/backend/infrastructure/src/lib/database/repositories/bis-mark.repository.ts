import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BisMarkRow, IBisMarkRepository } from '@crusaders-bis-list/backend-domain';
import { EquipmentSlot, IBisMark } from '@crusaders-bis-list/shared-domain';
import { RaiderBisMarkOrmEntity } from '../entities/raider-bis-mark.orm-entity';

@Injectable()
export class BisMarkRepository implements IBisMarkRepository {
  constructor(
    @InjectRepository(RaiderBisMarkOrmEntity)
    private readonly repo: Repository<RaiderBisMarkOrmEntity>,
  ) {}

  async findByRaider(raiderId: string): Promise<IBisMark[]> {
    const rows = await this.repo.find({ where: { raiderId } });
    return rows.map((e) => ({ slot: e.slot, itemId: e.itemId, reason: e.reason, note: e.note, createdAt: e.createdAt }));
  }

  async upsert(raiderId: string, row: BisMarkRow): Promise<void> {
    const existing = await this.repo.findOne({ where: { raiderId, slot: row.slot } });
    if (existing) {
      await this.repo.update(existing.id, { itemId: row.itemId, reason: row.reason, note: row.note });
    } else {
      await this.repo.save(this.repo.create({ raiderId, ...row }));
    }
  }

  async delete(raiderId: string, slot: EquipmentSlot): Promise<void> {
    await this.repo.delete({ raiderId, slot });
  }

  async deleteStale(raiderId: string, worn: { slot: EquipmentSlot; itemId: number }[]): Promise<void> {
    const wornBySlot = new Map(worn.map((w) => [w.slot, w.itemId]));
    const marks = await this.repo.find({ where: { raiderId } });
    const stale = marks.filter((m) => wornBySlot.get(m.slot) !== m.itemId).map((m) => m.id);
    if (stale.length) await this.repo.delete(stale);
  }
}
