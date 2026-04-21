import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  RaiderReservationEntry,
  RaiderReservationSummary,
  RaiderUser,
} from '../../services/admin.service';
import { IUser, UserRole, AssignmentStatus } from '@crusaders-bis-list/shared-domain';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';

@Component({
  selector: 'lib-admin-user-management',
  imports: [NgClass, FormsModule],
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
  readonly confirmingId = signal<string | null>(null);
  readonly confirmingResetRaiderId = signal<string | null>(null);
  readonly confirmingDeleteUserId = signal<string | null>(null);
  readonly confirmingUnlinkBnetUserId = signal<string | null>(null);
  readonly confirmingResetAll = signal(false);
  readonly resettingAll = signal(false);
  readonly resetReason = signal('');
  readonly adminRole = UserRole.ADMIN;
  readonly AssignmentStatus = AssignmentStatus;

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
    this.confirmingId.set(null);
    this.confirmingResetRaiderId.set(null);
    this.confirmingDeleteUserId.set(null);
  }

  closePanel(): void {
    this.expandedUserId.set(null);
    this.confirmingId.set(null);
    this.confirmingResetRaiderId.set(null);
    this.confirmingDeleteUserId.set(null);
    this.confirmingUnlinkBnetUserId.set(null);
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

  isBis(entry: RaiderReservationEntry): boolean {
    return entry.receivedTier === AssignmentStatus.MYTH_TIER;
  }

  getReservedTiers(entry: RaiderReservationEntry): AssignmentStatus[] {
    const tiers = [AssignmentStatus.CHAMPION_TIER, AssignmentStatus.HERO_TIER, AssignmentStatus.MYTH_TIER];
    if (!entry.receivedTier) return tiers;
    const idx = tiers.indexOf(entry.receivedTier);
    if (idx < 0) return tiers;
    return tiers.slice(idx + 1);
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
        this.toast.show('Reservering ingetrokken.');
        this.confirmingId.set(null);
        // Reload reservations
        this.adminService.getAllReservations().subscribe((summaries) => {
          const map = new Map<string, RaiderReservationSummary>();
          for (const s of summaries) map.set(s.userId, s);
          this.reservationsByUserId.set(map);
        });
      },
      error: () => {
        this.toast.show('Intrekken mislukt.', 'error');
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
        this.toast.show('Raider-profiel gereset.');
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
        this.toast.show('Reset mislukt.', 'error');
      },
    });
  }

  abortReset(): void {
    this.confirmingResetRaiderId.set(null);
  }

  requestDeleteUser(userId: string): void {
    this.confirmingDeleteUserId.set(userId);
  }

  requestUnlinkBnet(userId: string): void {
    this.confirmingUnlinkBnetUserId.set(userId);
  }

  confirmUnlinkBnet(userId: string): void {
    this.adminService.unlinkBnet(userId).subscribe({
      next: () => {
        this.users.update((list) => list.map((u) => (u.id === userId ? { ...u, battletag: null } : u)));
        this.confirmingUnlinkBnetUserId.set(null);
        this.toast.show('Battle.net ontkoppeld.');
      },
      error: () => this.toast.show('Ontkoppelen mislukt.', 'error'),
    });
  }

  abortUnlinkBnet(): void {
    this.confirmingUnlinkBnetUserId.set(null);
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
        this.toast.show('Account verwijderd.');
      },
      error: () => {
        this.confirmingDeleteUserId.set(null);
        this.toast.show('Verwijderen mislukt.', 'error');
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
        this.toast.show(`${user.displayName} is nu admin.`);
      },
    });
  }

  removeAdmin(user: IUser): void {
    const roles = user.roles.filter((r) => r !== UserRole.ADMIN);
    this.adminService.updateUserRoles(user.id, roles).subscribe({
      next: () => {
        this.users.update((list) => list.map((u) => (u.id === user.id ? { ...u, roles } : u)));
        this.toast.show(`${user.displayName} is geen admin meer.`);
      },
    });
  }

  makeCrusader(user: IUser): void {
    this.adminService.updateUserMembership(user.id, true).subscribe({
      next: () => {
        this.users.update((list) => list.map((u) => (u.id === user.id ? { ...u, isCrusadersMember: true } : u)));
        this.toast.show(`${user.displayName} is nu Crusader.`);
      },
    });
  }

  kickFromCrusaders(user: IUser): void {
    this.adminService.updateUserMembership(user.id, false).subscribe({
      next: () => {
        this.users.update((list) => list.map((u) => (u.id === user.id ? { ...u, isCrusadersMember: false } : u)));
        this.toast.show(`${user.displayName} is geen Crusader meer.`);
      },
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
