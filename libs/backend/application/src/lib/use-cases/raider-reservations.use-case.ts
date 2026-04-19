import { Inject, Injectable } from '@nestjs/common';
import {
  RAID_CATALOG_REPOSITORY,
  IRaidCatalogRepository,
  RAIDER_REPOSITORY,
  IRaiderRepository,
  RESERVATION_REPOSITORY,
  IReservationRepository,
  ASSIGNMENT_REPOSITORY,
  IAssignmentRepository,
  SEASON_CONFIG_REPOSITORY,
  ISeasonConfigRepository,
  RECEIVED_ITEM_REPOSITORY,
  IReceivedItemRepository,
} from '@crusaders-bis-list/backend-domain';
import { AssignmentStatus, IItem } from '@crusaders-bis-list/shared-domain';

export interface RaiderReservationEntry {
  id: string;
  itemId: string;
  itemName: string;
  iconUrl?: string;
  secondaryIconUrl?: string;
  itemCategory: string;
  isSuperRare: boolean;
  createdAt: Date;
  assignment: { id: string; status: AssignmentStatus; assignedAt: Date } | null;
  receivedTier?: AssignmentStatus | null;
}

export interface RaiderReservationSummary {
  raiderId: string;
  userId: string;
  characterName: string;
  wowClass: string;
  spec: string;
  reservations: RaiderReservationEntry[];
}

@Injectable()
export class GetAllRaiderReservationsUseCase {
  constructor(
    @Inject(RAIDER_REPOSITORY) private readonly raiderRepo: IRaiderRepository,
    @Inject(RESERVATION_REPOSITORY) private readonly reservationRepo: IReservationRepository,
    @Inject(ASSIGNMENT_REPOSITORY) private readonly assignmentRepo: IAssignmentRepository,
    @Inject(RAID_CATALOG_REPOSITORY) private readonly catalogRepo: IRaidCatalogRepository,
    @Inject(SEASON_CONFIG_REPOSITORY) private readonly configRepo: ISeasonConfigRepository,
    @Inject(RECEIVED_ITEM_REPOSITORY) private readonly receivedItemRepo: IReceivedItemRepository,
  ) {}

  async execute(): Promise<RaiderReservationSummary[]> {
    const season = await this.catalogRepo.findActiveSeason();
    if (!season) return [];

    const [allReservations, allAssignments, allRaiders] = await Promise.all([
      this.reservationRepo.findAllBySeason(season.id),
      this.assignmentRepo.findAllBySeason(season.id),
      this.raiderRepo.findAll(),
    ]);

    // Build assignment lookup: raiderId:itemId -> assignment
    const assignMap = new Map<string, { id: string; status: AssignmentStatus; assignedAt: Date }>();
    for (const a of allAssignments) {
      assignMap.set(`${a.raiderId}:${a.itemId}`, {
        id: a.id,
        status: a.status,
        assignedAt: a.assignedAt,
      });
    }

    // Collect unique itemIds so we can fetch names
    const itemIds = [...new Set(allReservations.map((r) => r.itemId))];
    const [items, bosses, allSeasonItems] = await Promise.all([
      Promise.all(itemIds.map((id) => this.catalogRepo.findItemById(id))),
      this.catalogRepo.findBossesBySeason(season.id),
      this.catalogRepo.findAllItemsBySeason(season.id),
    ]);
    const itemMap = new Map(items.filter((i): i is NonNullable<typeof i> => i != null).map((i) => [i.id, i]));
    // Build lookup: primary wowItemId -> secondary item (for split icon)
    const secondaryByPrimaryWowId = new Map<number, IItem>();
    for (const si of allSeasonItems) {
      if (si.mergedWithItemId != null) {
        secondaryByPrimaryWowId.set(si.mergedWithItemId, si);
      }
    }

    // Build bossId -> sort index map so reservations can be ordered by boss order
    const bossOrderMap = new Map(bosses.map((b, idx) => [b.id, idx]));

    // Group reservations by raiderId
    const byRaider = new Map<string, typeof allReservations>();
    for (const res of allReservations) {
      const list = byRaider.get(res.raiderId) ?? [];
      list.push(res);
      byRaider.set(res.raiderId, list);
    }

    const raiderMap = new Map(allRaiders.map((r) => [r.id, r]));

    // Fetch received items for all raiders
    const raiderIds = [...byRaider.keys()];
    const allReceived = (await Promise.all(raiderIds.map((id) => this.receivedItemRepo.findByRaider(id)))).flat();
    const receivedMap = new Map<string, AssignmentStatus>();
    for (const r of allReceived) {
      receivedMap.set(`${r.raiderId}:${r.itemId}`, r.tier);
    }

    const result: RaiderReservationSummary[] = [];
    for (const [raiderId, reservations] of byRaider) {
      const raider = raiderMap.get(raiderId);
      result.push({
        raiderId,
        userId: raider?.userId ?? '',
        characterName: raider?.characterName ?? raiderId,
        wowClass: raider?.wowClass ?? '',
        spec: raider?.spec ?? '',
        reservations: reservations
          .map((res) => {
            const item = itemMap.get(res.itemId);
            const secondary = item?.wowItemId != null ? secondaryByPrimaryWowId.get(item.wowItemId) : undefined;
            return {
              id: res.id,
              itemId: res.itemId,
              itemName: item?.mergedDisplayName ?? item?.name ?? res.itemId,
              iconUrl: item?.iconUrl,
              secondaryIconUrl: secondary?.iconUrl,
              itemCategory: res.itemCategory,
              isSuperRare: res.isSuperRare,
              createdAt: res.createdAt,
              assignment: assignMap.get(`${raiderId}:${res.itemId}`) ?? null,
              receivedTier: receivedMap.get(`${raiderId}:${res.itemId}`) ?? null,
            };
          })
          .sort((a, b) => {
            const bossA = bossOrderMap.get(itemMap.get(a.itemId)?.bossId ?? '') ?? 999;
            const bossB = bossOrderMap.get(itemMap.get(b.itemId)?.bossId ?? '') ?? 999;
            return bossA - bossB;
          }),
      });
    }

    // Sort by character name
    result.sort((a, b) => a.characterName.localeCompare(b.characterName));
    return result;
  }
}
