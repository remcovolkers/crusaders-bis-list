import { Component, computed, inject, input, output, signal } from '@angular/core';
import {
  AdminService,
  RaiderReservationEntry,
  RaiderReservationSummary,
  RaiderUser,
} from '../../services/admin.service';
import {
  IUser,
  UserRole,
  AssignmentStatus,
  RaiderStatus,
  SUPER_USER_EMAIL,
  Team,
} from '@crusaders-bis-list/shared-domain';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';
import { AuthStateService } from '@crusaders-bis-list/frontend-auth';
import { classSlug, ROLE_META, roleOfSpec } from '../admin-user-management/spec-role';

@Component({
  selector: 'lib-admin-user-detail-modal',
  host: { '(document:keydown.escape)': 'close()' },
  templateUrl: './admin-user-detail-modal.component.html',
  styleUrls: ['./admin-user-detail-modal.component.scss'],
})
export class AdminUserDetailModalComponent {
  // ── Inputs ──────────────────────────────────────────────
  readonly user = input.required<IUser>();
  readonly summary = input<RaiderReservationSummary | undefined>(undefined);
  readonly profile = input<RaiderUser | undefined>(undefined);
  /** Total reservation slots of the user's team (null when unknown). */
  readonly slotLimit = input<number | null>(null);

  // ── Outputs ─────────────────────────────────────────────
  /** Request to close the modal */
  readonly closed = output<void>();
  /** User object was mutated (roles / membership) — parent should update its list */
  readonly userChanged = output<IUser>();
  /** Raider profile was reset — parent should remove it from its maps */
  readonly profileReset = output<string>(); // userId
  /** User was deleted — parent should remove from list and close */
  readonly userDeleted = output<string>(); // userId
  /** A reservation was cancelled — parent should reload reservation data */
  readonly reservationCancelled = output<void>();

  // ── Internal confirm state ───────────────────────────────
  readonly confirmingEntry = signal<RaiderReservationEntry | null>(null);
  readonly confirmingResetRaiderId = signal<string | null>(null);
  readonly confirmingDeleteUserId = signal<string | null>(null);
  readonly confirmingUnlinkBnetUserId = signal<string | null>(null);

  readonly adminRole = UserRole.ADMIN;
  readonly superAdminRole = UserRole.SUPER_ADMIN;
  readonly RaiderStatus = RaiderStatus;
  readonly roleMeta = ROLE_META;
  readonly AssignmentStatus = AssignmentStatus;
  readonly Team = Team;

  private readonly authState = inject(AuthStateService);
  /** Only the hardcoded super user is allowed to move a raider between teams. */
  readonly canSwitchTeam = computed(() => this.authState.user()?.email === SUPER_USER_EMAIL);

  private readonly toast = inject(ToastService);
  private readonly adminService = inject(AdminService);

  close(): void {
    this.confirmingEntry.set(null);
    this.confirmingResetRaiderId.set(null);
    this.confirmingDeleteUserId.set(null);
    this.confirmingUnlinkBnetUserId.set(null);
    this.closed.emit();
  }

  // ── Derived view data ───────────────────────────────────
  readonly name = computed(
    () => this.summary()?.characterName ?? this.profile()?.characterName ?? this.user().displayName,
  );
  readonly wowClass = computed(() => this.summary()?.wowClass ?? this.profile()?.wowClass ?? null);
  readonly spec = computed(() => this.summary()?.spec ?? this.profile()?.spec ?? null);
  readonly classSlug = computed(() => classSlug(this.wowClass()));
  readonly role = computed(() => roleOfSpec(this.spec()));
  readonly status = computed(() => this.profile()?.status ?? null);
  readonly raiderId = computed(() => this.summary()?.raiderId ?? this.profile()?.id ?? null);
  /** Active reservations (a reservation may already be received in some tier). */
  readonly reserves = computed(() => (this.summary()?.reservations ?? []).filter((e) => !e.receivedOnly));
  /** Items that were received without a reservation (loot history). */
  readonly receivedItems = computed(() => (this.summary()?.reservations ?? []).filter((e) => e.receivedOnly));
  readonly superRareCount = computed(() => this.reserves().filter((e) => e.isSuperRare).length);
  readonly freeSlots = computed(() => {
    const limit = this.slotLimit();
    return limit === null ? 0 : Math.max(0, limit - this.reserves().length);
  });

  // ── Helpers ─────────────────────────────────────────────
  isBis(entry: RaiderReservationEntry): boolean {
    return entry.receivedTier === AssignmentStatus.MYTH_TIER || entry.assignment?.status === AssignmentStatus.MYTH_TIER;
  }

