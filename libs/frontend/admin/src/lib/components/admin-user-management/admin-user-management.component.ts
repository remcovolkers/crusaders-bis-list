import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { AdminService, RaiderReservationSummary, RaiderUser } from '../../services/admin.service';
import { IUser, UserRole } from '@crusaders-bis-list/shared-domain';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';
import { AdminUserDetailModalComponent } from '../admin-user-detail-modal/admin-user-detail-modal.component';

@Component({
  selector: 'lib-admin-user-management',
  imports: [FormsModule, AdminUserDetailModalComponent],
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.scss'],
})
export class AdminUserManagementComponent {
  private readonly toast = inject(ToastService);
  private readonly adminService = inject(AdminService);

  private readonly usersResource = rxResource({ stream: () => this.adminService.getAllUsers() });
  private readonly reservationsResource = rxResource({ stream: () => this.adminService.getAllReservations() });
  private readonly raidersResource = rxResource({ stream: () => this.adminService.getAllRaiders() });

  readonly users = computed(() => this.usersResource.value() ?? []);
  readonly crusaders = computed(() => this.users().filter((u) => u.isCrusadersMember));
  readonly visitors = computed(() => this.users().filter((u) => !u.isCrusadersMember));
  readonly reservationsByUserId = computed(() => {
    const map = new Map<string, RaiderReservationSummary>();
    for (const s of this.reservationsResource.value() ?? []) map.set(s.userId, s);
    return map;
  });
  readonly profileByUserId = computed(() => {
    const map = new Map<string, RaiderUser>();
    for (const p of this.raidersResource.value() ?? []) map.set(p.userId, p);
    return map;
  });
  readonly expandedUserId = signal<string | null>(null);
  readonly selectedUser = computed(() => this.users().find((u) => u.id === this.expandedUserId()) ?? null);
  readonly confirmingResetAll = signal(false);
  readonly resettingAll = signal(false);
  readonly resetReason = signal('');
  readonly adminRole = UserRole.ADMIN;

  private readonly UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  readonly orphanedReservationCount = computed(() => {
    let count = 0;
    for (const summary of this.reservationsByUserId().values()) {
      if (this.UUID_RE.test(summary.characterName)) count += summary.reservations.length;
    }
    return count;
  });

  toggleUser(userId: string): void {
    this.expandedUserId.set(this.expandedUserId() === userId ? null : userId);
  }

  reservationsFor(userId: string): RaiderReservationSummary | undefined {
    return this.reservationsByUserId().get(userId);
  }

  profileFor(userId: string): RaiderUser | undefined {
    return this.profileByUserId().get(userId);
  }

  // ── Modal output handlers ────────────────────────────────

  onModalClosed(): void {
    this.expandedUserId.set(null);
  }

  onUserChanged(updated: IUser): void {
    this.usersResource.update((list) => (list ?? []).map((u) => (u.id === updated.id ? updated : u)));
  }

  onProfileReset(userId: string): void {
    this.reservationsResource.update((list) => (list ?? []).filter((s) => s.userId !== userId));
    this.raidersResource.update((list) => (list ?? []).filter((p) => p.userId !== userId));
  }

  onUserDeleted(userId: string): void {
    this.usersResource.update((list) => (list ?? []).filter((u) => u.id !== userId));
    this.reservationsResource.update((list) => (list ?? []).filter((s) => s.userId !== userId));
    this.expandedUserId.set(null);
  }

  onReservationCancelled(): void {
    this.reservationsResource.reload();
  }

  requestResetAll(): void {
    this.confirmingResetAll.set(true);
    this.resetReason.set('');
  }

  abortResetAll(): void {
    this.confirmingResetAll.set(false);
  }

  confirmResetAll(): void {
    this.resettingAll.set(true);
    this.adminService.resetAllReservations(this.resetReason() || undefined).subscribe({
      next: () => {
        this.reservationsResource.update(() => []);
        this.confirmingResetAll.set(false);
        this.resettingAll.set(false);
        this.toast.show('Alle reserveringen zijn gereset. Gebruikers ontvangen een e-mail.');
      },
      error: () => {
        this.resettingAll.set(false);
        this.toast.show('Reset mislukt. Probeer opnieuw.', 'error');
      },
    });
  }
}
