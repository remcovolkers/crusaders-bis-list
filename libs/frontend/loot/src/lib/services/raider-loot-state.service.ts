import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { LootService } from './loot.service';
import {
  IItem,
  IBoss,
  IReceivedItem,
  IEquippedItem,
  IRaiderProfile,
  ItemCategory,
  AssignmentStatus,
  ARMOR_ITEM_CATEGORIES,
  ChaseMethod,
  EquipmentSlot,
  IBisMark,
  ItemLevelCaps,
  ItemLevelState,
  TIER_LABELS,
  bonusRollUpgradeTo as upgradeLevel,
  isBestInSlot,
  minimumDifficulty,
  canClassReserveItem,
  WowSpec,
  getClassData,
} from '@crusaders-bis-list/shared-domain';
import {
  CategoryTab,
  ItemWithReservation,
  LootCategoryTab,
  LOOT_CATEGORY_TABS,
  ProfileSaveDto,
  RaidGroup,
  DifficultyNeeds,
  LootView,
  SESSION_ACTIVE_TAB_KEY,
  SESSION_ONLY_RESERVABLE_KEY,
  SESSION_VIEW_KEY,
  TrackedItem,
} from '../ui-types/loot-ui.types';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';

/**
 * Application-layer facade for the raider loot overview page.
 *
 * Encapsulates all state (signals), business rules, and data-loading logic so
 * that the presentation component stays a thin shell. Provided at component
 * level so its lifetime is tied to the component tree.
 */
@Injectable()
export class RaiderLootStateService {
  private readonly lootService = inject(LootService);
  private readonly toast = inject(ToastService);

  // ── Resources (auto-load on service creation) ─────────────────────────────
  private readonly profileResource = rxResource({ stream: () => this.lootService.getMyProfile() });
  private readonly configResource = rxResource({ stream: () => this.lootService.getSeasonConfig() });
  private readonly catalogResource = rxResource({ stream: () => this.lootService.getCatalog() });
  private readonly receivedItemsResource = rxResource({ stream: () => this.lootService.getMyReceivedItems() });
  private readonly reservationsResource = rxResource({
    params: () => this.catalogResource.value()?.season.id,
    stream: ({ params: seasonId }) => this.lootService.getMyReservations(seasonId),
  });
  private readonly chaseItemsResource = rxResource({
    params: () => this.catalogResource.value()?.season.id,
    stream: ({ params: seasonId }) => this.lootService.getMyChaseItems(seasonId),
  });
  private readonly peerCountsResource = rxResource({ stream: () => this.lootService.getItemPeerCounts() });
  /** Armory picture for the character pane — only requested once the pane has been opened. */
  private readonly mediaRequested = signal(false);
  private readonly characterMediaResource = rxResource({
    params: () => (this.mediaRequested() ? true : undefined),
    stream: () => this.lootService.getCharacterMedia(),
  });

  // ── Public state ──────────────────────────────────────────────────────────
  readonly catalog = computed(() => this.catalogResource.value() ?? null);
  readonly profile = computed(() => this.profileResource.value() ?? null);
  readonly config = computed(() => this.configResource.value() ?? null);
  readonly loading = computed(() => this.catalogResource.isLoading());
  readonly activeTab = signal<CategoryTab>('all');
  readonly searchQuery = signal('');
  /** When true, only items the raider can actually reserve are listed (hides chase-only items). Off by default. */
  readonly onlyReservable = signal(false);
  /** Item list (default) or the World of Warcraft style character pane. */
  readonly view = signal<LootView>('list');
  /** Gear the character currently wears (from the Blizzard armory), as last synced. */
  readonly equipment = signal<IEquippedItem[]>([]);
  /** The raider's own "this worn item is best in slot" marks (crafted pieces, dungeon items, catalysed tier pieces). */
  readonly bisMarks = signal<IBisMark[]>([]);
  private equipmentSyncStarted = false;
  private readonly _equippedByWowId = computed(() => {
    const map = new Map<number, IEquippedItem>();
    for (const piece of this.equipment()) map.set(piece.itemId, piece);
    return map;
  });
  /** Armory render URL of the character, or null when there is none (yet). */
  readonly characterImageUrl = computed(() => this.characterMediaResource.value()?.url ?? null);

