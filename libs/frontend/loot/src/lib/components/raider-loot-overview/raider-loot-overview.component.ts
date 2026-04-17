import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
import { selectCurrentUser, AuthService } from '@crusaders-bis-list/frontend-auth';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';
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
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly isBnetLinked = computed(() => this.currentUser()?.bnetLinked ?? false);

  linkBnet(): void {
    this.authService.redirectToBnetLink();
  }
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
    if (this.route.snapshot.queryParamMap.get('bnet_linked')) {
      this.toast.show('Battle.net account gekoppeld! ⚔️');
    }
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
          this.toast.show(msg, 'error');
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
  reservationPillLabel(itemId: string): string {
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

    return 'Gereserveerd';
  }

  scrollToBoss(bossId: string): void {
    document.getElementById('boss-' + bossId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getBossColor(boss: { raidAccentColor?: string }): string {
    return boss.raidAccentColor ?? '#94a3b8';
  }
}
