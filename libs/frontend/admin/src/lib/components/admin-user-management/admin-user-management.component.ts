import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
export class AdminUserManagementComponent implements OnInit {
  readonly users = signal<IUser[]>([]);
  readonly crusaders = computed(() => this.users().filter((u) => u.isCrusadersMember));
  readonly visitors = computed(() => this.users().filter((u) => !u.isCrusadersMember));
  readonly reservationsByUserId = signal<Map<string, RaiderReservationSummary>>(new Map());
  readonly profileByUserId = signal<Map<string, RaiderUser>>(new Map());
  readonly expandedUserId = signal<string | null>(null);
  readonly selectedUser = computed(() => this.users().find((u) => u.id === this.expandedUserId()) ?? null);
  readonly confirmingResetAll = signal(false);
  readonly resettingAll = signal(false);
  readonly resetReason = signal('');
  readonly adminRole = UserRole.ADMIN;

  private readonly toast = inject(ToastService);
  private readonly adminService = inject(AdminService);

  ngOnInit(): void {
    this.adminService.getAllUsers().subscribe((users) => this.users.set(users));
    this.adminService.getAllReservations().subscribe((summaries) => {
      const map = new Map<string, RaiderReservationSummary>();
      for (const s of summaries) map.set(s.userId, s);
      this.reservationsByUserId.set(map);
    });
    this.adminService.getAllRaiders().subscribe((profiles) => {
      const map = new Map<string, RaiderUser>();
      for (const p of profiles) map.set(p.userId, p);
      this.profileByUserId.set(map);
    });
  }

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
    this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
  }

  onProfileReset(userId: string): void {
    this.reservationsByUserId.update((map) => {
      const m = new Map(map);
      m.delete(userId);
      return m;
    });
    this.profileByUserId.update((map) => {
      const m = new Map(map);
      m.delete(userId);
      return m;
    });
  }

  onUserDeleted(userId: string): void {
    this.users.update((list) => list.filter((u) => u.id !== userId));
    this.reservationsByUserId.update((map) => {
      const m = new Map(map);
      m.delete(userId);
      return m;
    });
    this.expandedUserId.set(null);
  }

  onReservationCancelled(): void {
    this.adminService.getAllReservations().subscribe((summaries) => {
      const map = new Map<string, RaiderReservationSummary>();
      for (const s of summaries) map.set(s.userId, s);
      this.reservationsByUserId.set(map);
    });
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
        this.reservationsByUserId.set(new Map());
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