  // ── Private derived maps ───────────────────────────────────────────────────
  private readonly _receivedItemsMap = computed(() => {
    const items = this.receivedItemsResource.value() ?? [];
    const map = new Map<string, IReceivedItem>();
    items.forEach((r) => map.set(r.itemId, r));
    return map;
  });
  private readonly _reservationMap = computed(() => {
    const reservations = this.reservationsResource.value() ?? [];
    const map = new Map<string, string>();
    reservations.forEach((r) => map.set(r.itemId, r.id));
    return map;
  });
  private readonly _chaseMap = computed(() => {
    const chases = this.chaseItemsResource.value() ?? [];
    const map = new Map<string, { id: string; methods: ChaseMethod[] }>();
    chases.forEach((c) => map.set(c.itemId, { id: c.id, methods: c.methods?.length ? c.methods : [ChaseMethod.BOSS_DROP] }));
    return map;
  });
  private readonly _assignmentStatusMap = computed(() => {
    const reservations = this.reservationsResource.value() ?? [];
    const map = new Map<string, AssignmentStatus>();
    reservations.forEach((r) => {
      if (r.assignment?.status) map.set(r.itemId, r.assignment.status);
    });
    return map;
  });
  private readonly _peerCountsMap = computed(() => {
    const counts = this.peerCountsResource.value() ?? {};
    const map = new Map<string, Record<AssignmentStatus, number>>();
    Object.entries(counts).forEach(([id, c]) => map.set(id, c as Record<AssignmentStatus, number>));
    return map;
  });

  // ── Limits (from config) ──────────────────────────────────────────────────
  readonly trinketLimit = computed(() => this.config()?.trinketLimit ?? 2);
  readonly weaponLimit = computed(() => this.config()?.weaponLimit ?? 2);
  readonly jewelryLimit = computed(() => this.config()?.jewelryLimit ?? 0);
  readonly armorLimit = computed(() => this.config()?.armorLimit ?? 0);
  readonly superrareLimit = computed(() => this.config()?.superrareLimit ?? 0);
  /** Whether this season has bonus rolls (officers switch it in the season config). */
  readonly bonusRollEnabled = computed(() => this.config()?.bonusRollEnabled ?? true);
  /**
   * The best item levels of the season (drops and bonus rolls), or null when the season has none: "best in slot" is
   * then simply the Myth tier. Officers maintain them in the season config.
   */
  readonly itemLevelCaps = computed((): ItemLevelCaps | null => {
    const c = this.config();
    if (!c || c.maxItemLevel == null) return null;
    return {
      maxItemLevel: c.maxItemLevel,
      bonusRollItemLevels: c.bonusRollItemLevels ?? {},
      bonusRollEnabled: c.bonusRollEnabled,
      // the Hero track tops out where Hero 6/6 and Myth 2/6 meet
      heroMaxItemLevel: c.ambiguousItemLevelFrom,
    };
  });

  // ── Reservation counters ──────────────────────────────────────────────────
  readonly reservedTrinkets = computed(() => this._countReserved((cat) => cat === ItemCategory.TRINKET));
  readonly reservedWeapons = computed(() =>
    this._countReserved((cat) => cat === ItemCategory.WEAPON || cat === ItemCategory.OFFHAND),
  );
  readonly reservedJewelry = computed(() => this._countReserved((cat) => cat === ItemCategory.JEWELRY));
  readonly reservedArmor = computed(() => this._countReserved((cat) => ARMOR_ITEM_CATEGORIES.has(cat as ItemCategory)));
  readonly reservedSuperrare = computed(
    () => Array.from(this._reservationMap().keys()).filter((id) => this.findItem(id)?.isSuperRare === true).length,
  );

  // ── Profile color ─────────────────────────────────────────────────────────
  readonly classColor = computed(() => {
    const wowClass = this.profile()?.wowClass;
    if (!wowClass) return 'var(--accent-gold)';
    return getClassData(wowClass).color ?? 'var(--accent-gold)';
  });

  // ── Visible tabs (only tabs with at least one item the raider can see) ─────
  readonly visibleTabs = computed((): LootCategoryTab[] => {
    const catalog = this.catalog();
    if (!catalog) return LOOT_CATEGORY_TABS.filter((t) => t.key === 'all');
    return LOOT_CATEGORY_TABS.filter((tab) => {
      if (tab.key === 'all') return true;
      return catalog.bosses.some((boss) =>
        boss.items.some((item) => this.isItemListable(item) && itemMatchesTab(item, tab.key)),
      );
    });
  });

