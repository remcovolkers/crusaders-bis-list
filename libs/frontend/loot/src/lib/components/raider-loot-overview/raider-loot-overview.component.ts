import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ARMOR_ITEM_CATEGORIES, AssignmentStatus, ItemCategory } from '@crusaders-bis-list/shared-domain';
import { LootItemCardComponent } from '../loot-item-card/loot-item-card.component';
import { AuthStateService, AuthService } from '@crusaders-bis-list/frontend-auth';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';
import { RaiderLootStateService } from '../../services/raider-loot-state.service';
import { ItemWithReservation } from '../../ui-types/loot-ui.types';
import { ReserveModalComponent } from '../reserve-modal/reserve-modal.component';

@Component({
  selector: 'lib-raider-loot-overview',
  imports: [FormsModule, RouterLink, ReserveModalComponent, LootItemCardComponent],
  providers: [RaiderLootStateService],
  templateUrl: './raider-loot-overview.component.html',
  styleUrls: ['./raider-loot-overview.component.scss'],
})
export class RaiderLootOverviewComponent {
  private readonly authState = inject(AuthStateService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly isBnetLinked = computed(() => this.authState.user()?.bnetLinked ?? false);

  linkBnet(): void {
    this.authService.redirectToBnetLink();
  }

  readonly state = inject(RaiderLootStateService);

  /** `class-<slug>` helper class of the raider's WoW class (e.g. `class-death-knight`). */
  readonly classSlug = computed(() => {
    const wowClass = this.state.profile()?.wowClass;
    return wowClass ? 'class-' + wowClass.toLowerCase().replace(/\s+/g, '-') : '';
  });

  /** Limit tiles of the summary panel (one per reservation category with a limit). */
  readonly limitTiles = computed(() => {
    const s = this.state;
    const tiles = [
      { key: 'trinket', label: 'Trinkets', used: s.reservedTrinkets(), limit: s.trinketLimit() },
      { key: 'weapon', label: 'Wapens', used: s.reservedWeapons(), limit: s.weaponLimit() },
      { key: 'jewelry', label: 'Jewelry', used: s.reservedJewelry(), limit: s.jewelryLimit() },
      { key: 'armor', label: 'Armor', used: s.reservedArmor(), limit: s.armorLimit() },
      { key: 'superrare', label: 'Superrare', used: s.reservedSuperrare(), limit: s.superrareLimit() },
    ];
    return tiles.filter((t) => t.key === 'trinket' || t.key === 'weapon' || t.limit > 0);
  });

  /** The raider's reservations as slot chips (independent of the active tab / search filter). */
  readonly myReservations = computed(() => {
    const catalog = this.state.catalog();
    if (!catalog) return [];
    const result: { item: ItemWithReservation; group: string }[] = [];
    for (const boss of catalog.bosses) {
      for (const i of boss.items) {
        if (i.mergedWithItemId != null || !this.state.isReserved(i.id)) continue;
        const group = this.categoryGroup(i.category);
        result.push({
          group,
          item: { ...i, name: i.mergedDisplayName ?? i.name, isReserved: true, reservationId: this.state.getReservationId(i.id) },
        });
      }
    }
    return result;
  });

  /** Free category slots (trinket, weapon, jewelry, armor), shown as dashed empty slots. */
  readonly emptySlots = computed(() => {
    const free = (limit: number, used: number, label: string) => ({ label, count: Math.max(0, limit - used) });
    const s = this.state;
    return [
      free(s.trinketLimit(), s.reservedTrinkets(), 'Trinket'),
      free(s.weaponLimit(), s.reservedWeapons(), 'Wapen'),
      free(s.jewelryLimit(), s.reservedJewelry(), 'Jewelry'),
      free(s.armorLimit(), s.reservedArmor(), 'Armor'),
    ].filter((e) => e.count > 0);
  });

  /** Bosses that have at least one visible item, with their filtered items. */
  readonly bossGroups = computed(() => {
    const catalog = this.state.catalog();
    if (!catalog) return [];
    return catalog.bosses
      .map((boss) => ({ boss, items: this.state.getFilteredItems(boss.items) }))
      .filter((g) => g.items.length > 0);
  });

  readonly isFiltered = computed(() => this.state.activeTab() !== 'all' || this.state.searchQuery().trim() !== '');

  resetFilters(): void {
    this.state.setActiveTab('all');
    this.state.searchQuery.set('');
  }

  readonly totalSlots = computed(
    () => this.state.trinketLimit() + this.state.weaponLimit() + this.state.jewelryLimit() + this.state.armorLimit(),
  );

  private categoryGroup(category: ItemCategory): string {
    if (category === ItemCategory.TRINKET) return 'Trinket';
    if (category === ItemCategory.WEAPON || category === ItemCategory.OFFHAND) return 'Wapen';
    if (category === ItemCategory.JEWELRY) return 'Jewelry';
    return ARMOR_ITEM_CATEGORIES.has(category) ? 'Armor' : 'Item';
  }

  constructor() {
    if (this.route.snapshot.queryParamMap.get('bnet_linked')) {
      this.toast.show('Battle.net account gekoppeld! 🎉');
    }
  }

  // UI-only modal state (not part of application state)
  readonly showReserveModal = signal(false);
  readonly isEditingReservation = signal(false);
  readonly pendingReserveItem = signal<ItemWithReservation | null>(null);

  readonly pendingReservedTier = (): AssignmentStatus | null => {
    const item = this.pendingReserveItem();
    if (!item) return null;
    return this.state.getReceivedItem(item.id)?.tier ?? null;
  };

  // Reserve modal
  openReserveModal(item: ItemWithReservation): void {
    this.pendingReserveItem.set(item);
    this.isEditingReservation.set(false);
    this.showReserveModal.set(true);
  }

  openEditReserveModal(item: ItemWithReservation): void {
    this.pendingReserveItem.set(item);
    this.isEditingReservation.set(true);
    this.showReserveModal.set(true);
  }

  async onReserveConfirmed(tier: AssignmentStatus | null): Promise<void> {
    const item = this.pendingReserveItem();
    const isEditing = this.isEditingReservation();
    if (!item) return;

    this.showReserveModal.set(false);
    this.pendingReserveItem.set(null);
    this.isEditingReservation.set(false);

    if (isEditing) {
      try {
        await this.state.markItemReceived(
          item.id,
          tier ?? AssignmentStatus.CHAMPION_TIER,
          item.mergedDisplayName ?? item.name,
        );
        this.toast.show('Reservering bijgewerkt.');
      } catch (e) {
        const msg = (e as { error?: { message?: string } }).error?.message ?? 'Bijwerken mislukt';
        this.toast.show(msg, 'error');
      }
      return;
    }

    const doReserve = async (reservedTier?: typeof tier): Promise<void> => {
      try {
        await this.state.reserve(item.id, item.mergedDisplayName ?? item.name, reservedTier ?? undefined);
      } catch (e) {
        const msg = (e as { error?: { message?: string } }).error?.message ?? 'Reservering mislukt';
        this.toast.show(msg, 'error');
      }
    };

    if (tier) {
      try {
        await this.state.markItemReceived(item.id, tier, item.mergedDisplayName ?? item.name);
      } catch {
        // Even on error, still try to reserve
      }
      await doReserve(tier);
    } else {
      await doReserve();
    }
  }

  onReserveCancelled(): void {
    this.showReserveModal.set(false);
    this.pendingReserveItem.set(null);
    this.isEditingReservation.set(false);
  }

  async onReceivedAtMythTier(): Promise<void> {
    const item = this.pendingReserveItem();
    if (!item) return;
    this.showReserveModal.set(false);
    this.pendingReserveItem.set(null);
    try {
      await this.state.markItemReceived(item.id, AssignmentStatus.MYTH_TIER, item.mergedDisplayName ?? item.name);
      try {
        await this.state.reserve(item.id, item.mergedDisplayName ?? item.name, AssignmentStatus.MYTH_TIER);
        this.toast.show('BiS in bezit gemarkeerd en reservering aangemaakt! 🎉');
      } catch (e) {
        const msg = (e as { error?: { message?: string } }).error?.message ?? 'Reservering mislukt';
        this.toast.show(msg, 'error');
      }
    } catch (e) {
      const msg = (e as { error?: { message?: string } }).error?.message ?? 'Markering mislukt';
      this.toast.show(msg, 'error');
    }
  }

  getBossColor(boss: { raidAccentColor?: string }): string {
    return boss.raidAccentColor ?? '#94a3b8';
  }
}
