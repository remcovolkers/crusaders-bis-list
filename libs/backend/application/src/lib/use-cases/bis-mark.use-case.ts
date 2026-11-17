import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BIS_MARK_REPOSITORY,
  IBisMarkRepository,
  CHASE_ITEM_REPOSITORY,
  IChaseItemRepository,
  EQUIPPED_ITEM_REPOSITORY,
  IEquippedItemRepository,
  RAID_CATALOG_REPOSITORY,
  IRaidCatalogRepository,
} from '@crusaders-bis-list/backend-domain';
import { BisMarkReason, CATALYST_SLOTS, EquipmentSlot, IBisMark } from '@crusaders-bis-list/shared-domain';

/**
 * A raider can say that the item they wear in a slot is best in slot for them: a crafted piece they will not replace, a
 * dungeon item that is not in the loot list, ... The mark counts as long as that same item is worn in the slot.
 */
@Injectable()
export class SetBisMarkUseCase {
  constructor(
    @Inject(BIS_MARK_REPOSITORY) private readonly marks: IBisMarkRepository,
    @Inject(EQUIPPED_ITEM_REPOSITORY) private readonly equipped: IEquippedItemRepository,
  ) {}

  async execute(
    raiderId: string,
    slot: EquipmentSlot,
    itemId: number,
    reason: BisMarkReason = 'manual',
    note: string | null = null,
  ): Promise<IBisMark[]> {
    const worn = (await this.equipped.findByRaider(raiderId)).find((w) => w.slot === slot);
    if (!worn || worn.itemId !== itemId) {
      throw new ConflictException('That item is not equipped in that slot (the gear may need a sync first).');
    }
    await this.marks.upsert(raiderId, { slot, itemId, reason, note });
    return this.marks.findByRaider(raiderId);
  }
}

@Injectable()
export class RemoveBisMarkUseCase {
  constructor(@Inject(BIS_MARK_REPOSITORY) private readonly marks: IBisMarkRepository) {}

  async execute(raiderId: string, slot: EquipmentSlot): Promise<IBisMark[]> {
    await this.marks.delete(raiderId, slot);
    return this.marks.findByRaider(raiderId);
  }
}

/**
 * Catalyst: an item with favourable stats is converted into the tier piece of its slot (the one that gives the set
 * bonus). The raider chased the original item and now wears the tier piece, which is a different item. Catalysing the
 * chase marks the tier piece in that slot as best in slot and takes the chase off the list. The chased item itself is
 * consumed by the catalyst: the raider does not own it, so it is NOT recorded as received (they can chase it again,
 * e.g. with a bonus roll for a higher item level).
 */
@Injectable()
export class CatalyseChaseItemUseCase {
  constructor(
    @Inject(CHASE_ITEM_REPOSITORY) private readonly chaseRepo: IChaseItemRepository,
    @Inject(BIS_MARK_REPOSITORY) private readonly marks: IBisMarkRepository,
    @Inject(EQUIPPED_ITEM_REPOSITORY) private readonly equipped: IEquippedItemRepository,
    @Inject(RAID_CATALOG_REPOSITORY) private readonly catalogRepo: IRaidCatalogRepository,
  ) {}

  async execute(raiderId: string, chaseItemId: string, slot: EquipmentSlot): Promise<IBisMark[]> {
    const chase = await this.chaseRepo.findById(chaseItemId);
    if (!chase) throw new NotFoundException('Chase item not found.');
    if (chase.raiderId !== raiderId) throw new ForbiddenException('This chase item belongs to another raider.');
    if (!CATALYST_SLOTS.includes(slot)) throw new BadRequestException('Only tier slots (head, shoulders, chest, hands, legs) can be catalysed.');

    const worn = (await this.equipped.findByRaider(raiderId)).find((w) => w.slot === slot);
    if (!worn) throw new ConflictException('There is no equipped item in that slot (the gear may need a sync first).');

    const item = await this.catalogRepo.findItemById(chase.itemId);
    await this.marks.upsert(raiderId, { slot, itemId: worn.itemId, reason: 'catalyst', note: item?.mergedDisplayName ?? item?.name ?? null });
    await this.chaseRepo.delete(chase.id);
    return this.marks.findByRaider(raiderId);
  }
}