  /** Per item: the Blizzard encounter of its boss and the item level of the piece the raider wears (if worn). */
  private readonly _itemFacts = computed(() => {
    const facts = new Map<
      string,
      { encounterId: number | undefined; wornItemLevel: number | null; wornTier: AssignmentStatus | null; piece: IEquippedItem | null }
    >();
    const worn = this._equippedByWowId();
    for (const boss of this.catalog()?.bosses ?? []) {
      for (const i of boss.items) {
        const formIds = [i.wowItemId, ...boss.items.filter((o) => o.mergedWithItemId === i.wowItemId).map((o) => o.wowItemId)];
        const piece = formIds.map((id) => (id == null ? undefined : worn.get(id))).find((w): w is IEquippedItem => !!w);
        // A catalysed item is worn as a different item (the tier piece of that slot). It counts as what the raider has of
        // this item, so a bonus roll chase on it is judged against that piece (e.g. 334: only a Mythic bonus roll helps).
        const name = i.mergedDisplayName ?? i.name;
        const catalysed = piece ? undefined : this.bisMarks().find((m) => m.reason === 'catalyst' && m.note === name);
        const have = piece ?? (catalysed ? this.equipment().find((w) => w.slot === catalysed.slot && w.itemId === catalysed.itemId) : undefined);
        facts.set(i.id, {
          encounterId: boss.wowEncounterId,
          wornItemLevel: have?.itemLevel ?? null,
          wornTier: have?.tier ?? null,
          piece: piece ?? null,
        });
      }
    }
    return facts;
  });

  // ── Reserved + chased items (for the character pane) ──────────────────────
  readonly trackedItems = computed((): TrackedItem[] => {
    const catalog = this.catalog();
    if (!catalog) return [];
    const reservations = this._reservationMap();
    const chases = this._chaseMap();
    const worn = this._equippedByWowId();
    const tracked: TrackedItem[] = [];
    for (const boss of catalog.bosses) {
      for (const i of boss.items) {
        if (i.mergedWithItemId != null) continue; // secondary of a merged item: counted on its primary
        const reserved = reservations.has(i.id);
        const chased = !reserved && chases.has(i.id);
        if (!reserved && !chased) continue;
        const item: ItemWithReservation = {
          ...i,
          name: i.mergedDisplayName ?? i.name,
          isReserved: reserved,
          reservationId: reservations.get(i.id),
          isChased: chased,
          chaseItemId: chases.get(i.id)?.id,
          chaseMethods: chases.get(i.id)?.methods,
        };
        // The worn item may be this item or (for a merged item) its secondary form
        const formIds = [i.wowItemId, ...boss.items.filter((o) => o.mergedWithItemId === i.wowItemId).map((o) => o.wowItemId)];
        const equippedItem =
          formIds.map((id) => (id == null ? undefined : worn.get(id))).find((w): w is IEquippedItem => !!w) ?? null;
        tracked.push({
          item,
          kind: reserved ? 'reserved' : 'chased',
          bossName: boss.name,
          tiers: reserved ? this.reservedTiersFor(i.id) : [],
          isBis: this.isBis(i.id) || (equippedItem !== null && this.bisInfoFor(equippedItem).isBis),
          upgradeTo: this.bonusRollUpgradeTo(i.id),
          needs: this.difficultyNeeds(i.id),
          equippedItem,
        });
      }
    }
    return tracked;
  });

  // ── Raid grouping ─────────────────────────────────────────────────────────
  readonly raidGroups = computed((): RaidGroup[] => {
    const catalog = this.catalog();
    if (!catalog) return [];
    const groups = new Map<string, { color: string; bosses: IBoss[] }>();
    for (const boss of catalog.bosses) {
      const key = boss.raidName ?? 'Unknown Raid';
      if (!groups.has(key)) {
        groups.set(key, { color: boss.raidAccentColor ?? '#94a3b8', bosses: [] });
      }
      groups.get(key)?.bosses.push(boss);
    }
    return Array.from(groups.entries()).map(([raidName, v]) => ({ raidName, ...v }));
  });

  // ── Data loading ──────────────────────────────────────────────────────────

