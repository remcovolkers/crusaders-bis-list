import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, EMPTY, map, tap } from 'rxjs';
import { LootService } from './loot.service';
import {
  IItem,
  IReceivedItem,
  ISeasonConfig,
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
} from '../domain/loot-ui.types';
import { CatalogResponse } from './loot.service';
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
  // ── Public state ──────────────────────────────────────────────────────────
  readonly catalog = signal<CatalogResponse | null>(null);
  readonly profile = signal<IRaiderProfile | null>(null);
  readonly config = signal<ISeasonConfig | null>(null);
  readonly loading = signal(true);
  readonly activeTab = signal<CategoryTab>('all');
  readonly searchQuery = signal('');

  // ── Private state ─────────────────────────────────────────────────────────
  private readonly _reservationMap = signal(new Map<string, string>());
  private readonly _receivedItemsMap = signal(new Map<string, IReceivedItem>());
  private readonly _assignmentStatusMap = signal(new Map<string, AssignmentStatus>());

  private readonly lootService = inject(LootService);
  private readonly toast = inject(ToastService);

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

  /** Call once from the container component's ngOnInit. */
  load(): void {
    const saved = sessionStorage.getItem(SESSION_ACTIVE_TAB_KEY) as CategoryTab | null;
    this.activeTab.set(saved && LOOT_CATEGORY_TABS.some((t) => t.key === saved) ? saved : 'all');

    this.lootService.getMyProfile().subscribe({ next: (p) => this.profile.set(p) });
    this.lootService.getSeasonConfig().subscribe({ next: (c) => this.config.set(c) });
    this.lootService.getMyReceivedItems().subscribe({
      next: (items) => {
        const map = new Map<string, IReceivedItem>();
        items.forEach((r) => map.set(r.itemId, r));
        this._receivedItemsMap.set(map);
      },
    });
    this.lootService.getCatalog().subscribe({
      next: (catalog) => {
        this.catalog.set(catalog);
        this.loading.set(false);
        this._loadReservations(catalog.season.id);
        if (!this.visibleTabs().some((t) => t.key === this.activeTab())) {
          this.setActiveTab('all');
        }
      },
      error: () => {
        this.toast.show('Kon catalogus niet laden.', 'error');
        this.loading.set(false);
      },
    });
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  setActiveTab(tab: CategoryTab): void {
    this.activeTab.set(tab);
    sessionStorage.setItem(SESSION_ACTIVE_TAB_KEY, tab);
  }

  saveProfile(dto: ProfileSaveDto): Observable<IRaiderProfile> {
    const req = this.profile() ? this.lootService.updateProfile(dto) : this.lootService.saveProfile(dto);
    return req.pipe(tap((p) => this.profile.set(p)));
  }

  reserve(itemId: string): Observable<void> {
    const seasonId = this.catalog()?.season.id;
    if (!seasonId) return EMPTY;
    return this.lootService.reserve(itemId, seasonId).pipe(
      tap(() => this._loadReservations(seasonId)),
      map(() => undefined),
    );
  }

  markItemReceived(itemId: string, tier: AssignmentStatus): Observable<IReceivedItem> {
    return this.lootService.markItemReceived(itemId, tier).pipe(
      tap((received) => {
        const map = new Map(this._receivedItemsMap());
        map.set(itemId, received);
        this._receivedItemsMap.set(map);
      }),
    );
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  getReceivedItem(itemId: string): IReceivedItem | null {
    return this._receivedItemsMap().get(itemId) ?? null;
  }

  getAssignmentStatus(itemId: string): AssignmentStatus | null {
    return this._assignmentStatusMap().get(itemId) ?? null;
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

  private _loadReservations(seasonId: string): void {
    this.lootService.getMyReservations(seasonId).subscribe({
      next: (reservations) => {
        const resMap = new Map<string, string>();
        const asnMap = new Map<string, AssignmentStatus>();
        reservations.forEach((r) => {
          resMap.set(r.itemId, r.id);
          if (r.assignment?.status) asnMap.set(r.itemId, r.assignment.status);
        });
        this._reservationMap.set(resMap);
        this._assignmentStatusMap.set(asnMap);

        // Sync received items: the backend clears them when a reservation is
        // cancelled, so reload to prevent stale "Gereserveerd voor Myth" labels.
        this.lootService.getMyReceivedItems().subscribe({
          next: (items) => {
            const map = new Map<string, IReceivedItem>();
            items.forEach((r) => map.set(r.itemId, r));
            this._receivedItemsMap.set(map);
          },
        });
      },
    });
  }

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

import { IBoss } from '@crusaders-bis-list/shared-domain';

/**
 * Determine whether an item belongs to the given tab.
 * Pure function — zero dependencies, fully testable.
 */
export function itemMatchesTab(item: IItem, tab: CategoryTab): boolean {
  if (tab === 'weapon') return item.category === ItemCategory.WEAPON || item.category === ItemCategory.OFFHAND;
  if (tab === 'other') return ARMOR_ITEM_CATEGORIES.has(item.category);
  return item.category === (tab as ItemCategory);
}
