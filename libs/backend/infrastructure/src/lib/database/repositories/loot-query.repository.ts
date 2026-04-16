import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILootQueryRepository } from '@crusaders-bis-list/backend-domain';
import {
  IBossLootView,
  IEligibleRaider,
  ItemCategory,
  ArmorType,
  PrimaryStat,
} from '@crusaders-bis-list/shared-domain';
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
    const raiders = await this.raiderRepo.find({
      where: [{ status: RaiderStatus.ACTIVE }, { status: RaiderStatus.TRIAL }],
    });

    const assignments = await this.assignmentRepo.find({ where: { itemId } });
    const assignedRaiderIds = new Set(assignments.map((a) => a.raiderId));

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

    // Build a map of all reservations and assignments for this boss/season up-front
    const itemIds = items.map((i) => i.id);
    const allReservations =
      itemIds.length > 0
        ? await this.reservationRepo
            .createQueryBuilder('res')
            .where('res.item_id IN (:...itemIds)', { itemIds })
            .andWhere('res.raid_season_id = :raidSeasonId', { raidSeasonId })
            .getMany()
        : [];

    const allAssignments =
      itemIds.length > 0
        ? await this.assignmentRepo
            .createQueryBuilder('ass')
            .where('ass.item_id IN (:...itemIds)', { itemIds })
            .getMany()
        : [];

    // Group by itemId
    const resByItem = new Map<string, ReservationOrmEntity[]>();
    for (const r of allReservations) {
      const list = resByItem.get(r.itemId) ?? [];
      list.push(r);
      resByItem.set(r.itemId, list);
    }
    const assignByRaiderItem = new Map<string, AssignmentOrmEntity>();
    for (const a of allAssignments) {
      assignByRaiderItem.set(`${a.raiderId}:${a.itemId}`, a);
    }

    // Collect raider IDs we actually need, then fetch in one query
    const raiderIds = [...new Set(allReservations.map((r) => r.raiderId))];
    const raiders =
      raiderIds.length > 0
        ? await this.raiderRepo.createQueryBuilder('r').where('r.id IN (:...raiderIds)', { raiderIds }).getMany()
        : [];
    const raiderMap = new Map(raiders.map((r) => [r.id, r]));

    // Only include items that have at least one reservation
    const drops = items
      .filter((item) => (resByItem.get(item.id)?.length ?? 0) > 0)
      .map((item) => {
        const reservations = resByItem.get(item.id) ?? [];
        const eligibleRaiders: IEligibleRaider[] = reservations.map((res) => {
          const raider = raiderMap.get(res.raiderId);
          const assignment = assignByRaiderItem.get(`${res.raiderId}:${item.id}`);
          return {
            raiderId: res.raiderId,
            raiderName: raider?.characterName ?? res.raiderId,
            characterName: raider?.characterName ?? res.raiderId,
            wowClass: raider?.wowClass ?? ('' as never),
            spec: raider?.spec ?? ('' as never),
            hasReservation: true,
            reservationId: res.id,
            reservationCreatedAt: res.createdAt,
            assignment: assignment
              ? { id: assignment.id, status: assignment.status, assignedAt: assignment.assignedAt }
              : null,
          };
        });
        // Sort: unassigned first, then by reservation date
        eligibleRaiders.sort((a, b) => {
          if (!a.assignment && b.assignment) return -1;
          if (a.assignment && !b.assignment) return 1;
          return (a.reservationCreatedAt?.getTime() ?? 0) - (b.reservationCreatedAt?.getTime() ?? 0);
        });
        return {
          item: {
            id: item.id,
            name: item.name,
            wowItemId: item.wowItemId,
            category: item.category as ItemCategory,
            armorType: (item.armorType as ArmorType) ?? ArmorType.NONE,
            slot: item.slot ?? 'Unknown',
            itemLevel: item.itemLevel,
            primaryStats: (item.primaryStats ?? []) as PrimaryStat[],
            bossId: item.bossId,
            bossName: boss.name,
            iconUrl: item.iconUrl,
            isPrioritizable: item.isPrioritizable,
            isSuperRare: item.isSuperRare,
          },
          eligibleRaiders,
        };
      });

    return {
      boss: {
        id: boss.id,
        name: boss.name,
        raidSeasonId: boss.raidSeasonId,
        raidId: boss.raidId,
        raidName: boss.raidName,
        raidAccentColor: boss.raidAccentColor,
        wowEncounterId: boss.wowEncounterId,
        order: boss.order,
      },
      drops,
    };
  }
}
