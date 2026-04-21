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

@Component({
  selector: 'lib-loot-item-card',
  imports: [NgClass],
  templateUrl: './loot-item-card.component.html',
  styleUrls: ['./loot-item-card.component.scss'],
})
export class LootItemCardComponent {
  protected readonly state = inject(RaiderLootStateService);

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
    // idx === 2 (Myth) → BiS, shown separately; idx < 0 → fallback to all
    if (idx < 0) return tiers;
    return tiers.slice(idx + 1);
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

    // No received tier exclusion → reserved for all tiers
    return `Gereserveerd voor ${tiers.map((t) => TIER_LABELS[t]).join(', ')}`;
  }
}
