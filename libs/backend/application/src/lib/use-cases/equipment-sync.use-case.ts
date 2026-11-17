import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  BLIZZARD_API_SERVICE,
  IBlizzardApiService,
  CHASE_ITEM_REPOSITORY,
  IChaseItemRepository,
  EQUIPPED_ITEM_REPOSITORY,
  IEquippedItemRepository,
  BIS_MARK_REPOSITORY,
  IBisMarkRepository,
  EquippedItemRow,
  RAID_CATALOG_REPOSITORY,
  IRaidCatalogRepository,
  RAIDER_REPOSITORY,
  IRaiderRepository,
  RECEIVED_ITEM_REPOSITORY,
  IReceivedItemRepository,
  SEASON_CONFIG_REPOSITORY,
  ISeasonConfigRepository,
  RESERVATION_REPOSITORY,
  IReservationRepository,
  USER_REPOSITORY,
  IUserRepository,
  RaiderProfile,
} from '@crusaders-bis-list/backend-domain';
import { AuditLogService } from '@crusaders-bis-list/backend-infrastructure';
import {
  AssignmentStatus,
  ChaseMethod,
  EQUIPMENT_SLOTS,
  EquipmentSlot,
  IBisMark,
  IEquippedItem,
  IItem,
  ItemLevelCaps,
  RECEIVABLE_TIERS,
  bestObtainableItemLevel,
  Team,
  equippedItemTier,
} from '@crusaders-bis-list/shared-domain';
import { itemLevelCapsOf, trackItemLevelsOf } from '../seasons/season-rules';

/** What a sync changed for the raider (shown to them as a notice, and used to refresh their lists). */
export interface EquipmentSyncUpdate {
  itemId: string;
  itemName: string;
  tier: AssignmentStatus;
  /** received: "already have" tier recorded. chase_completed: Myth item removed from the chase list. */
  kind: 'received' | 'chase_completed';
}

export interface EquipmentSyncResult {
  equipment: IEquippedItem[];
  /** The raider's own "best in slot" marks that still apply (the marked item is still worn). */
  bisMarks: IBisMark[];
  /** True when the armory was actually queried during this call (false = recent data was reused). */
  refreshed: boolean;
  updates: EquipmentSyncUpdate[];
}

export interface EquipmentSyncOptions {
  /** Ignore the "synced recently" shortcut. */
  force?: boolean;
  /** How old stored data may be before the armory is queried again. Default 10 minutes. */
  minAgeMs?: number;
}

const DEFAULT_MIN_AGE_MS = 10 * 60 * 1000;
/** After a failed armory call, leave the character alone for a while instead of retrying on every page view. */
const RETRY_AFTER_FAILURE_MS = 5 * 60 * 1000;
const tierRank = (tier: AssignmentStatus | null | undefined): number => (tier ? RECEIVABLE_TIERS.indexOf(tier) : -1);

/**
 * Reads what a raider is wearing from the Blizzard armory and keeps the loot lists in step with it:
 * a reserved or chased item that is worn at a tier raises the "already have" tier (so peers, officers and the
 * reservation card see it), and a chased item worn at Myth comes off the chase list.
 * Equipped items that are neither reserved nor chased are stored for the character pane but change nothing.
 */
@Injectable()
export class SyncRaiderEquipmentUseCase {
  private readonly logger = new Logger(SyncRaiderEquipmentUseCase.name);
  private readonly inFlight = new Map<string, Promise<EquipmentSyncResult>>();
  private readonly lastFailure = new Map<string, number>();

