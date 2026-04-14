import { Component, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { AdminService, RaiderReservationEntry, RaiderReservationSummary } from '../../services/admin.service';
import { IUser, UserRole, AssignmentStatus } from '@crusaders-bis-list/shared-domain';

@Component({
  selector: 'lib-admin-user-management',
  imports: [NgClass],
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.scss'],
})
export class AdminUserManagementComponent implements OnInit {
  readonly users = signal<IUser[]>([]);
  readonly reservationsByUserId = signal<Map<string, RaiderReservationSummary>>(new Map());
  readonly expandedUserId = signal<string | null>(null);
  readonly confirmingId = signal<string | null>(null);
  readonly message = signal('');
  readonly adminRole = UserRole.ADMIN;
  readonly AssignmentStatus = AssignmentStatus;

  private readonly adminService = inject(AdminService);

  ngOnInit(): void {
    this.adminService.getAllUsers().subscribe((users) => this.users.set(users));
    this.adminService.getAllReservations().subscribe((summaries) => {
      const map = new Map<string, RaiderReservationSummary>();
      for (const s of summaries) map.set(s.userId, s);
      this.reservationsByUserId.set(map);
    });
  }

  toggleUser(userId: string): void {
    this.expandedUserId.set(this.expandedUserId() === userId ? null : userId);
    this.confirmingId.set(null);
  }

  reservationsFor(userId: string): RaiderReservationSummary | undefined {
    return this.reservationsByUserId().get(userId);
  }

  isAcquired(entry: RaiderReservationEntry): boolean {
    const s = entry.assignment?.status;
    return s === AssignmentStatus.CHAMPION_TIER || s === AssignmentStatus.HERO_TIER || s === AssignmentStatus.MYTH_TIER;
  }

  tierLabel(status: AssignmentStatus | undefined): string {
    switch (status) {
      case AssignmentStatus.CHAMPION_TIER:
        return 'Champion';
      case AssignmentStatus.HERO_TIER:
        return 'Hero';
      case AssignmentStatus.MYTH_TIER:
        return 'Myth';
      case AssignmentStatus.NIET_MEER_NODIG:
        return 'Niet meer nodig';
      default:
        return '';
    }
  }

  tierClass(status: AssignmentStatus | undefined): string {
    switch (status) {
      case AssignmentStatus.CHAMPION_TIER:
        return 'tier-champion';
      case AssignmentStatus.HERO_TIER:
        return 'tier-hero';
      case AssignmentStatus.MYTH_TIER:
        return 'tier-myth';
      case AssignmentStatus.NIET_MEER_NODIG:
        return 'tier-no-need';
      default:
        return '';
    }
  }

  requestCancel(reservationId: string): void {
    this.confirmingId.set(reservationId);
  }

  confirmCancel(reservationId: string): void {
    this.adminService.cancelReservation(reservationId).subscribe({
      next: () => {
        this.message.set('Reservering ingetrokken.');
        setTimeout(() => this.message.set(''), 3000);
        this.confirmingId.set(null);
        // Reload reservations
        this.adminService.getAllReservations().subscribe((summaries) => {
          const map = new Map<string, RaiderReservationSummary>();
          for (const s of summaries) map.set(s.userId, s);
          this.reservationsByUserId.set(map);
        });
      },
      error: () => {
        this.message.set('Intrekken mislukt.');
        this.confirmingId.set(null);
      },
    });
  }

  abortCancel(): void {
    this.confirmingId.set(null);
  }

  makeAdmin(user: IUser): void {
    const roles = [...new Set([...user.roles, UserRole.ADMIN])];
    this.adminService.updateUserRoles(user.id, roles).subscribe({
      next: () => {
        this.users.update((list) => list.map((u) => (u.id === user.id ? { ...u, roles } : u)));
        this.message.set(`${user.displayName} is nu admin.`);
        setTimeout(() => this.message.set(''), 3000);
      },
    });
  }

  removeAdmin(user: IUser): void {
    const roles = user.roles.filter((r) => r !== UserRole.ADMIN);
    this.adminService.updateUserRoles(user.id, roles).subscribe({
      next: () => {
        this.users.update((list) => list.map((u) => (u.id === user.id ? { ...u, roles } : u)));
        this.message.set(`${user.displayName} is geen admin meer.`);
        setTimeout(() => this.message.set(''), 3000);
      },
    });
  }
}
