import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  RAID_CATALOG_REPOSITORY,
  IRaidCatalogRepository,
  BLIZZARD_API_SERVICE,
  IBlizzardApiService,
  BlizzardItem,
} from '@crusaders-bis-list/backend-domain';
import { ArmorType, ItemCategory, PrimaryStat, RESERVABLE_CATEGORIES } from '@crusaders-bis-list/shared-domain';

interface RaidDefinition {
  instanceId: number;
  name: string;
  accentColor: string;
}

const TIER_35_RAIDS: RaidDefinition[] = [
  { instanceId: 1307, name: 'The Voidspire', accentColor: '#8b5cf6' },
  { instanceId: 1314, name: 'The Dreamrift', accentColor: '#10b981' },
  { instanceId: 1308, name: "March on Quel'Danas", accentColor: '#f59e0b' },
];

function mapItemCategory(item: BlizzardItem): {
  category: ItemCategory;
  armorType: ArmorType;
  primaryStat: PrimaryStat | undefined;
  slot: string;
} {
  const invType = item.inventory_type?.type ?? '';
  const itemClassId = item.item_class?.id ?? -1;
  const itemSubclassId = item.item_subclass?.id ?? -1;
  const slot = item.inventory_type?.name ?? 'Unknown';

  // Trinket
  if (invType === 'TRINKET') {
    return { category: ItemCategory.TRINKET, armorType: ArmorType.NONE, primaryStat: undefined, slot };
  }

  // Jewelry (neck, finger, back — non-class-restricted)
  if (['NECK', 'FINGER', 'BACK'].includes(invType)) {
    return { category: ItemCategory.JEWELRY, armorType: ArmorType.NONE, primaryStat: undefined, slot };
  }

  // Weapons
  if (itemClassId === 2) {
    if (['HOLDABLE', 'SHIELD'].includes(invType)) {
      return { category: ItemCategory.OFFHAND, armorType: ArmorType.NONE, primaryStat: undefined, slot };
    }
    // Determine primary stat from subclass
    const agiWeaponSubclasses = new Set([0, 7]); // Axes (for hunters), bows, etc — heuristic
    const intWeaponSubclasses = new Set([19]); // Wands
    let primaryStat: PrimaryStat | undefined;
    if (agiWeaponSubclasses.has(itemSubclassId)) primaryStat = PrimaryStat.AGILITY;
    else if (intWeaponSubclasses.has(itemSubclassId)) primaryStat = PrimaryStat.INTELLECT;
    return { category: ItemCategory.WEAPON, armorType: ArmorType.NONE, primaryStat, slot };
  }

  // Armor
  if (itemClassId === 4) {
    let armorType = ArmorType.NONE;
    switch (itemSubclassId) {
      case 1:
        armorType = ArmorType.CLOTH;
        break;
      case 2:
        armorType = ArmorType.LEATHER;
        break;
      case 3:
        armorType = ArmorType.MAIL;
        break;
      case 4:
        armorType = ArmorType.PLATE;
        break;
    }
    let category: ItemCategory;
    switch (armorType) {
      case ArmorType.CLOTH:
        category = ItemCategory.CLOTH;
        break;
      case ArmorType.LEATHER:
        category = ItemCategory.LEATHER;
        break;
      case ArmorType.MAIL:
        category = ItemCategory.MAIL;
        break;
      case ArmorType.PLATE:
        category = ItemCategory.PLATE;
        break;
      default:
        category = ItemCategory.OTHER;
        break;
    }
    return { category, armorType, primaryStat: undefined, slot };
  }

  return { category: ItemCategory.OTHER, armorType: ArmorType.NONE, primaryStat: undefined, slot };
}

@Injectable()
export class SyncRaidCatalogFromBlizzardUseCase {
  private readonly logger = new Logger(SyncRaidCatalogFromBlizzardUseCase.name);

  constructor(
    @Inject(RAID_CATALOG_REPOSITORY)
    private readonly catalogRepo: IRaidCatalogRepository,
    @Inject(BLIZZARD_API_SERVICE)
    private readonly blizzard: IBlizzardApiService,
  ) {}

  async execute(): Promise<void> {
    if (!this.blizzard.isConfigured) {
      this.logger.warn('Blizzard credentials not set — skipping raid catalog sync.');
      return;
    }

    this.logger.log('Starting Blizzard raid catalog sync for Tier 35...');

    const season = await this.catalogRepo.upsertSeason({
      name: 'Midnight — Season 1 (Tier 35)',
      slug: 'midnight-s1-t35',
      isActive: true,
    });

    let totalItems = 0;

    for (const raid of TIER_35_RAIDS) {
      this.logger.log(`Syncing instance: ${raid.name} (ID: ${raid.instanceId})`);

      let instance;
      try {
        instance = await this.blizzard.getJournalInstance(raid.instanceId);
      } catch (err) {
        this.logger.error(`Failed to fetch instance ${raid.instanceId}: ${(err as Error).message}`);
        continue;
      }

      const encounterRefs = instance.encounters ?? [];

      for (let i = 0; i < encounterRefs.length; i++) {
        const encRef = encounterRefs[i];
        const encounterId = encRef.id;

        let encounter;
        try {
          encounter = await this.blizzard.getJournalEncounter(encounterId);
        } catch (err) {
          this.logger.error(`Failed to fetch encounter ${encounterId}: ${(err as Error).message}`);
          continue;
        }

        const boss = await this.catalogRepo.upsertBoss({
          wowEncounterId: encounter.id,
          name: encounter.name,
          raidSeasonId: season.id,
          raidId: raid.instanceId,
          raidName: raid.name,
          raidAccentColor: raid.accentColor,
          order: i + 1,
        });

        const itemRefs = encounter.items ?? [];
        for (const itemRef of itemRefs) {
          const itemId = itemRef.item?.id;
          if (!itemId) continue;

          let blizzardItem: BlizzardItem;
          try {
            blizzardItem = await this.blizzard.getItem(itemId);
          } catch {
            this.logger.warn(`Skipping item ${itemId} — could not fetch from Blizzard.`);
            continue;
          }

          const { category, armorType, primaryStat, slot } = mapItemCategory(blizzardItem);
          const iconUrl = await this.blizzard.getItemMediaUrl(itemId);
          // TODO: detect superrares from Blizzard API (e.g. blizzardItem.quality.type === 'LEGENDARY')
          const isSuperRare = false;

          await this.catalogRepo.upsertItem({
            wowItemId: blizzardItem.id,
            name: blizzardItem.name ?? itemRef.item.name,
            category,
            armorType,
            slot,
            itemLevel: blizzardItem.level,
            primaryStat,
            bossId: boss.id,
            iconUrl,
            isPrioritizable: RESERVABLE_CATEGORIES.has(category),
            isSuperRare,
          });
          totalItems++;
        }
      }
    }

    this.logger.log(`Blizzard sync complete — ${totalItems} items synced.`);
  }
}