  constructor(
    @Inject(RAIDER_REPOSITORY) private readonly raiderRepo: IRaiderRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(EQUIPPED_ITEM_REPOSITORY) private readonly equippedRepo: IEquippedItemRepository,
    @Inject(BIS_MARK_REPOSITORY) private readonly bisMarkRepo: IBisMarkRepository,
    @Inject(BLIZZARD_API_SERVICE) private readonly blizzard: IBlizzardApiService,
    @Inject(RAID_CATALOG_REPOSITORY) private readonly catalogRepo: IRaidCatalogRepository,
    @Inject(RESERVATION_REPOSITORY) private readonly reservationRepo: IReservationRepository,
    @Inject(CHASE_ITEM_REPOSITORY) private readonly chaseRepo: IChaseItemRepository,
    @Inject(RECEIVED_ITEM_REPOSITORY) private readonly receivedRepo: IReceivedItemRepository,
    @Inject(SEASON_CONFIG_REPOSITORY) private readonly configRepo: ISeasonConfigRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(raiderId: string, options: EquipmentSyncOptions = {}): Promise<EquipmentSyncResult> {
    // One sync per raider at a time (page loads, the scheduler and the admin button can overlap)
    const running = this.inFlight.get(raiderId);
    if (running) return running;
    const promise = this.run(raiderId, options).finally(() => this.inFlight.delete(raiderId));
    this.inFlight.set(raiderId, promise);
    return promise;
  }

  private async run(raiderId: string, options: EquipmentSyncOptions): Promise<EquipmentSyncResult> {
    const raider = await this.raiderRepo.findById(raiderId);
    if (!raider) throw new NotFoundException('Raider profile not found.');

    const stored = await this.equippedRepo.findByRaider(raiderId);
    const unchanged: EquipmentSyncResult = {
      equipment: stored,
      bisMarks: await this.bisMarkRepo.findByRaider(raiderId),
      refreshed: false,
      updates: [],
    };
    if (!raider.realm?.trim()) return unchanged; // manually entered without a realm: nothing to look up

    const now = Date.now();
    const lastSync = await this.equippedRepo.lastSyncedAt(raiderId);
    const minAge = options.minAgeMs ?? DEFAULT_MIN_AGE_MS;
    if (!options.force && lastSync && now - lastSync.getTime() < minAge) return unchanged;
    const failedAt = this.lastFailure.get(raiderId);
    if (!options.force && failedAt && now - failedAt < RETRY_AFTER_FAILURE_MS) return unchanged;

    const worn = await this.blizzard.getCharacterEquipment(raider.realm, raider.characterName);
    if (worn === null) {
      this.lastFailure.set(raiderId, now);
      return unchanged;
    }
    this.lastFailure.delete(raiderId);

    const season = await this.catalogRepo.findActiveSeason();
    const catalog = season ? await this.catalogRepo.findAllItemsBySeason(season.id) : [];
    const catalogByWowId = new Map<number, IItem>();
    for (const item of catalog) if (item.wowItemId != null) catalogByWowId.set(item.wowItemId, item);

    // The item level caps are season rules the officers can edit per team (season config)
    const user = await this.userRepo.findById(raider.userId);
    const config = season ? await this.configRepo.findOrCreateDefault(season.id, user?.team ?? Team.CRUSADERS) : null;
    const levels = config ? trackItemLevelsOf(config) : undefined;
    const caps = config ? itemLevelCapsOf(config) : undefined;

    const rows: EquippedItemRow[] = [];
    for (const item of worn) {
      if (!EQUIPMENT_SLOTS.includes(item.slot as EquipmentSlot)) continue; // shirt, tabard
      const iconUrl = catalogByWowId.get(item.itemId)?.iconUrl ?? (await this.blizzard.getItemMediaUrl(item.itemId));
      rows.push({
        slot: item.slot as EquipmentSlot,
        itemId: item.itemId,
        name: item.name,
        itemLevel: item.itemLevel,
        tier: equippedItemTier(item.itemLevel, item.description, levels),
        tierLabel: item.description,
        iconUrl: iconUrl ?? null,
      });
    }
    await this.equippedRepo.replaceForRaider(raiderId, rows, new Date(now));
    // A "best in slot" mark only counts while the marked item is still worn in that slot
    await this.bisMarkRepo.deleteStale(
      raiderId,
      rows.map((r) => ({ slot: r.slot, itemId: r.itemId })),
    );

    const bosses = season ? await this.catalogRepo.findBossesBySeason(season.id) : [];
    const encounterByBoss = new Map(bosses.map((b) => [b.id, b.wowEncounterId]));
    const updates = season ? await this.reconcile(raider, season.id, catalog, rows, caps, encounterByBoss) : [];
    return {
      equipment: await this.equippedRepo.findByRaider(raiderId),
      bisMarks: await this.bisMarkRepo.findByRaider(raiderId),
      refreshed: true,
      updates,
    };
  }

  /** Tick off reserved / chased items that are worn: raise the "already have" tier, finish Myth chases. */
  private async reconcile(
    raider: RaiderProfile,
    seasonId: string,
    catalog: IItem[],
    worn: EquippedItemRow[],
    caps: ItemLevelCaps | undefined,
    encounterByBoss: Map<string, number | undefined>,
  ): Promise<EquipmentSyncUpdate[]> {
    // A worn "secondary" form of a merged item counts for its primary item (the one that gets reserved)
    const byWowId = new Map<number, IItem>();
    for (const item of catalog) if (item.wowItemId != null) byWowId.set(item.wowItemId, item);
    const primaryOf = (item: IItem): IItem =>
      item.mergedWithItemId != null ? (byWowId.get(item.mergedWithItemId) ?? item) : item;

    const [reservations, chases, received] = await Promise.all([
      this.reservationRepo.findByRaider(raider.id, seasonId),
      this.chaseRepo.findByRaider(raider.id, seasonId),
      this.receivedRepo.findByRaider(raider.id),
    ]);
    const reservedIds = new Set(reservations.map((r) => r.itemId));
    const chaseByItem = new Map(chases.map((c) => [c.itemId, c]));
    const receivedTier = new Map(received.map((r) => [r.itemId, r.tier]));

    const user = await this.userRepo.findById(raider.userId);
    const team = user?.team ?? Team.CRUSADERS;
    const updates: EquipmentSyncUpdate[] = [];

    for (const piece of worn) {
      if (!piece.tier) continue;
      const catalogItem = byWowId.get(piece.itemId);
      if (!catalogItem) continue;
      const item = primaryOf(catalogItem);
      const reserved = reservedIds.has(item.id);
      const chase = chaseByItem.get(item.id);
      if (!reserved && !chase) continue;

      const itemName = item.mergedDisplayName ?? item.name;
      if (tierRank(piece.tier) > tierRank(receivedTier.get(item.id))) {
        await this.receivedRepo.save({ raiderId: raider.id, itemId: item.id, tier: piece.tier });
        receivedTier.set(item.id, piece.tier);
        updates.push({ itemId: item.id, itemName, tier: piece.tier, kind: 'received' });
        this.auditLog.log({
          action: 'received_item_marked',
          actorId: 'armory-sync',
          actorName: 'Armory-sync',
          team,
          raiderName: raider.characterName,
          itemName,
          details: { tier: piece.tier },
        });
      }
      // A chase is done once the raider has the best item level that way of getting the item can give: a boss drop
      // tops out at the season's max item level, a bonus roll can give more on some bosses (e.g. 344). Without item
      // level caps the Myth tier is the best there is.
      // A chase is done once the raider has the item at the best item level of any way they chase it (it does not
      // matter how the item comes): a boss drop tops out at the season's max item level, a bonus roll can give more on
      // some bosses (e.g. 344). Without item level caps the Myth tier is the best there is.
      const chaseDone =
        chase !== undefined &&
        (caps
          ? chase.methods.some(
              (method) =>
                piece.itemLevel >=
                (method === ChaseMethod.BONUS_ROLL
                  ? bestObtainableItemLevel(caps, encounterByBoss.get(item.bossId))
                  : caps.maxItemLevel),
            )
          : piece.tier === AssignmentStatus.MYTH_TIER);
      if (chase && chaseDone) {
        await this.chaseRepo.delete(chase.id);
        chaseByItem.delete(item.id);
        updates.push({ itemId: item.id, itemName, tier: piece.tier, kind: 'chase_completed' });
      }
    }
    if (updates.length) this.logger.log(`Gear sync for ${raider.characterName}: ${updates.length} update(s)`);
    return updates;
  }
}

export interface TeamEquipmentSyncSummary {
  raiders: number;
  refreshed: number;
  updates: number;
}

/** Syncs the gear of every active raider (optionally of one team), one after the other to stay polite to Blizzard. */
@Injectable()
export class SyncTeamEquipmentUseCase {
  private readonly logger = new Logger(SyncTeamEquipmentUseCase.name);

  constructor(
    private readonly syncRaider: SyncRaiderEquipmentUseCase,
    @Inject(RAIDER_REPOSITORY) private readonly raiderRepo: IRaiderRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(team: Team | null, options: EquipmentSyncOptions = {}): Promise<TeamEquipmentSyncSummary> {
    const [raiders, users] = await Promise.all([this.raiderRepo.findAll(true), this.userRepo.findAll()]);
    const teamByUser = new Map(users.map((u) => [u.id, u.team]));
    const targets = raiders.filter((r) => r.realm?.trim() && (team === null || teamByUser.get(r.userId) === team));

    const summary: TeamEquipmentSyncSummary = { raiders: targets.length, refreshed: 0, updates: 0 };
    for (const raider of targets) {
      try {
        const result = await this.syncRaider.execute(raider.id, options);
        if (result.refreshed) {
          summary.refreshed++;
          summary.updates += result.updates.length;
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      } catch (err) {
        this.logger.warn(`Gear sync failed for ${raider.characterName}: ${(err as Error).message}`);
      }
    }
    return summary;
  }
}
