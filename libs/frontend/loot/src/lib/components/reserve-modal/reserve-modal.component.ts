import { Component, computed, effect, input, output, signal } from '@angular/core';
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
  /**
   * When true, the modal opens in edit mode for an existing reservation.
   * The initial floor is derived from the item's current receivedTier marker.
   */
  readonly isEditing = input(false);
  /**
   * The current floor tier already stored on the item (receivedTier from state).
   * Used to pre-select the floor when editing.
   */
  readonly currentReceivedTier = input<AssignmentStatus | null>(null);

  readonly confirmed = output<AssignmentStatus | null>();
  readonly receivedAtMythTier = output<void>();
  readonly cancelled = output<void>();

  readonly receivableTiers = RECEIVABLE_TIERS;
  readonly tierLabels = TIER_LABELS;

  /** The lowest tier the user wants to reserve for. Higher tiers are auto-included. */
  readonly selectedFloor = signal<AssignmentStatus | null>(null);

  constructor() {
    // Pre-fill the floor when opening in edit mode
    effect(() => {
      if (this.isEditing()) {
        const crt = this.currentReceivedTier();
        if (crt) {
          // receivedTier is the floor marker: the reserved tiers are those ABOVE it.
          // So the selected floor = next tier after receivedTier.
          const idx = RECEIVABLE_TIERS.indexOf(crt);
          const nextFloor = idx >= 0 && idx + 1 < RECEIVABLE_TIERS.length ? RECEIVABLE_TIERS[idx + 1] : null;
          this.selectedFloor.set(nextFloor);
        } else {
          // No received marker → reserved for all → floor is Champion
          this.selectedFloor.set(RECEIVABLE_TIERS[0]);
        }
      } else {
        this.selectedFloor.set(null);
      }
    });
  }

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
    return this.isEditing() ? `Opslaan voor ${labels.join(' + ')}` : `Reserveer voor ${labels.join(' + ')}`;
  });

  confirm(): void {
    const floor = this.selectedFloor();
    if (!floor) return;
    const floorIdx = RECEIVABLE_TIERS.indexOf(floor);
    this.confirmed.emit(floorIdx === 0 ? null : RECEIVABLE_TIERS[floorIdx - 1]);
  }

  markReceivedAtMyth(): void {
    this.receivedAtMythTier.emit();
  }
}
