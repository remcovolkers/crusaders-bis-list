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
  ChaseMethod,
  Team,
} from '@crusaders-bis-list/shared-domain';
import { BossOrmEntity, ItemOrmEntity } from '../entities/catalog.orm-entity';
import { RaiderProfileOrmEntity } from '../entities/raider-profile.orm-entity';
import { ReservationOrmEntity, AssignmentOrmEntity } from '../entities/loot.orm-entity';
import { RaiderReceivedItemOrmEntity } from '../entities/raider-received-item.orm-entity';
import { RaiderChaseItemOrmEntity } from '../entities/raider-chase-item.orm-entity';
import { ItemSuperRareOverrideOrmEntity } from '../entities/item-super-rare-override.orm-entity';
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
    @InjectRepository(RaiderChaseItemOrmEntity)
    private readonly chaseItemRepo: Repository<RaiderChaseItemOrmEntity>,
    @InjectRepository(ItemSuperRareOverrideOrmEntity)
    private readonly superRareOverrideRepo: Repository<ItemSuperRareOverrideOrmEntity>,
  ) {}

  async getEligibleRaiders(itemId: string, raidSeasonId: string, team: Team): Promise<IEligibleRaider[]> {
    const raiders = await this.raiderRepo
      .createQueryBuilder('r')
      .leftJoin('r.user', 'u')
      .where('u.team = :team', { team })
      .andWhere('(r.status = :active OR r.status = :trial)', {
        active: RaiderStatus.ACTIVE,
        trial: RaiderStatus.TRIAL,
      })
      .getMany();

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

  async getBossLootView(bossId: string, raidSeasonId: string, team: Team): Promise<IBossLootView> {
    const boss = await this.bossRepo.findOne({ where: { id: bossId } });
    if (!boss) throw new Error(`Boss ${bossId} not found`);

    const items = await this.itemRepo.find({ where: { bossId } });
    const superRareOverrides = await this.superRareOverrideRepo.find({ where: { team } });
    const superRareByItemId = new Map(superRareOverrides.map((o) => [o.itemId, o.isSuperRare]));

    // Team-scoped raider ids — every reservation/assignment/received-item query below is filtered to these
    const teamRaiders = await this.raiderRepo
      .createQueryBuilder('r')
      .leftJoin('r.user', 'u')
      .where('u.team = :team', { team })
      .getMany();
    const teamRaiderIds = teamRaiders.map((r) => r.id);
    const raiderMap = new Map(teamRaiders.map((r) => [r.id, r]));

    // Build a map of all reservations and assignments for this boss/season up-front
    const itemIds = items.map((i) => i.id);
    const allReservations =
      itemIds.length > 0 && teamRaiderIds.length > 0
        ? await this.reservationRepo
            .createQueryBuilder('res')
            .where('res.item_id IN (:...itemIds)', { itemIds })
            .andWhere('res.raid_season_id = :raidSeasonId', { raidSeasonId })
            .andWhere('res.raider_id IN (:...raiderIds)', { raiderIds: teamRaiderIds })
            .getMany()
        : [];

    const allAssignments =
      itemIds.length > 0 && teamRaiderIds.length > 0
        ? await this.assignmentRepo
            .createQueryBuilder('ass')
            .where('ass.item_id IN (:...itemIds)', { itemIds })
            .andWhere('ass.raider_id IN (:...raiderIds)', { raiderIds: teamRaiderIds })
            .getMany()
        : [];

    const allReceivedItems =
      itemIds.length > 0 && teamRaiderIds.length > 0
        ? await this.receivedItemRepo
            .createQueryBuilder('rec')
            .where('rec.item_id IN (:...itemIds)', { itemIds })
            .andWhere('rec.raider_id IN (:...raiderIds)', { raiderIds: teamRaiderIds })
            .getMany()
        : [];

    // Chase items (a raider wants the item but has no reservation for it) — shown to officers as a separate group.
    const allChaseItems =
      itemIds.length > 0 && teamRaiderIds.length > 0
        ? await this.chaseItemRepo
            .createQueryBuilder('chase')
            .where('chase.item_id IN (:...itemIds)', { itemIds })
            .andWhere('chase.raid_season_id = :raidSeasonId', { raidSeasonId })
            .andWhere('chase.raider_id IN (:...raiderIds)', { raiderIds: teamRaiderIds })
            .getMany()
        : [];
    const chaseByItem = new Map<string, RaiderChaseItemOrmEntity[]>();
    for (const c of allChaseItems) {
      const list = chaseByItem.get(c.itemId) ?? [];
      list.push(c);
      chaseByItem.set(c.itemId, list);
    }

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

    // Only include items that have at least one reservation or chase entry.
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
        // Include if primary or any secondary has reservations or chase entries
        const secondaries = secondaryItemsByPrimaryWowId.get(item.wowItemId ?? -1) ?? [];
        const allIds = [item.id, ...secondaries.map((s) => s.id)];
        return allIds.some((id) => (resByItem.get(id)?.length ?? 0) > 0 || (chaseByItem.get(id)?.length ?? 0) > 0);
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

        // Chasers: raiders who want the item without a reservation. Listed after every reservation holder.
        const chasers = new Map<string, RaiderChaseItemOrmEntity>();
        for (const chase of allItemIds.flatMap((id) => chaseByItem.get(id) ?? [])) {
          // An actual reservation wins over a boss-drop chase. A bonus roll chase is a separate plan (e.g. upgrading a
          // Myth item with a bonus roll) and stays visible.
          if (byRaider.has(chase.raiderId) && !chase.methods.includes(ChaseMethod.BONUS_ROLL)) continue;
          const existing = chasers.get(chase.raiderId);
          if (!existing || chase.createdAt < existing.createdAt) chasers.set(chase.raiderId, chase);
        }
        const chaseRaiders: IEligibleRaider[] = [...chasers.values()]
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((chase) => {
            const raider = raiderMap.get(chase.raiderId);
            const assignment =
              allItemIds.map((id) => assignByRaiderItem.get(`${chase.raiderId}:${id}`)).find(Boolean) ?? undefined;
            const receivedTier =
              allItemIds.map((id) => receivedByRaiderItem.get(`${chase.raiderId}:${id}`)).find(Boolean) ?? null;
            return {
              raiderId: chase.raiderId,
              raiderName: raider?.characterName ?? chase.raiderId,
              characterName: raider?.characterName ?? chase.raiderId,
              wowClass: raider?.wowClass ?? ('' as never),
              spec: raider?.spec ?? ('' as never),
              hasReservation: false,
              isChase: true,
              chaseMethods: chase.methods,
              chaseCreatedAt: chase.createdAt,
              assignment: assignment
                ? { id: assignment.id, status: assignment.status, assignedAt: assignment.assignedAt }
                : null,
              receivedTier,
            };
          });
        eligibleRaiders.push(...chaseRaiders);

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
            isSuperRare: superRareByItemId.get(item.id) ?? false,
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
