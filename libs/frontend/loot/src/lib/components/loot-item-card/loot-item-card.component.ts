import { Component, computed, inject, input, output, signal } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  AssignmentStatus,
  ChaseMethod,
  IEquippedItem,
  IItem,
  ITEM_CATEGORY_LABELS,
  ItemCategory,
  PRIMARY_STAT_LABELS,
  RaidDifficulty,
  TIER_LABELS,
  WEAPON_TYPE_LABELS,
} from '@crusaders-bis-list/shared-domain';
import { RaiderLootStateService } from '../../services/raider-loot-state.service';
import { ItemWithReservation } from '../../ui-types/loot-ui.types';
import { LootService } from '../../services/loot.service';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';

const TIER_ORDER: Record<AssignmentStatus, number> = {
  [AssignmentStatus.CHAMPION_TIER]: 0,
  [AssignmentStatus.HERO_TIER]: 1,
  [AssignmentStatus.MYTH_TIER]: 2,
};

@Component({
  selector: 'lib-loot-item-card',
  imports: [NgClass, NgTemplateOutlet],
  templateUrl: './loot-item-card.component.html',
  styleUrls: ['./loot-item-card.component.scss'],
})
export class LootItemCardComponent {
  protected readonly state = inject(RaiderLootStateService);
  private readonly lootService = inject(LootService);
  private readonly toast = inject(ToastService);

  readonly item = input.required<ItemWithReservation>();
  readonly allBossItems = input.required<IItem[]>();
  readonly reserveClicked = output<void>();
  readonly editReservationClicked = output<void>();

  readonly categoryLabels = ITEM_CATEGORY_LABELS;
  readonly weaponTypeLabels = WEAPON_TYPE_LABELS;
  readonly primaryStatLabels = PRIMARY_STAT_LABELS;
  readonly tierLabels = TIER_LABELS;
  readonly ItemCategory = ItemCategory;
  readonly AssignmentStatus = AssignmentStatus;
  readonly ChaseMethod = ChaseMethod;

  readonly infoModal = signal<'res' | 'lim' | null>(null);
  readonly chaseBusy = signal(false);

  /** Reservable, but the raider has used up the limit of its category: the limit info sits in the card's corner. */
  readonly showLimitInfo = computed(() => {
    const item = this.item();
    return (
      !item.isReserved &&
      this.state.isItemReservable(item) &&
      this.state.isAtLimit(item) &&
      !this.state.isBis(item.id) &&
      this.state.bonusRollUpgradeTo(item.id) === null
    );
  });

  /** The item is on the raider's chase list (also next to a reservation: an upgrade plan). */
  hasChase(): boolean {
    return (this.item().chaseMethods ?? []).length > 0;
  }

  /** "Hero · 321": what the raider wears of this item. */
  equipLabel(piece: IEquippedItem): string {
    const tier = piece.tier ? TIER_LABELS[piece.tier] : piece.tierLabel;
    return [tier, piece.itemLevel || null].filter(Boolean).join(' · ');
  }

  /** On which difficulty a bonus roll still upgrades this item, as a suffix for the upgrade note. */
  bonusRollNeed(): string {
    const need = this.state.difficultyNeeds(this.item().id).bonusRoll;
    if (need === RaidDifficulty.MYTHIC) return ' · alleen op Mythic';
    if (need === RaidDifficulty.HEROIC) return ' · vanaf Heroic';
    return '';
  }

  isChasedWith(method: ChaseMethod): boolean {
    // chaseMethods is only set while the raider has a chase on the item (also next to a reservation: an upgrade plan)
    return (this.item().chaseMethods ?? []).includes(method);
  }

  /**
   * Switches one way of getting the item on or off. Boss drop and bonus roll can both be on (it does not matter how the
   * item comes); switching the last one off removes the chase.
   */
  async toggleChase(method: ChaseMethod): Promise<void> {
    const item = this.item();
    if (this.chaseBusy()) return;
    this.chaseBusy.set(true);
    try {
      await this.state.toggleChaseMethod(item.id, method);
    } catch (e) {
      const msg = (e as { error?: { message?: string } }).error?.message ?? 'Chase-lijst bijwerken mislukt';
      this.toast.show(msg, 'error');
    } finally {
      this.chaseBusy.set(false);
    }
  }

