import { Inject, Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import {
  RESERVATION_REPOSITORY,
  ASSIGNMENT_REPOSITORY,
  IReservationRepository,
  IAssignmentRepository,
  LootDomainRules,
  SEASON_CONFIG_REPOSITORY,
  ISeasonConfigRepository,
} from '@crusaders-bis-list/backend-domain';
import { RAID_CATALOG_REPOSITORY, IRaidCatalogRepository } from '@crusaders-bis-list/backend-domain';

@Injectable()
export class ReserveItemUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepo: IReservationRepository,
    @Inject(ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: IAssignmentRepository,
    @Inject(RAID_CATALOG_REPOSITORY)
    private readonly catalogRepo: IRaidCatalogRepository,
    @Inject(SEASON_CONFIG_REPOSITORY)
    private readonly configRepo: ISeasonConfigRepository,
  ) {}

  async execute(raiderId: string, itemId: string, raidSeasonId: string): Promise<void> {
    const item = await this.catalogRepo.findItemById(itemId);
    if (!item) throw new NotFoundException(`Item ${itemId} not found`);
    if (!item.isPrioritizable) {
      throw new BadRequestException(`Item "${item.name}" cannot be reserved.`);
    }

    const existing = await this.reservationRepo.findExisting(raiderId, itemId, raidSeasonId);
    if (existing) throw new ConflictException('You already reserved this item for this season.');

    const existingAssignment = await this.assignmentRepo.findByRaiderAndItem(raiderId, itemId);
    if (existingAssignment && !LootDomainRules.isEligibleForAssignment(existingAssignment)) {
      throw new BadRequestException('You already received or declined this item.');
    }

    const reservationsInCategory = await this.reservationRepo.findByRaiderAndCategory(
      raiderId,
      raidSeasonId,
      item.category,
    );

    const config = await this.configRepo.findOrCreateDefault(raidSeasonId);
    const limits = {
      trinketLimit: config.trinketLimit,
      weaponLimit: config.weaponLimit,
      jewelryLimit: config.jewelryLimit,
      otherLimit: config.otherLimit,
      superrareLimit: config.superrareLimit,
    };

    const superRareReservations = item.isSuperRare
      ? await this.reservationRepo.findSuperRareByRaider(raiderId, raidSeasonId)
      : [];

    const check = LootDomainRules.canReserve(
      item.category,
      reservationsInCategory.length,
      limits,
      item.isSuperRare ?? false,
      superRareReservations.length,
    );
    if (!check.allowed) throw new BadRequestException(check.reason);

    await this.reservationRepo.save({
      raiderId,
      itemId,
      itemCategory: item.category,
      raidSeasonId,
      isSuperRare: item.isSuperRare ?? false,
    });
  }
}

@Injectable()
export class CancelReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepo: IReservationRepository,
  ) {}

  async execute(reservationId: string): Promise<void> {
    await this.reservationRepo.delete(reservationId);
  }
}
