import { Component, computed, input, output, signal } from '@angular/core';
import { AssignmentStatus, IReceivedItem, RECEIVABLE_TIERS, TIER_LABELS } from '@crusaders-bis-list/shared-domain';
import { ItemWithReservation } from '../../domain/loot-ui.types';

@Component({
  selector: 'lib-reserve-modal',
  imports: [],
  templateUrl: './reserve-modal.component.html',
  styleUrls: ['./reserve-modal.component.scss'],
})
export class ReserveModalComponent {
  readonly item = input.required<ItemWithReservation>();
  readonly receivedItem = input<IReceivedItem | null>(null);

  readonly confirmed = output<AssignmentStatus | null>();
  readonly cancelled = output<void>();

  readonly receivableTiers = RECEIVABLE_TIERS;
  readonly tierLabels = TIER_LABELS;

  readonly selectedTier = signal<AssignmentStatus | null>(null);

  readonly confirmButtonLabel = computed(() => {
    const tier = this.selectedTier();
    if (!tier) return 'Reserveer';
    const idx = RECEIVABLE_TIERS.indexOf(tier);
    const higher = RECEIVABLE_TIERS.slice(idx + 1).map((t) => TIER_LABELS[t]);
    if (higher.length === 0) return `${TIER_LABELS[tier]} in bezit`;
    return `Reserveer (${higher.join(' / ')})`;
  });

  confirm(): void {
    this.confirmed.emit(this.selectedTier());
  }
}
