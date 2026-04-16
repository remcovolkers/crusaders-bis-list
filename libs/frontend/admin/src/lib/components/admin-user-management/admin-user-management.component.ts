import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  AdminService,
  RaiderReservationEntry,
  RaiderReservationSummary,
  RaiderUser,
} from '../../services/admin.service';
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
  readonly profileByUserId = signal<Map<string, RaiderUser>>(new Map());
  readonly expandedUserId = signal<string | null>(null);
  readonly selectedUser = computed(() => this.users().find((u) => u.id === this.expandedUserId()) ?? null);
  readonly confirmingId = signal<string | null>(null);
  readonly confirmingResetRaiderId = signal<string | null>(null);
  readonly confirmingDeleteUserId = signal<string | null>(null);
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
    this.adminService.getAllRaiders().subscribe((profiles) => {
      const map = new Map<string, RaiderUser>();
      for (const p of profiles) map.set(p.userId, p);
      this.profileByUserId.set(map);
    });
  }

  toggleUser(userId: string): void {
    this.expandedUserId.set(this.expandedUserId() === userId ? null : userId);
    this.confirmingId.set(null);
    this.confirmingResetRaiderId.set(null);
    this.confirmingDeleteUserId.set(null);
  }

  closePanel(): void {
    this.expandedUserId.set(null);
    this.confirmingId.set(null);
    this.confirmingResetRaiderId.set(null);
    this.confirmingDeleteUserId.set(null);
  }

  reservationsFor(userId: string): RaiderReservationSummary | undefined {
    return this.reservationsByUserId().get(userId);
  }

  profileFor(userId: string): RaiderUser | undefined {
    return this.profileByUserId().get(userId);
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

  requestReset(raiderId: string): void {
    this.confirmingResetRaiderId.set(raiderId);
  }

  confirmReset(raiderId: string, userId: string): void {
    this.adminService.resetRaiderProfile(raiderId).subscribe({
      next: () => {
        this.confirmingResetRaiderId.set(null);
        this.message.set('Raider-profiel gereset.');
        setTimeout(() => this.message.set(''), 3000);
        this.reservationsByUserId.update((map) => {
          const updated = new Map(map);
          updated.delete(userId);
          return updated;
        });
        this.profileByUserId.update((map) => {
          const updated = new Map(map);
          updated.delete(userId);
          return updated;
        });
      },
      error: () => {
        this.confirmingResetRaiderId.set(null);
        this.message.set('Reset mislukt.');
        setTimeout(() => this.message.set(''), 3000);
      },
    });
  }

  abortReset(): void {
    this.confirmingResetRaiderId.set(null);
  }

  requestDeleteUser(userId: string): void {
    this.confirmingDeleteUserId.set(userId);
  }

  confirmDeleteUser(userId: string): void {
    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.confirmingDeleteUserId.set(null);
        this.users.update((list) => list.filter((u) => u.id !== userId));
        this.reservationsByUserId.update((map) => {
          const updated = new Map(map);
          updated.delete(userId);
          return updated;
        });
        this.expandedUserId.set(null);
        this.message.set('Account verwijderd.');
        setTimeout(() => this.message.set(''), 3000);
      },
      error: () => {
        this.confirmingDeleteUserId.set(null);
        this.message.set('Verwijderen mislukt.');
        setTimeout(() => this.message.set(''), 3000);
      },
    });
  }

  abortDeleteUser(): void {
    this.confirmingDeleteUserId.set(null);
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
