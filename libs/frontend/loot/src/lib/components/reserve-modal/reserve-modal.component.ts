import { Component, input, output } from '@angular/core';
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
  /** Previously recorded received item for this item, if any. */
  readonly receivedItem = input<IReceivedItem | null>(null);

  /** Emits the chosen tier when the raider clicked a tier button (tier + reserve).
   *  Emits null when "reserve only" is chosen. */
  readonly confirmed = output<AssignmentStatus | null>();
  readonly cancelled = output<void>();

  // Domain constants exposed to the template
  readonly receivableTiers = RECEIVABLE_TIERS;
  readonly tierLabels = TIER_LABELS;
}
