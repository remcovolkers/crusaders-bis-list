import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { AdminService, RaiderReservationSummary, RaiderUser } from '../../services/admin.service';
import { AuthStateService } from '@crusaders-bis-list/frontend-auth';
import { IUser, RaiderStatus, SUPER_USER_EMAIL, Team, UserRole, WowClass } from '@crusaders-bis-list/shared-domain';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';
import { AdminUserDetailModalComponent } from '../admin-user-detail-modal/admin-user-detail-modal.component';
import { classSlug, RaidRole, ROLE_META, roleOfSpec } from './spec-role';

export interface UserRow {
  user: IUser;
  name: string;
  /** Player (account) name, shown under the character. */
  player: string;
  realm: string | null;
  wowClass: string | null;
  spec: string | null;
  classSlug: string;
  role: RaidRole | null;
  status: string | null;
  team: Team;
  isAdmin: boolean;
  battletag: string | null;
  reserved: number;
  /** Total reservation slots of the team's season config (null when unknown). */
  slotLimit: number | null;
  superRare: string[];
}

export type TeamFilter = 'all' | Team;
export type RoleFilter = 'all' | RaidRole;
export type StatusFilter = 'all' | RaiderStatus;

const PAGE_SIZE = 20;

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
  private readonly crusadersSeasonConfigResource = rxResource({
    params: () => (this.showCrusadersColumn() ? Team.CRUSADERS : undefined),
    stream: ({ params: team }) => this.adminService.getSeasonConfig(team),
  });
  private readonly templarsSeasonConfigResource = rxResource({
    params: () => (this.showTemplarsColumn() ? Team.TEMPLARS : undefined),
    stream: ({ params: team }) => this.adminService.getSeasonConfig(team),
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

  // ── Roster table: filters, rows, pagination ───────────────

  readonly RaiderStatus = RaiderStatus;
  readonly roleMeta = ROLE_META;
  readonly roles: RaidRole[] = ['tank', 'healer', 'dps'];
  readonly classes = Object.values(WowClass).map((c) => ({ name: c as string, slug: classSlug(c) }));
  readonly statusLabels: Record<string, string> = {
    [RaiderStatus.ACTIVE]: 'Actief',
    [RaiderStatus.TRIAL]: 'Trial',
    [RaiderStatus.INACTIVE]: 'Inactief',
  };

  readonly search = signal('');
  readonly teamFilter = signal<TeamFilter>('all');
  readonly roleFilter = signal<RoleFilter>('all');
  readonly classFilter = signal<string | null>(null);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly page = signal(0);

  private slotLimitFor(team: Team): number | null {
    const res = team === Team.CRUSADERS ? this.crusadersSeasonConfigResource : this.templarsSeasonConfigResource;
    const cfg = res.hasValue() ? res.value() : undefined;
    return cfg ? cfg.trinketLimit + cfg.weaponLimit + cfg.jewelryLimit + cfg.armorLimit : null;
  }

  readonly rows = computed<UserRow[]>(() =>
    this.users()
      .map((user): UserRow => {
        const profile = this.profileByUserId().get(user.id);
        const summary = this.reservationsByUserId().get(user.id);
        const live = (summary?.reservations ?? []).filter((r) => !r.receivedOnly);
        const spec = summary?.spec ?? profile?.spec ?? null;
        const wowClass = summary?.wowClass ?? profile?.wowClass ?? null;
        return {
          user,
          name: profile?.characterName ?? summary?.characterName ?? user.displayName,
          player: user.displayName,
          realm: (profile as (RaiderUser & { realm?: string }) | undefined)?.realm ?? null,
          wowClass,
          spec,
          classSlug: classSlug(wowClass),
          role: roleOfSpec(spec),
          status: profile?.status ?? null,
          team: user.team,
          isAdmin: user.roles.includes(UserRole.ADMIN),
          battletag: user.battletag ?? null,
          reserved: live.length,
          slotLimit: this.slotLimitFor(user.team),
          superRare: live.filter((r) => r.isSuperRare).map((r) => r.itemName),
        };
      })
      .sort((a, b) => (a.team === b.team ? a.name.localeCompare(b.name) : a.team === Team.CRUSADERS ? -1 : 1)),
  );

  readonly filteredRows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const team = this.teamFilter();
    const role = this.roleFilter();
    const cls = this.classFilter();
    const status = this.statusFilter();
    return this.rows().filter(
      (r) =>
        (team === 'all' || r.team === team) &&
        (role === 'all' || r.role === role) &&
        (!cls || r.wowClass === cls) &&
        (status === 'all' || r.status === status) &&
        (!q ||
          [r.name, r.player, r.realm, r.battletag, r.user.email, r.wowClass, r.spec].some((v) =>
            v?.toLowerCase().includes(q),
          )),
    );
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredRows().length / PAGE_SIZE)));
  readonly currentPage = computed(() => Math.min(this.page(), this.pageCount() - 1));
  readonly pagedRows = computed(() => {
    const start = this.currentPage() * PAGE_SIZE;
    return this.filteredRows().slice(start, start + PAGE_SIZE);
  });
  readonly rangeStart = computed(() => (this.filteredRows().length === 0 ? 0 : this.currentPage() * PAGE_SIZE + 1));
  readonly rangeEnd = computed(() => this.currentPage() * PAGE_SIZE + this.pagedRows().length);
  readonly hasActiveFilters = computed(
    () =>
      !!this.search().trim() ||
      this.teamFilter() !== 'all' ||
      this.roleFilter() !== 'all' ||
      !!this.classFilter() ||
      this.statusFilter() !== 'all',
  );
  readonly teamCounts = computed(() => {
    const rows = this.rows();
    return {
      crusaders: rows.filter((r) => r.team === Team.CRUSADERS).length,
      templars: rows.filter((r) => r.team === Team.TEMPLARS).length,
      benchTrial: rows.filter((r) => r.status === RaiderStatus.TRIAL || r.status === RaiderStatus.INACTIVE).length,
    };
  });

  /** Slot limit of the currently selected user's team (for the drawer). */
  readonly selectedSlotLimit = computed(() => {
    const user = this.selectedUser();
    return user ? this.slotLimitFor(user.team) : null;
  });

  setSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
  }
  setTeamFilter(value: TeamFilter): void {
    this.teamFilter.set(value);
    this.page.set(0);
  }
  setRoleFilter(value: RoleFilter): void {
    this.roleFilter.set(value);
    this.page.set(0);
  }
  setStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.page.set(0);
  }
  toggleClassFilter(name: string): void {
    this.classFilter.set(this.classFilter() === name ? null : name);
    this.page.set(0);
  }
  resetFilters(): void {
    this.search.set('');
    this.teamFilter.set('all');
    this.roleFilter.set('all');
    this.classFilter.set(null);
    this.statusFilter.set('all');
    this.page.set(0);
  }
  goToPage(index: number): void {
    this.page.set(Math.max(0, Math.min(index, this.pageCount() - 1)));
  }

  /** Client-side CSV export of the currently filtered list (all pages). */
  exportCsv(): void {
    const head = [
      'Karakter',
      'Speler',
      'Klasse',
      'Spec',
      'Rol',
      'Team',
      'Status',
      'Battle.net',
      'Admin',
      'Reserveringen',
      'Super rare',
    ];
    const cell = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = this.filteredRows().map((r) =>
      [
        r.name,
        r.player,
        r.wowClass,
        r.spec,
        r.role ? ROLE_META[r.role].label : '',
        r.team === Team.CRUSADERS ? 'Crusaders' : 'Templars',
        r.status ? (this.statusLabels[r.status] ?? r.status) : '',
        r.battletag,
        r.isAdmin ? 'ja' : 'nee',
        r.reserved,
        r.superRare.join(', '),
      ]
        .map(cell)
        .join(';'),
    );
    const csv = '﻿' + [head.map(cell).join(';'), ...lines].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gebruikers.csv';
    a.click();
    URL.revokeObjectURL(url);
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
