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
  AssignmentStatus,
} from '@crusaders-bis-list/shared-domain';
import { BossOrmEntity, ItemOrmEntity } from '../entities/catalog.orm-entity';
import { RaiderProfileOrmEntity } from '../entities/raider-profile.orm-entity';
import { ReservationOrmEntity, AssignmentOrmEntity } from '../entities/loot.orm-entity';
import { RaiderReceivedItemOrmEntity } from '../entities/raider-received-item.orm-entity';
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
    @InjectRepository(RaiderReceivedItemOrmEntity)
    private readonly receivedItemRepo: Repository<RaiderReceivedItemOrmEntity>,
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

    const allReceivedItems =
      itemIds.length > 0
        ? await this.receivedItemRepo
            .createQueryBuilder('rec')
            .where('rec.item_id IN (:...itemIds)', { itemIds })
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
    const receivedByRaiderItem = new Map<string, AssignmentStatus>();
    for (const rec of allReceivedItems) {
      receivedByRaiderItem.set(`${rec.raiderId}:${rec.itemId}`, rec.tier);
    }

    // Collect raider IDs we actually need, then fetch in one query
    const raiderIds = [...new Set(allReservations.map((r) => r.raiderId))];
    const raiders =
      raiderIds.length > 0
        ? await this.raiderRepo.createQueryBuilder('r').where('r.id IN (:...raiderIds)', { raiderIds }).getMany()
        : [];
    const raiderMap = new Map(raiders.map((r) => [r.id, r]));

    // Only include items that have at least one reservation.
    // Merged secondary items (mergedWithItemId set) are folded into their primary:
    // their reservations appear under the primary drop, deduped by raiderId.
    const primaryItems = items.filter((i) => !i.mergedWithItemId);
    const secondaryItemsByPrimaryWowId = new Map<number, (typeof items)[number][]>();
    for (const i of items) {
      if (i.mergedWithItemId) {
        const list = secondaryItemsByPrimaryWowId.get(i.mergedWithItemId) ?? [];
        list.push(i);
        secondaryItemsByPrimaryWowId.set(i.mergedWithItemId, list);
      }
    }

    const drops = primaryItems
      .filter((item) => {
        // Include if primary or any secondary has reservations
        const secondaries = secondaryItemsByPrimaryWowId.get(item.wowItemId ?? -1) ?? [];
        const allIds = [item.id, ...secondaries.map((s) => s.id)];
        return allIds.some((id) => (resByItem.get(id)?.length ?? 0) > 0);
      })
      .map((item) => {
        const secondaries = secondaryItemsByPrimaryWowId.get(item.wowItemId ?? -1) ?? [];
        const allItemIds = [item.id, ...secondaries.map((s) => s.id)];

        // Collect all reservations across primary + secondary items
        const allItemReservations = allItemIds.flatMap((id) => resByItem.get(id) ?? []);

        // Deduplicate by raiderId — prefer entries that have an assignment, then earliest date
        const byRaider = new Map<string, (typeof allItemReservations)[number]>();
        for (const res of allItemReservations) {
          const existing = byRaider.get(res.raiderId);
          if (!existing) {
            byRaider.set(res.raiderId, res);
          } else {
            const existingHasAssignment = assignByRaiderItem.has(`${res.raiderId}:${existing.itemId}`);
            const newHasAssignment = assignByRaiderItem.has(`${res.raiderId}:${res.itemId}`);
            if (!existingHasAssignment && newHasAssignment) {
              byRaider.set(res.raiderId, res);
            }
          }
        }

        const eligibleRaiders: IEligibleRaider[] = [...byRaider.values()].map((res) => {
          const raider = raiderMap.get(res.raiderId);
          // Look for assignment on primary or any secondary item
          const assignment =
            allItemIds.map((id) => assignByRaiderItem.get(`${res.raiderId}:${id}`)).find(Boolean) ?? undefined;
          // Look for received tier on primary or any secondary item
          const receivedTier =
            allItemIds.map((id) => receivedByRaiderItem.get(`${res.raiderId}:${id}`)).find(Boolean) ?? null;
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
            receivedTier,
          };
        });
        // Sort: unassigned first, then by reservation date
        eligibleRaiders.sort((a, b) => {
          if (!a.assignment && b.assignment) return -1;
          if (a.assignment && !b.assignment) return 1;
          return (a.reservationCreatedAt?.getTime() ?? 0) - (b.reservationCreatedAt?.getTime() ?? 0);
        });

        // Use the first secondary's iconUrl as the split icon (for display in admin)
        const secondaryIconUrl = secondaries[0]?.iconUrl;

        return {
          item: {
            id: item.id,
            name: item.mergedDisplayName ?? item.name,
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
            mergedDisplayName: item.mergedDisplayName,
            secondaryIconUrl,
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
