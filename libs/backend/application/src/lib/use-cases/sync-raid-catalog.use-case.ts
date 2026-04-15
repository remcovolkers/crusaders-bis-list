import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  RAID_CATALOG_REPOSITORY,
  IRaidCatalogRepository,
  BLIZZARD_API_SERVICE,
  IBlizzardApiService,
  BlizzardItem,
} from '@crusaders-bis-list/backend-domain';
import { ArmorType, ItemCategory, PrimaryStat, WeaponType } from '@crusaders-bis-list/shared-domain';
import { ACTIVE_SEASON } from '../seasons/active-season';
import { TierArmorTypePrefix, TierTokenPattern } from '../seasons/season-definition.types';

function detectTierToken(
  name: string,
  patterns: TierTokenPattern[],
  armorPrefixes?: TierArmorTypePrefix[],
): { slot: string; armorType: ArmorType } | null {
  const pattern = patterns.find((t) => t.match.test(name));
  if (!pattern) return null;
  const armorType = armorPrefixes?.find((p) => p.match.test(name))?.armorType ?? ArmorType.NONE;
  return { slot: pattern.slot, armorType };
}

function mapItemCategory(
  item: BlizzardItem,
  tierTokenPatterns: TierTokenPattern[],
  tierArmorTypePrefixes?: TierArmorTypePrefix[],
): {
  category: ItemCategory;
  armorType: ArmorType;
  primaryStat: PrimaryStat | undefined;
  weaponType: WeaponType | undefined;
  slot: string;
  isPrioritizable: boolean;
} {
  const invType = item.inventory_type?.type ?? '';
  const itemClassId = item.item_class?.id ?? -1;
  const itemSubclassId = item.item_subclass?.id ?? -1;
  const slot = item.inventory_type?.name ?? 'Unknown';
  const itemName = item.name ?? '';

  // Tier tokens — detected by name using season-specific patterns
  const tierToken = detectTierToken(itemName, tierTokenPatterns, tierArmorTypePrefixes);
  if (tierToken) {
    return {
      category: ItemCategory.OTHER,
      armorType: tierToken.armorType,
      primaryStat: undefined,
      weaponType: undefined,
      slot: tierToken.slot,
      isPrioritizable: true,
    };
  }

  // Trinket
  if (invType === 'TRINKET') {
    return {
      category: ItemCategory.TRINKET,
      armorType: ArmorType.NONE,
      primaryStat: undefined,
      weaponType: undefined,
      slot,
      isPrioritizable: true,
    };
  }

  // Jewelry (neck, finger, back — non-class-restricted)
  if (['NECK', 'FINGER', 'BACK'].includes(invType)) {
    return {
      category: ItemCategory.JEWELRY,
      armorType: ArmorType.NONE,
      primaryStat: undefined,
      weaponType: undefined,
      slot,
      isPrioritizable: true,
    };
  }

  // Weapons (Blizzard item class 2)
  if (itemClassId === 2) {
    if (['HOLDABLE', 'SHIELD'].includes(invType)) {
      const weaponType = invType === 'SHIELD' ? WeaponType.SHIELD : WeaponType.OTHER;
      return {
        category: ItemCategory.OFFHAND,
        armorType: ArmorType.NONE,
        primaryStat: undefined,
        weaponType,
        slot,
        isPrioritizable: true,
      };
    }

    // Map Blizzard weapon subclass ID → WeaponType
    const SUBCLASS_MAP: Record<number, WeaponType> = {
      0: WeaponType.AXE_1H,
      1: WeaponType.AXE_2H,
      2: WeaponType.BOW,
      3: WeaponType.GUN,
      4: WeaponType.MACE_1H,
      5: WeaponType.MACE_2H,
      6: WeaponType.POLEARM,
      7: WeaponType.SWORD_1H,
      8: WeaponType.SWORD_2H,
      9: WeaponType.WARGLAIVE,
      10: WeaponType.STAFF,
      13: WeaponType.FIST,
      15: WeaponType.DAGGER,
      18: WeaponType.CROSSBOW,
      19: WeaponType.WAND,
    };
    const weaponType = SUBCLASS_MAP[itemSubclassId] ?? WeaponType.OTHER;

    // Primary stat: derive from weapon type for class-specific weapons;
    // for generic weapons fall back to subclass heuristic.
    let primaryStat: PrimaryStat | undefined;
    const agiTypes = new Set([WeaponType.BOW, WeaponType.GUN, WeaponType.CROSSBOW, WeaponType.WARGLAIVE]);
    const intTypes = new Set([WeaponType.WAND, WeaponType.STAFF]);
    if (agiTypes.has(weaponType)) primaryStat = PrimaryStat.AGILITY;
    else if (intTypes.has(weaponType)) primaryStat = PrimaryStat.INTELLECT;

    return {
      category: ItemCategory.WEAPON,
      armorType: ArmorType.NONE,
      primaryStat,
      weaponType,
      slot,
      isPrioritizable: true,
    };
  }

  // Armor (Blizzard item class 4)
  if (itemClassId === 4) {
    // Blizzard stores shields as armor class (id=4), subclass 6. Route to OFFHAND.
    if (invType === 'SHIELD') {
      return {
        category: ItemCategory.OFFHAND,
        armorType: ArmorType.NONE,
        primaryStat: undefined,
        weaponType: WeaponType.SHIELD,
        slot,
        isPrioritizable: true,
      };
    }
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
    return {
      category: ItemCategory.OTHER,
      armorType,
      primaryStat: undefined,
      weaponType: undefined,
      slot,
      isPrioritizable: true,
    };
  }

  // Non-gear (mounts, cosmetics, quest items, etc.) — not reservable
  return {
    category: ItemCategory.OTHER,
    armorType: ArmorType.NONE,
    primaryStat: undefined,
    weaponType: undefined,
    slot,
    isPrioritizable: false,
  };
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

    this.logger.log(`Starting Blizzard raid catalog sync for ${ACTIVE_SEASON.name}...`);

    const season = await this.catalogRepo.upsertSeason({
      name: ACTIVE_SEASON.name,
      slug: ACTIVE_SEASON.slug,
      isActive: true,
    });

    let totalItems = 0;
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const raid of ACTIVE_SEASON.raids) {
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

          const { category, armorType, primaryStat, weaponType, slot, isPrioritizable } = mapItemCategory(
            blizzardItem,
            ACTIVE_SEASON.tierTokenPatterns,
            ACTIVE_SEASON.tierArmorTypePrefixes,
          );
          // TODO: detect superrares from Blizzard API (e.g. blizzardItem.quality.type === 'LEGENDARY')
          const isSuperRare = false;

          // Skip items with no itemLevel or ilvl ≤ 1 (patterns, quest items, etc.)
          const ilvl = blizzardItem.level ?? 0;
          if (ilvl <= 1) {
            this.logger.debug(`Skipping item ${blizzardItem.name} (ilvl ${ilvl})`);
            continue;
          }

          // Non-gear items (mounts, cosmetics, …): upsert with isPrioritizable=false so any
          // existing DB record gets corrected, but skip the icon fetch to save API calls.
          if (!isPrioritizable) {
            this.logger.debug(`Marking item ${blizzardItem.name} as non-prioritizable`);
            await this.catalogRepo.upsertItem({
              wowItemId: blizzardItem.id,
              name: blizzardItem.name ?? itemRef.item.name,
              category,
              armorType,
              slot,
              itemLevel: blizzardItem.level,
              primaryStat,
              weaponType,
              bossId: boss.id,
              isPrioritizable: false,
              isSuperRare: false,
            });
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
            weaponType,
            bossId: boss.id,
            iconUrl,
            isPrioritizable,
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
