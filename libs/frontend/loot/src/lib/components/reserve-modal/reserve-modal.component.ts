import { Component, computed, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { AssignmentStatus, RECEIVABLE_TIERS, TIER_LABELS } from '@crusaders-bis-list/shared-domain';
import { ItemWithReservation } from '../../domain/loot-ui.types';

@Component({
  selector: 'lib-reserve-modal',
  imports: [NgClass],
  templateUrl: './reserve-modal.component.html',
  styleUrls: ['./reserve-modal.component.scss'],
})
export class ReserveModalComponent {
  readonly item = input.required<ItemWithReservation>();

  readonly confirmed = output<AssignmentStatus | null>();
  readonly cancelled = output<void>();

  readonly receivableTiers = RECEIVABLE_TIERS;
  readonly tierLabels = TIER_LABELS;

  /** The lowest tier the user wants to reserve for. Higher tiers are auto-included. */
  readonly selectedFloor = signal<AssignmentStatus | null>(null);

  /** True if the given tier is included in the reservation (at or above the selected floor). */
  isTierIncluded(tier: AssignmentStatus): boolean {
    const floor = this.selectedFloor();
    if (!floor) return false;
    return RECEIVABLE_TIERS.indexOf(tier) >= RECEIVABLE_TIERS.indexOf(floor);
  }

  readonly confirmButtonLabel = computed(() => {
    const floor = this.selectedFloor();
    if (!floor) return 'Kies een tier';
    const labels = RECEIVABLE_TIERS.slice(RECEIVABLE_TIERS.indexOf(floor)).map((t) => TIER_LABELS[t]);
    return `Reserveer voor ${labels.join(' + ')}`;
  });

  confirm(): void {
    const floor = this.selectedFloor();
    if (!floor) return;
    // Map floor to the existing "already received at tier below floor" mechanism:
    //   Champion (idx 0) → null    (reserve all, no exclusion)
    //   Hero     (idx 1) → CHAMPION_TIER (exclude Champion, reserve Hero + Myth)
    //   Myth     (idx 2) → HERO_TIER     (exclude Champion + Hero, reserve Myth only)
    const floorIdx = RECEIVABLE_TIERS.indexOf(floor);
    this.confirmed.emit(floorIdx === 0 ? null : RECEIVABLE_TIERS[floorIdx - 1]);
  }
}
