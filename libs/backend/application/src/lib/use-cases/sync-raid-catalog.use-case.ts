import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  RAID_CATALOG_REPOSITORY,
  IRaidCatalogRepository,
  BLIZZARD_API_SERVICE,
  IBlizzardApiService,
  BlizzardItem,
} from '@crusaders-bis-list/backend-domain';
import { ArmorType, ItemCategory, PrimaryStat } from '@crusaders-bis-list/shared-domain';

interface RaidDefinition {
  instanceId: number;
  name: string;
  accentColor: string;
  /** Used when the journal-instance endpoint is unavailable (e.g. not yet published by Blizzard). */
  fallbackEncounterIds?: number[];
}

const TIER_35_RAIDS: RaidDefinition[] = [
  {
    instanceId: 1307,
    name: 'The Voidspire',
    accentColor: '#8b5cf6',
    // Instance endpoint returns 500 — encounter IDs resolved via journal-encounter search
    // Order: Imperator, Vorasius, Salhadaar, Vaelgor & Ezzorak, Lightblinded Vanguard, Crown of the Cosmos
    fallbackEncounterIds: [2733, 2734, 2736, 2735, 2737, 2738],
  },
  { instanceId: 1314, name: 'The Dreamrift', accentColor: '#10b981' },
  { instanceId: 1308, name: "March on Quel'Danas", accentColor: '#f59e0b' },
];

// Tier 35 token detection by partial name — maps to the tier slot the token converts into
const TIER_TOKEN_SLOTS: { match: RegExp; slot: string }[] = [
  { match: /riftbloom/i, slot: 'Tier: Chest' },
  { match: /hungering nullcore/i, slot: 'Tier: Hands' },
  { match: /unraveled nullcore/i, slot: 'Tier: Shoulders' },
  { match: /fanatical nullcore/i, slot: 'Tier: Head' },
  { match: /corrupted nullcore/i, slot: 'Tier: Legs' },
  { match: /void curio/i, slot: 'Tier: All' },
];

function detectTierTokenSlot(name: string): string | null {
  for (const t of TIER_TOKEN_SLOTS) {
    if (t.match.test(name)) return t.slot;
  }
  return null;
}

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
  const itemName = item.name ?? '';

  // Tier tokens — detected by name, category is OTHER, slot describes the tier piece
  const tierSlot = detectTierTokenSlot(itemName);
  if (tierSlot) {
    return { category: ItemCategory.OTHER, armorType: ArmorType.NONE, primaryStat: undefined, slot: tierSlot };
  }

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
    const agiWeaponSubclasses = new Set([0, 7]);
    const intWeaponSubclasses = new Set([19]);
    let primaryStat: PrimaryStat | undefined;
    if (agiWeaponSubclasses.has(itemSubclassId)) primaryStat = PrimaryStat.AGILITY;
    else if (intWeaponSubclasses.has(itemSubclassId)) primaryStat = PrimaryStat.INTELLECT;
    return { category: ItemCategory.WEAPON, armorType: ArmorType.NONE, primaryStat, slot };
  }

  // Armor — all armor types use category OTHER (armor type still stored for display)
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
    return { category: ItemCategory.OTHER, armorType, primaryStat: undefined, slot };
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
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const raid of TIER_35_RAIDS) {
      this.logger.log(`Syncing instance: ${raid.name} (ID: ${raid.instanceId})`);

      let encounterIds: number[];
      try {
        const instance = await this.blizzard.getJournalInstance(raid.instanceId);
        encounterIds = (instance.encounters ?? []).map((e) => e.id);
      } catch (err) {
        if (raid.fallbackEncounterIds?.length) {
          const msg = `Instance ${raid.instanceId} (${raid.name}) unavailable — used hardcoded encounter IDs`;
          warnings.push(msg);
          this.logger.warn(`${msg}: ${(err as Error).message}`);
          encounterIds = raid.fallbackEncounterIds;
        } else {
          const msg = `Failed to fetch instance ${raid.instanceId} (${raid.name}): ${(err as Error).message}`;
          errors.push(msg);
          this.logger.error(msg);
          continue;
        }
      }

      for (let i = 0; i < encounterIds.length; i++) {
        const encounterId = encounterIds[i];

        let encounter;
        try {
          encounter = await this.blizzard.getJournalEncounter(encounterId);
        } catch (err) {
          const msg = `Failed to fetch encounter ${encounterId}: ${(err as Error).message}`;
          errors.push(msg);
          this.logger.error(msg);
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
            const msg = `Failed to fetch item ${itemId} — skipped`;
            warnings.push(msg);
            this.logger.warn(`Skipping item ${itemId} — could not fetch from Blizzard.`);
            continue;
          }

          const { category, armorType, primaryStat, slot } = mapItemCategory(blizzardItem);
          // TODO: detect superrares from Blizzard API (e.g. blizzardItem.quality.type === 'LEGENDARY')
          const isSuperRare = false;

          // Skip items with no itemLevel or ilvl ≤ 1 (patterns, quest items, etc.)
          const ilvl = blizzardItem.level ?? 0;
          if (ilvl <= 1) {
            this.logger.debug(`Skipping item ${blizzardItem.name} (ilvl ${ilvl})`);
            continue;
          }

          const iconUrl = await this.blizzard.getItemMediaUrl(itemId);

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
            isPrioritizable: true,
            isSuperRare,
          });
          totalItems++;
        }
      }
    }

    this.logger.log(`Blizzard sync complete — ${totalItems} items synced.`);

    if (warnings.length) {
      this.logger.warn(`Sync warnings (${warnings.length}):\n  ${warnings.join('\n  ')}`);
    }
    if (errors.length) {
      this.logger.error(`Sync errors (${errors.length}):\n  ${errors.join('\n  ')}`);
    }
    if (!warnings.length && !errors.length) {
      this.logger.log('Sync completed without any warnings or errors.');
    }
  }
}
