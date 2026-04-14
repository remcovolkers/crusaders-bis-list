import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILootQueryRepository, IAssignmentRepository, IReservationRepository } from '@crusaders-bis-list/backend-domain';
import { IBossLootView, IEligibleRaider, AssignmentStatus, ItemCategory } from '@crusaders-bis-list/shared-domain';
import { BossOrmEntity, ItemOrmEntity } from '../entities/catalog.orm-entity';
import { RaiderProfileOrmEntity } from '../entities/raider-profile.orm-entity';
import { ReservationOrmEntity, AssignmentOrmEntity } from '../entities/loot.orm-entity';
import { RaiderStatus } from '@crusaders-bis-list/shared-domain';

@Injectable()
export class LootQueryRepository implements ILootQueryRepository {
  constructor(
    @InjectRepository(BossOrmEntity)
    private readonly bossRepo: Repository<BossOrmEntity>,
    @InjectRepository(ItemOrmEntity)
    private readonly itemRepo: Repository<ItemOrmEntity>,
    @InjectRepository(RaiderProfileOrmEntity)
    private readonly raiderRepo: Repository<RaiderProfileOrmEntity>,
    @InjectRepository(ReservationOrmEntity)
    private readonly reservationRepo: Repository<ReservationOrmEntity>,
    @InjectRepository(AssignmentOrmEntity)
    private readonly assignmentRepo: Repository<AssignmentOrmEntity>,
  ) {}

  async getEligibleRaiders(itemId: string, raidSeasonId: string): Promise<IEligibleRaider[]> {
    // All active/trial raiders
    const raiders = await this.raiderRepo.find({
      where: [
        { status: RaiderStatus.ACTIVE },
        { status: RaiderStatus.TRIAL },
      ],
    });

    // All assignments for this item (any season) — to find who already has it or declined
    const assignments = await this.assignmentRepo.find({ where: { itemId } });
    const assignedRaiderIds = new Set(
      assignments
        .filter((a) => a.status !== AssignmentStatus.NIET_MEER_NODIG || a.status === AssignmentStatus.NIET_MEER_NODIG)
        .map((a) => a.raiderId),
    );

    // All reservations for this item in this season
    const reservations = await this.reservationRepo.find({ where: { itemId, raidSeasonId } });
    const reservationMap = new Map(reservations.map((r) => [r.raiderId, r]));

    return raiders
      .filter((r) => !assignedRaiderIds.has(r.id))
      .map((r) => ({
        raiderId: r.id,
        raiderName: r.characterName,
        characterName: r.characterName,
        wowClass: r.wowClass,
        spec: r.spec,
        hasReservation: reservationMap.has(r.id),
        reservationCreatedAt: reservationMap.get(r.id)?.createdAt,
      }))
      .sort((a, b) => {
        // Raiders with reservations first, then by reservation date
        if (a.hasReservation && !b.hasReservation) return -1;
        if (!a.hasReservation && b.hasReservation) return 1;
        if (a.reservationCreatedAt && b.reservationCreatedAt) {
          return a.reservationCreatedAt.getTime() - b.reservationCreatedAt.getTime();
        }
        return 0;
      });
  }

  async getBossLootView(bossId: string, raidSeasonId: string): Promise<IBossLootView> {
    const boss = await this.bossRepo.findOne({ where: { id: bossId } });
    if (!boss) throw new Error(`Boss ${bossId} not found`);

    const items = await this.itemRepo.find({ where: { bossId } });

    const drops = await Promise.all(
      items.map(async (item) => {
        const eligibleRaiders = await this.getEligibleRaiders(item.id, raidSeasonId);
        return {
          item: {
            id: item.id,
            name: item.name,
            wowItemId: item.wowItemId,
            category: item.category as ItemCategory,
            bossId: item.bossId,
            bossName: boss.name,
            iconUrl: item.iconUrl,
            isPrioritizable: item.isPrioritizable,
          },
          eligibleRaiders,
        };
      }),
    );

    return {
      boss: { id: boss.id, name: boss.name, raidSeasonId: boss.raidSeasonId, order: boss.order },
      drops,
    };
  }
}
