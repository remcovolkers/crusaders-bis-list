import { Inject, Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import {
  RESERVATION_REPOSITORY,
  IReservationRepository,
  SEASON_CONFIG_REPOSITORY,
  ISeasonConfigRepository,
  LootDomainRules,
  RECEIVED_ITEM_REPOSITORY,
  IReceivedItemRepository,
} from '@crusaders-bis-list/backend-domain';
import { RAID_CATALOG_REPOSITORY, IRaidCatalogRepository } from '@crusaders-bis-list/backend-domain';

@Injectable()
export class ReserveItemUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepo: IReservationRepository,
    @Inject(RAID_CATALOG_REPOSITORY)
    private readonly catalogRepo: IRaidCatalogRepository,
    @Inject(SEASON_CONFIG_REPOSITORY)
    private readonly configRepo: ISeasonConfigRepository,
  ) {}

  async execute(raiderId: string, itemId: string, raidSeasonId: string): Promise<void> {
    const item = await this.catalogRepo.findItemById(itemId);
    if (!item) throw new NotFoundException(`Item ${itemId} not found`);

    const existing = await this.reservationRepo.findExisting(raiderId, itemId, raidSeasonId);
    if (existing) throw new ConflictException('You already reserved this item for this season.');

    const [config, categoryReservations, superRareReservations] = await Promise.all([
      this.configRepo.findOrCreateDefault(raidSeasonId),
      this.reservationRepo.findByRaiderAndCategory(raiderId, raidSeasonId, item.category),
      this.reservationRepo.findSuperRareByRaider(raiderId, raidSeasonId),
    ]);

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
      item.isSuperRare ?? false,
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
      isSuperRare: item.isSuperRare ?? false,
    });
  }
}

@Injectable()
export class CancelReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepo: IReservationRepository,
    @Inject(RECEIVED_ITEM_REPOSITORY)
    private readonly receivedItemRepo: IReceivedItemRepository,
  ) {}

  async execute(reservationId: string): Promise<void> {
    const reservation = await this.reservationRepo.findById(reservationId);
    if (reservation) {
      await this.receivedItemRepo.deleteByRaiderAndItem(reservation.raiderId, reservation.itemId);
    }
    await this.reservationRepo.delete(reservationId);
  }
}
