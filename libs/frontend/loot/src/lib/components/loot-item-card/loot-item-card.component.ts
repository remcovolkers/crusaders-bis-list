import { Component, inject, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  AssignmentStatus,
  IItem,
  ITEM_CATEGORY_LABELS,
  ItemCategory,
  PRIMARY_STAT_LABELS,
  TIER_LABELS,
  WEAPON_TYPE_LABELS,
} from '@crusaders-bis-list/shared-domain';
import { RaiderLootStateService } from '../../services/raider-loot-state.service';
import { ItemWithReservation } from '../../domain/loot-ui.types';
import { LootService } from '../../services/loot.service';

const TIER_ORDER: Record<AssignmentStatus, number> = {
  [AssignmentStatus.CHAMPION_TIER]: 0,
  [AssignmentStatus.HERO_TIER]: 1,
  [AssignmentStatus.MYTH_TIER]: 2,
};

@Component({
  selector: 'lib-loot-item-card',
  imports: [NgClass],
  templateUrl: './loot-item-card.component.html',
  styleUrls: ['./loot-item-card.component.scss'],
})
export class LootItemCardComponent {
  protected readonly state = inject(RaiderLootStateService);
  private readonly lootService = inject(LootService);

  readonly item = input.required<ItemWithReservation>();
  readonly allBossItems = input.required<IItem[]>();
  readonly isCrusadersMember = input.required<boolean>();
  readonly reserveClicked = output<void>();
  readonly editReservationClicked = output<void>();

  readonly categoryLabels = ITEM_CATEGORY_LABELS;
  readonly weaponTypeLabels = WEAPON_TYPE_LABELS;
  readonly primaryStatLabels = PRIMARY_STAT_LABELS;
  readonly tierLabels = TIER_LABELS;
  readonly ItemCategory = ItemCategory;
  readonly AssignmentStatus = AssignmentStatus;

  readonly infoModal = signal<'res' | 'lim' | null>(null);

  // Peers popover
  readonly activePeerTier = signal<AssignmentStatus | null>(null);
  readonly peers = signal<{ characterName: string; receivedTier: AssignmentStatus | null }[]>([]);
  readonly loadingPeers = signal(false);
  readonly peersLoaded = signal(false);
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
    if (this.peersLoaded()) return;
    this.loadingPeers.set(true);
    this.lootService.getItemPeers(this.item().id).subscribe({
      next: (data) => {
        this.peers.set(data);
        this.peersLoaded.set(true);
        this.loadingPeers.set(false);
      },
      error: () => {
        this.peers.set([]);
        this.peersLoaded.set(true);
        this.loadingPeers.set(false);
      },
    });
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
    return this.peers()
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
