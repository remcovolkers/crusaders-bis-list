import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CHASE_ITEM_REPOSITORY,
  IChaseItemRepository,
  RAID_CATALOG_REPOSITORY,
  IRaidCatalogRepository,
  RESERVATION_REPOSITORY,
  IReservationRepository,
  SEASON_CONFIG_REPOSITORY,
  ISeasonConfigRepository,
} from '@crusaders-bis-list/backend-domain';
import { ChaseMethod, IChaseItem, Team } from '@crusaders-bis-list/shared-domain';

/**
 * Chase items are a personal "I want this" list: no limits, no tiers, no effect on loot assignment.
 * They only give officers an overview of which bosses are still worth clearing for a raider's gear upgrades, and let the
 * raider plan their gearing: each chase says how the raider hopes to get the item: from the boss, with a bonus roll, or
 * both (it does not matter how, as long as the item comes).
 */
@Injectable()
export class SetChaseItemUseCase {
  constructor(
    @Inject(CHASE_ITEM_REPOSITORY) private readonly chaseRepo: IChaseItemRepository,
    @Inject(RAID_CATALOG_REPOSITORY) private readonly catalogRepo: IRaidCatalogRepository,
    @Inject(RESERVATION_REPOSITORY) private readonly reservationRepo: IReservationRepository,
    @Inject(SEASON_CONFIG_REPOSITORY) private readonly configRepo: ISeasonConfigRepository,
  ) {}

  /**
   * Sets how the raider chases the item. An empty list removes the chase. Returns the chase, or null when there is
   * none (any more).
   */
  async execute(
    raiderId: string,
    itemId: string,
    raidSeasonId: string,
    team: Team,
    methods: ChaseMethod[],
  ): Promise<IChaseItem | null> {
    const wanted = [...new Set(methods)];
    const existing = await this.chaseRepo.findExisting(raiderId, itemId, raidSeasonId);
    if (wanted.length === 0) {
      if (existing) await this.chaseRepo.delete(existing.id);
      return null;
    }

    const item = await this.catalogRepo.findItemById(itemId);
    if (!item) throw new NotFoundException(`Item ${itemId} not found`);
    if (!item.isPrioritizable || !item.itemLevel || item.itemLevel <= 1) {
      throw new ConflictException('This item is not gear and cannot be chased.');
    }

    const reservation = await this.reservationRepo.findExisting(raiderId, itemId, raidSeasonId);
    if (reservation) {
      // A reserved item needs no boss-drop chase (the reservation is that). A bonus roll is a separate way to get the
      // item, so that can be chased next to the reservation: to get it sooner, or as an upgrade once it is on Myth.
      const onlyBonusRoll = wanted.length === 1 && wanted[0] === ChaseMethod.BONUS_ROLL;
      if (!onlyBonusRoll) throw new ConflictException('You already reserved this item — only a bonus roll can be chased next to it.');
    }

    if (wanted.includes(ChaseMethod.BONUS_ROLL)) {
      const config = await this.configRepo.findOrCreateDefault(raidSeasonId, team);
      if (!config.bonusRollEnabled) throw new ConflictException('There are no bonus rolls this season.');
    }

    if (existing) {
      const same = existing.methods.length === wanted.length && wanted.every((m) => existing.methods.includes(m));
      return same ? existing : this.chaseRepo.updateMethods(existing.id, wanted);
    }
    return this.chaseRepo.save({ raiderId, itemId, raidSeasonId, methods: wanted });
  }
}

@Injectable()
export class RemoveChaseItemUseCase {
  constructor(@Inject(CHASE_ITEM_REPOSITORY) private readonly chaseRepo: IChaseItemRepository) {}

  /** Only the owner can remove an entry. Removing an entry that is already gone is a no-op. */
  async execute(raiderId: string, chaseItemId: string): Promise<IChaseItem | null> {
    const entry = await this.chaseRepo.findById(chaseItemId);
    if (!entry) return null;
    if (entry.raiderId !== raiderId) throw new ForbiddenException('This chase item belongs to another raider.');
    await this.chaseRepo.delete(chaseItemId);
    return entry;
  }
}
