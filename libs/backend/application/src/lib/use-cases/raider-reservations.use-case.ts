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
} from '@crusaders-bis-list/backend-domain';
import { AssignmentStatus } from '@crusaders-bis-list/shared-domain';

export interface RaiderReservationEntry {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  isSuperRare: boolean;
  createdAt: Date;
  assignment: { id: string; status: AssignmentStatus; assignedAt: Date } | null;
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
    const items = await Promise.all(itemIds.map((id) => this.catalogRepo.findItemById(id)));
    const itemMap = new Map(items.filter(Boolean).map((i) => [i!.id, i!]));

    // Group reservations by raiderId
    const byRaider = new Map<string, typeof allReservations>();
    for (const res of allReservations) {
      const list = byRaider.get(res.raiderId) ?? [];
      list.push(res);
      byRaider.set(res.raiderId, list);
    }

    const raiderMap = new Map(allRaiders.map((r) => [r.id, r]));

    const result: RaiderReservationSummary[] = [];
    for (const [raiderId, reservations] of byRaider) {
      const raider = raiderMap.get(raiderId);
      result.push({
        raiderId,
        userId: raider?.userId ?? '',
        characterName: raider?.characterName ?? raiderId,
        wowClass: raider?.wowClass ?? '',
        spec: raider?.spec ?? '',
        reservations: reservations.map((res) => ({
          id: res.id,
          itemId: res.itemId,
          itemName: itemMap.get(res.itemId)?.name ?? res.itemId,
          itemCategory: res.itemCategory,
          isSuperRare: res.isSuperRare,
          createdAt: res.createdAt,
          assignment: assignMap.get(`${raiderId}:${res.itemId}`) ?? null,
        })),
      });
    }

    // Sort by character name
    result.sort((a, b) => a.characterName.localeCompare(b.characterName));
    return result;
  }
}