  getReservedTiers(entry: RaiderReservationEntry): AssignmentStatus[] {
    const tiers = [AssignmentStatus.CHAMPION_TIER, AssignmentStatus.HERO_TIER, AssignmentStatus.MYTH_TIER];
    if (!entry.receivedTier) return tiers;
    const idx = tiers.indexOf(entry.receivedTier);
    return idx < 0 ? tiers : tiers.slice(idx + 1);
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
        return 'badge-champion';
      case AssignmentStatus.HERO_TIER:
        return 'badge-hero';
      case AssignmentStatus.MYTH_TIER:
        return 'badge-myth';
      default:
        return '';
    }
  }

  // ── Reservation actions ─────────────────────────────────
  requestCancel(entry: RaiderReservationEntry): void {
    this.confirmingEntry.set(entry);
  }
  abortCancel(): void {
    this.confirmingEntry.set(null);
  }

  confirmCancel(): void {
    const entry = this.confirmingEntry();
    if (!entry) return;
    const raiderId = this.summary()?.raiderId ?? '';
    const action$ =
      entry.receivedOnly || entry.id === null
        ? this.adminService.deleteReceivedItem(raiderId, entry.itemId)
        : this.adminService.cancelReservation(entry.id);
    action$.subscribe({
      next: () => {
        this.toast.show('Reservering ingetrokken.');
        this.confirmingEntry.set(null);
        this.reservationCancelled.emit();
      },
      error: () => {
        this.toast.show('Intrekken mislukt.', 'error');
        this.confirmingEntry.set(null);
      },
    });
  }

  // ── Raider profile actions ───────────────────────────────
  requestReset(raiderId: string): void {
    this.confirmingResetRaiderId.set(raiderId);
  }
  abortReset(): void {
    this.confirmingResetRaiderId.set(null);
  }

  confirmReset(raiderId: string): void {
    const userId = this.user().id;
    this.adminService.resetRaiderProfile(raiderId).subscribe({
      next: () => {
        this.confirmingResetRaiderId.set(null);
        this.toast.show('Raider-profiel gereset.');
        this.profileReset.emit(userId);
      },
      error: () => {
        this.confirmingResetRaiderId.set(null);
        this.toast.show('Reset mislukt.', 'error');
      },
    });
  }

  // ── Account actions ──────────────────────────────────────
  makeAdmin(user: IUser): void {
    const roles = [...new Set([...user.roles, UserRole.ADMIN])];
    this.adminService.updateUserRoles(user.id, roles).subscribe({
      next: () => {
        this.toast.show(`${user.displayName} is nu admin.`);
        this.userChanged.emit({ ...user, roles });
      },
    });
  }

  removeAdmin(user: IUser): void {
    const roles = user.roles.filter((r) => r !== UserRole.ADMIN);
    this.adminService.updateUserRoles(user.id, roles).subscribe({
      next: () => {
        this.toast.show(`${user.displayName} is geen admin meer.`);
        this.userChanged.emit({ ...user, roles });
      },
    });
  }

  toggleAdmin(user: IUser): void {
    if (user.roles.includes(UserRole.ADMIN)) this.removeAdmin(user);
    else this.makeAdmin(user);
  }

  setTeam(user: IUser, team: Team): void {
    if (team === user.team) return;
    if (team === Team.CRUSADERS) this.makeCrusader(user);
    else this.makeTemplar(user);
  }

  makeCrusader(user: IUser): void {
    this.adminService.updateUserTeam(user.id, Team.CRUSADERS).subscribe({
      next: () => {
        this.toast.show(`${user.displayName} is nu Crusader.`);
        this.userChanged.emit({ ...user, team: Team.CRUSADERS });
      },
    });
  }

  makeTemplar(user: IUser): void {
    this.adminService.updateUserTeam(user.id, Team.TEMPLARS).subscribe({
      next: () => {
        this.toast.show(`${user.displayName} is nu Templar.`);
        this.userChanged.emit({ ...user, team: Team.TEMPLARS });
      },
    });
  }

  requestUnlinkBnet(userId: string): void {
    this.confirmingUnlinkBnetUserId.set(userId);
  }
  abortUnlinkBnet(): void {
    this.confirmingUnlinkBnetUserId.set(null);
  }

  confirmUnlinkBnet(user: IUser): void {
    this.adminService.unlinkBnet(user.id).subscribe({
      next: () => {
        this.toast.show('Battle.net ontkoppeld.');
        this.confirmingUnlinkBnetUserId.set(null);
        this.userChanged.emit({ ...user, battletag: null });
      },
      error: () => this.toast.show('Ontkoppelen mislukt.', 'error'),
    });
  }

  requestDeleteUser(userId: string): void {
    this.confirmingDeleteUserId.set(userId);
  }
  abortDeleteUser(): void {
    this.confirmingDeleteUserId.set(null);
  }

  confirmDeleteUser(userId: string): void {
    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.confirmingDeleteUserId.set(null);
        this.toast.show('Account verwijderd.');
        this.userDeleted.emit(userId);
      },
      error: () => {
        this.confirmingDeleteUserId.set(null);
        this.toast.show('Verwijderen mislukt.', 'error');
      },
    });
  }
}
