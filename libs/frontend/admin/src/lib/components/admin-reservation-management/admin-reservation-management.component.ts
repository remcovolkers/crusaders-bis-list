import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { AdminService, RaiderReservationEntry, RaiderReservationSummary } from '../../services/admin.service';
import { AssignmentStatus } from '@crusaders-bis-list/shared-domain';

@Component({
  selector: 'lib-admin-reservation-management',
  imports: [NgClass],
  templateUrl: './admin-reservation-management.component.html',
  styleUrls: ['./admin-reservation-management.component.scss'],
})
export class AdminReservationManagementComponent implements OnInit {
  readonly raiders = signal<RaiderReservationSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly success = signal('');
  readonly confirmingId = signal<string | null>(null);

  private readonly UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  readonly normalRaiders = computed(() => this.raiders().filter((r) => !this.UUID_RE.test(r.characterName)));
  readonly orphanedRaiders = computed(() => this.raiders().filter((r) => this.UUID_RE.test(r.characterName)));

  readonly AssignmentStatus = AssignmentStatus;

  private readonly adminService = inject(AdminService);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.getAllReservations().subscribe({
      next: (data) => {
        this.raiders.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Kon reserveringen niet laden.');
        this.loading.set(false);
      },
    });
  }

  isAcquired(entry: RaiderReservationEntry): boolean {
    const status = entry.assignment?.status;
    return (
      status === AssignmentStatus.CHAMPION_TIER ||
      status === AssignmentStatus.HERO_TIER ||
      status === AssignmentStatus.MYTH_TIER
    );
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

  readonly confirmWipeAll = signal(false);
  readonly wipingOrphaned = signal(false);

  wipeAllOrphaned(): void {
    const ids = this.orphanedRaiders().flatMap((r) => r.reservations.map((res) => res.id));
    if (ids.length === 0) return;
    this.confirmWipeAll.set(false);
    this.wipingOrphaned.set(true);
    this.error.set('');

    let done = 0;
    let failed = 0;
    for (const id of ids) {
      this.adminService.cancelReservation(id).subscribe({
        next: () => {
          done++;
          if (done + failed === ids.length) {
            this.wipingOrphaned.set(false);
            this.success.set(`${done} wees-reservatie(s) verwijderd.`);
            setTimeout(() => this.success.set(''), 4000);
            this.load();
          }
        },
        error: () => {
          failed++;
          if (done + failed === ids.length) {
            this.wipingOrphaned.set(false);
            this.error.set(`${failed} reservatie(s) konden niet worden verwijderd.`);
            this.load();
          }
        },
      });
    }
  }

  requestCancel(reservationId: string): void {
    this.confirmingId.set(reservationId);
  }

  confirmCancel(reservationId: string): void {
    this.error.set('');
    this.adminService.cancelReservation(reservationId).subscribe({
      next: () => {
        this.success.set('Reservering ingetrokken.');
        setTimeout(() => this.success.set(''), 3000);
        this.confirmingId.set(null);
        this.load();
      },
      error: () => {
        this.error.set('Intrekken mislukt.');
        this.confirmingId.set(null);
      },
    });
  }

  abortCancel(): void {
    this.confirmingId.set(null);
  }

  totalReservations(): number {
    return this.normalRaiders().reduce((sum, r) => sum + r.reservations.length, 0);
  }
}
