import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { LootService } from './loot.service';
import {
  IItem,
  IBoss,
  IReceivedItem,
  IRaiderProfile,
  ItemCategory,
  AssignmentStatus,
  ARMOR_ITEM_CATEGORIES,
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
  SESSION_ACTIVE_TAB_KEY,
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
  private readonly peerCountsResource = rxResource({ stream: () => this.lootService.getItemPeerCounts() });

  // ── Public state ──────────────────────────────────────────────────────────
  readonly catalog = computed(() => this.catalogResource.value() ?? null);
  readonly profile = computed(() => this.profileResource.value() ?? null);
  readonly config = computed(() => this.configResource.value() ?? null);
  readonly loading = computed(() => this.catalogResource.isLoading());
  readonly activeTab = signal<CategoryTab>('all');
  readonly searchQuery = signal('');

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

  // ── Visible tabs (only tabs with at least one reservable item) ────────────
  readonly visibleTabs = computed((): LootCategoryTab[] => {
    const catalog = this.catalog();
    const config = this.config();
    if (!catalog) return LOOT_CATEGORY_TABS.filter((t) => t.key === 'all');
    return LOOT_CATEGORY_TABS.filter((tab) => {
      if (tab.key === 'all') return true;
      return catalog.bosses.some((boss) =>
        boss.items.some((item) => {
          if (!item.itemLevel || item.itemLevel <= 1) return false;
          if (config && !this.isItemReservable(item)) return false;
          return itemMatchesTab(item, tab.key);
        }),
      );
    });
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
    this.peerCountsResource.reload();
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

  getFilteredItems(items: IItem[]): ItemWithReservation[] {
    const activeTab = this.activeTab();
    const query = this.searchQuery().toLowerCase().trim();
    const map = this._reservationMap();
    const profile = this.profile();
    return items
      .filter((i) => {
        if (!i.itemLevel || i.itemLevel <= 1) return false;
        if (!i.isPrioritizable) return false;
        // Secondary merged items are hidden — they count against the primary's reservation
        if (i.mergedWithItemId != null) return false;
        if (!profile) return false; // no profile = nothing reservable visible
        if (this.config() && !this.isItemReservable(i)) return false;
        if (!canClassReserveItem(profile.wowClass, profile.spec as WowSpec, i)) return false;
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
