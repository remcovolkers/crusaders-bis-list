import { Component, inject, OnInit, signal } from '@angular/core';
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
    return this.raiders().reduce((sum, r) => sum + r.reservations.length, 0);
  }
}
