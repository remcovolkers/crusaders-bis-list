import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { AdminService, RaiderReservationSummary, RaiderUser } from '../../services/admin.service';
import { AuthStateService } from '@crusaders-bis-list/frontend-auth';
import { IUser, SUPER_USER_EMAIL, Team, UserRole } from '@crusaders-bis-list/shared-domain';
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
  private readonly authState = inject(AuthStateService);

  readonly Team = Team;
  readonly isSuperUser = computed(() => this.authState.user()?.email === SUPER_USER_EMAIL);
  readonly ownTeam = computed(() => this.authState.user()?.team ?? Team.CRUSADERS);

  /** A regular admin only ever sees their own team's column; the super user sees both, side by side. */
  readonly showCrusadersColumn = computed(() => this.isSuperUser() || this.ownTeam() === Team.CRUSADERS);
  readonly showTemplarsColumn = computed(() => this.isSuperUser() || this.ownTeam() === Team.TEMPLARS);

  private readonly crusadersUsersResource = rxResource({
    params: () => (this.showCrusadersColumn() ? Team.CRUSADERS : undefined),
    stream: ({ params: team }) => this.adminService.getAllUsers(team),
  });
  private readonly templarsUsersResource = rxResource({
    params: () => (this.showTemplarsColumn() ? Team.TEMPLARS : undefined),
    stream: ({ params: team }) => this.adminService.getAllUsers(team),
  });
  private readonly crusadersReservationsResource = rxResource({
    params: () => (this.showCrusadersColumn() ? Team.CRUSADERS : undefined),
    stream: ({ params: team }) => this.adminService.getAllReservations(team),
  });
  private readonly templarsReservationsResource = rxResource({
    params: () => (this.showTemplarsColumn() ? Team.TEMPLARS : undefined),
    stream: ({ params: team }) => this.adminService.getAllReservations(team),
  });
  private readonly crusadersRaidersResource = rxResource({
    params: () => (this.showCrusadersColumn() ? Team.CRUSADERS : undefined),
    stream: ({ params: team }) => this.adminService.getAllRaiders(team),
  });
  private readonly templarsRaidersResource = rxResource({
    params: () => (this.showTemplarsColumn() ? Team.TEMPLARS : undefined),
    stream: ({ params: team }) => this.adminService.getAllRaiders(team),
  });

  readonly crusadersUsers = computed(() => this.crusadersUsersResource.value() ?? []);
  readonly templarsUsers = computed(() => this.templarsUsersResource.value() ?? []);
  readonly users = computed(() => [...this.crusadersUsers(), ...this.templarsUsers()]);

  readonly reservationsByUserId = computed(() => {
    const map = new Map<string, RaiderReservationSummary>();
    for (const s of this.crusadersReservationsResource.value() ?? []) map.set(s.userId, s);
    for (const s of this.templarsReservationsResource.value() ?? []) map.set(s.userId, s);
    return map;
  });
  readonly profileByUserId = computed(() => {
    const map = new Map<string, RaiderUser>();
    for (const p of this.crusadersRaidersResource.value() ?? []) map.set(p.userId, p);
    for (const p of this.templarsRaidersResource.value() ?? []) map.set(p.userId, p);
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

  private usersResourceFor(team: Team) {
    return team === Team.CRUSADERS ? this.crusadersUsersResource : this.templarsUsersResource;
  }

  // ── Modal output handlers ────────────────────────────────

  onModalClosed(): void {
    this.expandedUserId.set(null);
  }

  onUserChanged(updated: IUser): void {
    // The super user may have switched the user's team — drop it from both columns, then re-add to the right one.
    this.crusadersUsersResource.update((list) => (list ?? []).filter((u) => u.id !== updated.id));
    this.templarsUsersResource.update((list) => (list ?? []).filter((u) => u.id !== updated.id));
    this.usersResourceFor(updated.team).update((list) => [...(list ?? []), updated]);
  }

  onProfileReset(userId: string): void {
    this.crusadersReservationsResource.update((list) => (list ?? []).filter((s) => s.userId !== userId));
    this.templarsReservationsResource.update((list) => (list ?? []).filter((s) => s.userId !== userId));
    this.crusadersRaidersResource.update((list) => (list ?? []).filter((p) => p.userId !== userId));
    this.templarsRaidersResource.update((list) => (list ?? []).filter((p) => p.userId !== userId));
  }

  onUserDeleted(userId: string): void {
    this.crusadersUsersResource.update((list) => (list ?? []).filter((u) => u.id !== userId));
    this.templarsUsersResource.update((list) => (list ?? []).filter((u) => u.id !== userId));
    this.crusadersReservationsResource.update((list) => (list ?? []).filter((s) => s.userId !== userId));
    this.templarsReservationsResource.update((list) => (list ?? []).filter((s) => s.userId !== userId));
    this.expandedUserId.set(null);
  }

  onReservationCancelled(): void {
    this.crusadersReservationsResource.reload();
    this.templarsReservationsResource.reload();
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
        this.crusadersReservationsResource.update(() => []);
        this.templarsReservationsResource.update(() => []);
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