  constructor() {
    // Restore active tab from session storage
    const saved = sessionStorage.getItem(SESSION_ACTIVE_TAB_KEY) as CategoryTab | null;
    if (saved && LOOT_CATEGORY_TABS.some((t) => t.key === saved)) {
      this.activeTab.set(saved);
    }
    this.onlyReservable.set(sessionStorage.getItem(SESSION_ONLY_RESERVABLE_KEY) === '1');
    if (sessionStorage.getItem(SESSION_VIEW_KEY) === 'character') this.setView('character');
    // Once catalog and profile are known, sync the worn gear from the armory (the server skips it when recent)
    effect(() => {
      if (!this.catalog() || !this.profile()) return;
      untracked(() => {
        if (this.equipmentSyncStarted) return;
        this.equipmentSyncStarted = true;
        void this.syncEquipment();
      });
    });
    // Reset to 'all' if current tab is no longer visible after catalog loads
    effect(() => {
      const catalog = this.catalogResource.value();
      if (!catalog) return;
      if (!this.visibleTabs().some((t) => t.key === this.activeTab())) {
        this.setActiveTab('all');
      }
    });
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  setActiveTab(tab: CategoryTab): void {
    this.activeTab.set(tab);
    sessionStorage.setItem(SESSION_ACTIVE_TAB_KEY, tab);
  }

  /**
   * Reads the worn gear from the Blizzard armory. Reserved / chased items that turn out to be worn are ticked off by
   * the server (their "already have" tier is raised, a Myth chase comes off the list), so the lists are reloaded.
   * Failures are silent: the loot page works fine without gear data.
   */
  async syncEquipment(): Promise<void> {
    try {
      const result = await firstValueFrom(this.lootService.syncEquipment());
      this.equipment.set(result.equipment);
      this.bisMarks.set(result.bisMarks ?? []);
      if (result.updates.length === 0) return;
      this.reservationsResource.reload();
      this.receivedItemsResource.reload();
      this.chaseItemsResource.reload();
      this.peerCountsResource.reload();
      const names = result.updates
        .filter((u) => u.kind === 'received')
        .map((u) => `${u.itemName} (${TIER_LABELS[u.tier]})`);
      this.toast.show(`Gear bijgewerkt: ${names.join(', ') || 'chase-lijst'} al in bezit.`);
    } catch {
      /* armory unreachable or not logged in: keep whatever we had */
    }
  }

  setView(view: LootView): void {
    this.view.set(view);
    sessionStorage.setItem(SESSION_VIEW_KEY, view);
    if (view === 'character') this.mediaRequested.set(true);
  }

  setOnlyReservable(value: boolean): void {
    this.onlyReservable.set(value);
    sessionStorage.setItem(SESSION_ONLY_RESERVABLE_KEY, value ? '1' : '0');
  }

  async saveProfile(dto: ProfileSaveDto): Promise<IRaiderProfile> {
    const req = this.profile() ? this.lootService.updateProfile(dto) : this.lootService.saveProfile(dto);
    const p = await firstValueFrom(req);
    this.profileResource.update(() => p);
    return p;
  }

  async reserve(itemId: string, itemName?: string, receivedTier?: AssignmentStatus): Promise<void> {
    const seasonId = this.catalog()?.season.id;
    if (!seasonId) return;
    await firstValueFrom(this.lootService.reserve(itemId, seasonId, itemName, receivedTier));
    this.reservationsResource.reload();
    this.receivedItemsResource.reload();
    this.chaseItemsResource.reload(); // the server drops a chase entry once the item is reserved
    this.peerCountsResource.reload();
  }

  /**
   * Sets how the raider chases an item (an "I want this" marker, not a reservation, no limits): from the boss, with a
   * bonus roll, or both. An empty list removes the chase.
   */
  async setChase(itemId: string, methods: ChaseMethod[]): Promise<void> {
    const seasonId = this.catalog()?.season.id;
    if (!seasonId) return;
    await firstValueFrom(this.lootService.setChaseItem(itemId, seasonId, methods));
    this.chaseItemsResource.reload();
  }

  /** Switches one way of getting the item on or off (boss drop and bonus roll can both be on). */
  async toggleChaseMethod(itemId: string, method: ChaseMethod): Promise<void> {
    const current = this._chaseMap().get(itemId)?.methods ?? [];
    const next = current.includes(method) ? current.filter((m) => m !== method) : [...current, method];
    await this.setChase(itemId, next);
  }

  async unchase(itemId: string): Promise<void> {
    const chaseId = this._chaseMap().get(itemId)?.id;
    if (!chaseId) return;
    await firstValueFrom(this.lootService.removeChaseItem(chaseId));
    this.chaseItemsResource.reload();
  }

  async markItemReceived(itemId: string, tier: AssignmentStatus, itemName?: string): Promise<IReceivedItem> {
    const received = await firstValueFrom(this.lootService.markItemReceived(itemId, tier, itemName));
    this.receivedItemsResource.reload();
    return received;
  }

  /**
   * Cancels a reservation and removes any floor-marker receivedItem.
   * A MYTH_TIER receivedItem (BiS) is intentionally kept.
   */
  async cancelReservationAndCleanup(reservationId: string, itemId: string): Promise<void> {
    const seasonId = this.catalog()?.season.id;
    if (!reservationId || !seasonId) return;
    const receivedItem = this.getReceivedItem(itemId);
    if (receivedItem && receivedItem.tier !== AssignmentStatus.MYTH_TIER) {
      await firstValueFrom(this.lootService.removeReceivedItem(receivedItem.id));
      this.receivedItemsResource.reload();
    }
    await firstValueFrom(this.lootService.cancelReservation(reservationId));
    this.reservationsResource.reload();
    this.peerCountsResource.reload();
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  getReceivedItem(itemId: string): IReceivedItem | null {
    return this._receivedItemsMap().get(itemId) ?? null;
  }

  getAssignmentStatus(itemId: string): AssignmentStatus | null {
    return this._assignmentStatusMap().get(itemId) ?? null;
  }

  /** Count of OTHER eligible raiders competing for the given tier on this item. */
  peerCountFor(itemId: string, tier: AssignmentStatus): number {
    return this._peerCountsMap().get(itemId)?.[tier] ?? 0;
  }

  isReserved(itemId: string): boolean {
    return this._reservationMap().has(itemId);
  }

  getReservationId(itemId: string): string | undefined {
    return this._reservationMap().get(itemId);
  }

  private readonly _catalogByWowId = computed(() => {
    const map = new Map<number, IItem>();
    for (const boss of this.catalog()?.bosses ?? []) for (const i of boss.items) if (i.wowItemId != null) map.set(i.wowItemId, i);
    return map;
  });

  /**
   * Whether the worn piece is best in slot for the raider, and why: the raider marked it ('manual', or 'catalyst' for
   * a tier piece made by catalysing a chased item), or it is an item of the loot list worn at the best item level
   * of a boss drop ('item'; this is also what a chased item that is worn at its maximum looks like).
   */
  bisInfoFor(piece: IEquippedItem): { isBis: boolean; reason: 'manual' | 'catalyst' | 'item' | null; note: string | null } {
    const mark = this.bisMarks().find((m) => m.slot === piece.slot && m.itemId === piece.itemId);
    if (mark) return { isBis: true, reason: mark.reason, note: mark.note };
    if (this._catalogByWowId().has(piece.itemId)) {
      const caps = this.itemLevelCaps();
      const atBest = caps ? piece.itemLevel >= caps.maxItemLevel : piece.tier === AssignmentStatus.MYTH_TIER;
      if (atBest) return { isBis: true, reason: 'item', note: null };
    }
    return { isBis: false, reason: null, note: null };
  }

  isBisMarked(piece: IEquippedItem): boolean {
    return this.bisMarks().some((m) => m.slot === piece.slot && m.itemId === piece.itemId);
  }

  /** Marks / unmarks the worn piece as best in slot (the raider's own override). */
  async toggleBisMark(piece: IEquippedItem): Promise<void> {
    const marks = this.isBisMarked(piece)
      ? await firstValueFrom(this.lootService.unmarkBis(piece.slot))
      : await firstValueFrom(this.lootService.markBis(piece.slot, piece.itemId));
    this.bisMarks.set(marks);
  }

  /**
   * Catalyst: the chased item was turned into the tier piece worn in `slot`. That piece becomes best in slot, the chased
   * item counts as obtained and the chase goes.
   */
  async catalyse(chaseItemId: string, slot: EquipmentSlot): Promise<void> {
    this.bisMarks.set(await firstValueFrom(this.lootService.catalyseChase(chaseItemId, slot)));
    this.chaseItemsResource.reload();
    this.receivedItemsResource.reload();
    this.peerCountsResource.reload();
  }

  /** Tiers a reservation still covers: everything above the tier the raider already received (all three if none). */
  reservedTiersFor(itemId: string): AssignmentStatus[] {
    const tiers = [AssignmentStatus.CHAMPION_TIER, AssignmentStatus.HERO_TIER, AssignmentStatus.MYTH_TIER];
    const received = this.getReceivedItem(itemId);
    if (!received) return tiers;
    const idx = tiers.indexOf(received.tier);
    return idx < 0 ? tiers : tiers.slice(idx + 1);
  }

  private itemLevelState(itemId: string): ItemLevelState {
    const facts = this._itemFacts().get(itemId);
    return {
      caps: this.itemLevelCaps(),
      encounterId: facts?.encounterId,
      wornItemLevel: facts?.wornItemLevel ?? null,
      // Having the item means: reserved and received (or assigned) on Myth, or the exact item is worn on Myth. A chase
      // alone never counts as owning it, and a leftover "received" row (e.g. from a catalysed item, which is consumed)
      // does not either.
      mythReceived: (this._reservationMap().has(itemId) && this.hasMythTier(itemId)) || facts?.wornTier === AssignmentStatus.MYTH_TIER,
    };
  }

  /**
   * Best in slot: the raider has this item at the best item level that can still be obtained for it. A Myth item is
   * not necessarily best in slot: a bonus roll on some bosses gives a higher item level (e.g. 344 instead of 334).
   */
  isBis(itemId: string): boolean {
    return isBestInSlot(this.itemLevelState(itemId));
  }

  /** The piece of this item the raider wears right now (armory), or null. */
  equippedPieceOf(itemId: string): IEquippedItem | null {
    return this._itemFacts().get(itemId)?.piece ?? null;
  }

  /** Item level of the raider's piece of this item: the worn piece, else what a received Hero / Myth drop amounts to. */
  haveItemLevel(itemId: string): number | null {
    const worn = this._itemFacts().get(itemId)?.wornItemLevel;
    if (worn) return worn;
    const caps = this.itemLevelCaps();
    if (!caps || !this._reservationMap().has(itemId)) return null;
    const tier = this.getReceivedItem(itemId)?.tier;
    if (tier === AssignmentStatus.MYTH_TIER) return caps.maxItemLevel;
    if (tier === AssignmentStatus.HERO_TIER) return caps.heroMaxItemLevel ?? null;
    return null;
  }

  /**
   * From which difficulty a drop / bonus roll still improves what the raider has of this item. E.g. with a 341 piece
   * only a Mythic bonus roll (344) helps; with a Hero piece a Heroic bonus roll already gives a Mythic version.
   */
  difficultyNeeds(itemId: string): DifficultyNeeds {
    const caps = this.itemLevelCaps();
    if (!caps) return { drop: null, bonusRoll: null };
    const args = { caps, have: this.haveItemLevel(itemId), encounterId: this._itemFacts().get(itemId)?.encounterId };
    return { drop: minimumDifficulty({ ...args, way: 'drop' }), bonusRoll: minimumDifficulty({ ...args, way: 'bonus_roll' }) };
  }

  /** The item level a bonus roll could still upgrade the raider's piece of this item to, or null. */
  bonusRollUpgradeTo(itemId: string): number | null {
    // Only an item that is best in slot has a bonus roll *upgrade* left; below that it is simply not done yet
    const to = upgradeLevel(this.itemLevelState(itemId));
    return to !== null && this.isBis(itemId) ? to : null;
  }

  /** The raider has this item on Myth tier (received or assigned). */
  hasMythTier(itemId: string): boolean {
    return (
      this.getReceivedItem(itemId)?.tier === AssignmentStatus.MYTH_TIER ||
      this.getAssignmentStatus(itemId) === AssignmentStatus.MYTH_TIER
    );
  }

  /** True when the raider has the item on their chase list (and has not reserved it). */
  isChased(itemId: string): boolean {
    return this._chaseMap().has(itemId) && !this._reservationMap().has(itemId);
  }

  /**
   * Every gear item the raider can use is listed — also categories without a reservation limit (e.g. armor), which
   * can be chased instead. The "only reservable" toggle narrows this down to what can actually be reserved.
   */
  isItemListable(i: IItem): boolean {
    if (!i.itemLevel || i.itemLevel <= 1) return false;
    if (!i.isPrioritizable) return false;
    // Secondary merged items are hidden — they count against the primary's reservation
    if (i.mergedWithItemId != null) return false;
    const profile = this.profile();
    if (!profile) return false; // no profile = nothing to match against
    if (!canClassReserveItem(profile.wowClass, profile.spec as WowSpec, i)) return false;
    if (this.onlyReservable() && this.config() && !this.isItemReservable(i)) return false;
    return true;
  }

  getFilteredItems(items: IItem[]): ItemWithReservation[] {
    const activeTab = this.activeTab();
    const query = this.searchQuery().toLowerCase().trim();
    const map = this._reservationMap();
    const chaseMap = this._chaseMap();
    return items
      .filter((i) => {
        if (!this.isItemListable(i)) return false;
        if (activeTab !== 'all' && !itemMatchesTab(i, activeTab)) return false;
        const displayName = i.mergedDisplayName ?? i.name;
        if (query && !displayName.toLowerCase().includes(query)) return false;
        return true;
      })
      .map((i) => ({
        ...i,
        // Show the merged display name in the UI when set
        name: i.mergedDisplayName ?? i.name,
        isReserved: map.has(i.id),
        reservationId: map.get(i.id),
        isChased: !map.has(i.id) && chaseMap.has(i.id),
        chaseItemId: chaseMap.get(i.id)?.id,
        chaseMethods: chaseMap.get(i.id)?.methods,
      }));
  }

  hasBossItems(items: IItem[]): boolean {
    return this.getFilteredItems(items).length > 0;
  }

  /** Business rule: can this item be reserved given the current season config? */
  isItemReservable(item: IItem): boolean {
    if (item.isSuperRare && this.superrareLimit() > 0) return true;
    if (item.category === ItemCategory.TRINKET) return this.trinketLimit() > 0;
    if (item.category === ItemCategory.WEAPON || item.category === ItemCategory.OFFHAND) return this.weaponLimit() > 0;
    if (item.category === ItemCategory.JEWELRY) return this.jewelryLimit() > 0;
    return this.armorLimit() > 0;
  }

  /** Business rule: has the raider hit their reservation limit for this item's category? */
  isAtLimit(item: IItem): boolean {
    const { category, isSuperRare } = item;

    if (isSuperRare && this.superrareLimit() > 0 && this.reservedSuperrare() >= this.superrareLimit()) return true;

    if (category === ItemCategory.TRINKET) return this.reservedTrinkets() >= this.trinketLimit();
    if (category === ItemCategory.WEAPON || category === ItemCategory.OFFHAND)
      return this.reservedWeapons() >= this.weaponLimit();
    if (category === ItemCategory.JEWELRY) {
      if (this.jewelryLimit() === 0) return false;
      return this.reservedJewelry() >= this.jewelryLimit();
    }
    if (this.armorLimit() === 0) return false;
    return this.reservedArmor() >= this.armorLimit();
  }

  findItem(itemId: string): IItem | undefined {
    return this.catalog()
      ?.bosses.flatMap((b) => b.items)
      .find((i) => i.id === itemId);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _countReserved(predicate: (cat: string) => boolean): number {
    return Array.from(this._reservationMap().keys()).filter((id) => {
      const item = this.findItem(id);
      // Secondary merged items don't count — their reservation is folded into the primary
      if (item?.mergedWithItemId != null) return false;
      const cat = item?.category;
      return cat !== undefined && predicate(cat);
    }).length;
  }
}

// ── Pure domain helper (no class needed) ─────────────────────────────────────

/**
 * Determine whether an item belongs to the given tab.
 * Pure function — zero dependencies, fully testable.
 */
export function itemMatchesTab(item: IItem, tab: CategoryTab): boolean {
  if (tab === 'weapon') return item.category === ItemCategory.WEAPON || item.category === ItemCategory.OFFHAND;
  if (tab === 'other') return ARMOR_ITEM_CATEGORIES.has(item.category);
  return item.category === (tab as ItemCategory);
}
