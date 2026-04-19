import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AssignmentStatus } from '@crusaders-bis-list/shared-domain';
import { LootItemCardComponent } from '../loot-item-card/loot-item-card.component';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectCurrentUser, AuthService } from '@crusaders-bis-list/frontend-auth';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';
import { RaiderLootStateService } from '../../services/raider-loot-state.service';
import { ItemWithReservation } from '../../domain/loot-ui.types';
import { ReserveModalComponent } from '../reserve-modal/reserve-modal.component';

@Component({
  selector: 'lib-raider-loot-overview',
  imports: [FormsModule, ReserveModalComponent, LootItemCardComponent],
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
  readonly sidebarOpen = signal(false);

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

  scrollToBoss(bossId: string): void {
    document.getElementById('boss-' + bossId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getBossColor(boss: { raidAccentColor?: string }): string {
    return boss.raidAccentColor ?? '#94a3b8';
  }
}
