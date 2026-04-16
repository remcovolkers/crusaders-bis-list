import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AssignmentStatus,
  ITEM_CATEGORY_LABELS,
  TIER_LABELS,
  WEAPON_TYPE_LABELS,
  PRIMARY_STAT_LABELS,
  ItemCategory,
} from '@crusaders-bis-list/shared-domain';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectCurrentUser } from '@crusaders-bis-list/frontend-auth';
import { RaiderLootStateService } from '../../services/raider-loot-state.service';
import { ItemWithReservation } from '../../domain/loot-ui.types';
import { ReserveModalComponent } from '../reserve-modal/reserve-modal.component';

@Component({
  selector: 'lib-raider-loot-overview',
  imports: [NgClass, FormsModule, ReserveModalComponent],
  providers: [RaiderLootStateService],
  templateUrl: './raider-loot-overview.component.html',
  styleUrls: ['./raider-loot-overview.component.scss'],
})
export class RaiderLootOverviewComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly currentUser = toSignal(this.store.select(selectCurrentUser));
  readonly isCrusadersMember = computed(() => this.currentUser()?.isCrusadersMember ?? false);

  readonly state = inject(RaiderLootStateService);

  // UI-only modal state (not part of application state)
  readonly showReserveModal = signal(false);
  readonly pendingReserveItem = signal<ItemWithReservation | null>(null);

  // Domain constants for template binding
  readonly categoryLabels = ITEM_CATEGORY_LABELS;
  readonly tierLabels = TIER_LABELS;
  readonly weaponTypeLabels = WEAPON_TYPE_LABELS;
  readonly primaryStatLabels = PRIMARY_STAT_LABELS;
  readonly ItemCategory = ItemCategory;

  ngOnInit(): void {
    this.state.load();
  }

  // Reserve modal
  openReserveModal(item: ItemWithReservation): void {
    this.pendingReserveItem.set(item);
    this.showReserveModal.set(true);
  }

  onReserveConfirmed(tier: AssignmentStatus | null): void {
    const item = this.pendingReserveItem();
    if (!item) return;

    this.showReserveModal.set(false);
    this.pendingReserveItem.set(null);

    const doReserve = () => {
      this.state.reserve(item.id).subscribe({
        error: (e: unknown) => {
          const msg = (e as { error?: { message?: string } }).error?.message ?? 'Reservering mislukt';
          this.state.error.set(msg);
          setTimeout(() => this.state.error.set(''), 4000);
        },
      });
    };

    if (tier) {
      this.state.markItemReceived(item.id, tier).subscribe({ next: doReserve, error: doReserve });
    } else {
      doReserve();
    }
  }

  onReserveCancelled(): void {
    this.showReserveModal.set(false);
    this.pendingReserveItem.set(null);
  }

  // DOM helpers
  scrollToBoss(bossId: string): void {
    document.getElementById('boss-' + bossId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getBossColor(boss: { raidAccentColor?: string }): string {
    return boss.raidAccentColor ?? '#94a3b8';
  }
}
