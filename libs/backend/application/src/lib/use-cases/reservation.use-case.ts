import { Inject, Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import {
  RESERVATION_REPOSITORY,
  IReservationRepository,
  SEASON_CONFIG_REPOSITORY,
  ISeasonConfigRepository,
  LootDomainRules,
  RECEIVED_ITEM_REPOSITORY,
  IReceivedItemRepository,
  ASSIGNMENT_REPOSITORY,
  IAssignmentRepository,
  CHASE_ITEM_REPOSITORY,
  IChaseItemRepository,
} from '@crusaders-bis-list/backend-domain';
import { RAID_CATALOG_REPOSITORY, IRaidCatalogRepository } from '@crusaders-bis-list/backend-domain';
import { ChaseMethod, Team } from '@crusaders-bis-list/shared-domain';

@Injectable()
export class ReserveItemUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepo: IReservationRepository,
    @Inject(RAID_CATALOG_REPOSITORY)
    private readonly catalogRepo: IRaidCatalogRepository,
    @Inject(SEASON_CONFIG_REPOSITORY)
    private readonly configRepo: ISeasonConfigRepository,
    @Inject(CHASE_ITEM_REPOSITORY)
    private readonly chaseRepo: IChaseItemRepository,
  ) {}

  async execute(raiderId: string, itemId: string, raidSeasonId: string, team: Team): Promise<void> {
    const item = await this.catalogRepo.findItemById(itemId);
    if (!item) throw new NotFoundException(`Item ${itemId} not found`);

    const existing = await this.reservationRepo.findExisting(raiderId, itemId, raidSeasonId);
    if (existing) throw new ConflictException('You already reserved this item for this season.');

    const [config, categoryReservations, superRareReservations, superRareOverrides] = await Promise.all([
      this.configRepo.findOrCreateDefault(raidSeasonId, team),
      this.reservationRepo.findByRaiderAndCategory(raiderId, raidSeasonId, item.category),
      this.reservationRepo.findSuperRareByRaider(raiderId, raidSeasonId),
      this.catalogRepo.getSuperRareOverrides(team),
    ]);
    const isSuperRareForTeam = superRareOverrides[item.id] ?? false;

    const limits = {
      trinketLimit: config.trinketLimit,
      weaponLimit: config.weaponLimit,
      jewelryLimit: config.jewelryLimit,
      armorLimit: config.armorLimit,
      superrareLimit: config.superrareLimit,
    };

    const check = LootDomainRules.canReserve(
      item.category,
      categoryReservations.length,
      limits,
      isSuperRareForTeam,
      superRareReservations.length,
    );

    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }

    await this.reservationRepo.save({
      raiderId,
      itemId,
      itemCategory: item.category,
      raidSeasonId,
      isSuperRare: isSuperRareForTeam,
    });

    // A reservation supersedes a boss-drop chase for the same item. A bonus roll chase is a separate way to get the
    // item and stays next to the reservation.
    const chase = await this.chaseRepo.findExisting(raiderId, itemId, raidSeasonId);
    if (chase) {
      if (chase.methods.includes(ChaseMethod.BONUS_ROLL)) {
        if (chase.methods.length > 1) await this.chaseRepo.updateMethods(chase.id, [ChaseMethod.BONUS_ROLL]);
      } else {
        await this.chaseRepo.delete(chase.id);
      }
    }
  }
}

@Injectable()
export class CancelReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepo: IReservationRepository,
    @Inject(RECEIVED_ITEM_REPOSITORY)
    private readonly receivedItemRepo: IReceivedItemRepository,
    @Inject(ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: IAssignmentRepository,
  ) {}

  async execute(reservationId: string): Promise<void> {
    const reservation = await this.reservationRepo.findById(reservationId);
    if (reservation) {
      await Promise.all([
        this.receivedItemRepo.deleteByRaiderAndItem(reservation.raiderId, reservation.itemId),
        this.assignmentRepo.deleteByRaiderAndItem(reservation.raiderId, reservation.itemId),
      ]);
    }
    await this.reservationRepo.delete(reservationId);
  }
}