  // Peers popover — lazy loaded via rxResource when a tier popover opens
  readonly activePeerTier = signal<AssignmentStatus | null>(null);
  private readonly peersResource = rxResource({
    params: () => (this.activePeerTier() !== null ? this.item().id : undefined),
    stream: ({ params: itemId }) => this.lootService.getItemPeers(itemId),
  });
  readonly peers = this.peersResource.value;
  readonly loadingPeers = this.peersResource.isLoading;
  readonly peerDirection = signal<'up' | 'down'>('down');
  readonly peerShine = signal(false);
  private _shineTimer: ReturnType<typeof setTimeout> | null = null;

  getMergedSecondaryIconUrl(): string | null {
    const item = this.item();
    if (!item.mergedDisplayName) return null;
    const secondary = this.allBossItems().find((i) => i.mergedWithItemId === item.wowItemId);
    return secondary?.iconUrl ?? null;
  }

  /** Returns the tiers currently reserved (based on the floor encoded in receivedTier). */
  getReservedTiers(): AssignmentStatus[] {
    const tiers = [AssignmentStatus.CHAMPION_TIER, AssignmentStatus.HERO_TIER, AssignmentStatus.MYTH_TIER];
    const received = this.state.getReceivedItem(this.item().id);
    if (!received) return tiers;
    const idx = tiers.indexOf(received.tier);
    if (idx < 0) return tiers;
    return tiers.slice(idx + 1);
  }

  togglePeerTier(tier: AssignmentStatus, event: Event): void {
    event.stopPropagation();
    if (this.activePeerTier() === tier) {
      this.activePeerTier.set(null);
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.peerDirection.set(window.innerHeight - rect.bottom < 180 ? 'up' : 'down');
    this.activePeerTier.set(tier);
    // rxResource automatically loads peers when activePeerTier() is non-null
  }

  closePeers(): void {
    this.activePeerTier.set(null);
    this.peerShine.set(false);
  }

  triggerPeerShine(): void {
    if (this._shineTimer) clearTimeout(this._shineTimer);
    this.peerShine.set(false);
    setTimeout(() => {
      this.peerShine.set(true);
      this._shineTimer = setTimeout(() => this.peerShine.set(false), 700);
    }, 0);
  }

  /** Raiders eligible for the given tier: have a reservation + floor is below this tier. */
  peersEligibleFor(tier: AssignmentStatus): string[] {
    const tierIdx = TIER_ORDER[tier];
    return (this.peers() ?? [])
      .filter((p) => p.receivedTier === null || TIER_ORDER[p.receivedTier] < tierIdx)
      .map((p) => p.characterName)
      .sort((a, b) => a.localeCompare(b));
  }

  reservationPillLabel(): string {
    const itemId = this.item().id;
    const tiers = [AssignmentStatus.CHAMPION_TIER, AssignmentStatus.HERO_TIER, AssignmentStatus.MYTH_TIER];

    const received = this.state.getReceivedItem(itemId);
    if (received) {
      const idx = tiers.indexOf(received.tier);
      const higher = tiers.slice(idx + 1).map((t) => TIER_LABELS[t]);
      if (higher.length === 0) return TIER_LABELS[received.tier] + ' ontvangen';
      return `Gereserveerd voor ${higher.join(' & ')}`;
    }

    const assignment = this.state.getAssignmentStatus(itemId);
    if (assignment) {
      const idx = tiers.indexOf(assignment);
      const higher = tiers.slice(idx + 1).map((t) => TIER_LABELS[t]);
      if (higher.length === 0) return TIER_LABELS[assignment] + ' ontvangen';
      return `Gereserveerd voor ${higher.join(' & ')}`;
    }

    return `Gereserveerd voor ${tiers.map((t) => TIER_LABELS[t]).join(', ')}`;
  }
}
