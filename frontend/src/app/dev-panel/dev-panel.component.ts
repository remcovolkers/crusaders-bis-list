import { Component, inject, signal } from '@angular/core';
import { AdminService } from '@crusaders-bis-list/frontend-admin';

@Component({
  selector: 'app-dev-panel',
  templateUrl: './dev-panel.component.html',
  styleUrl: './dev-panel.component.scss',
})
export class DevPanelComponent {
  readonly syncing = signal(false);
  readonly resetting = signal(false);
  readonly wipingOrphaned = signal(false);
  readonly confirmWipeAll = signal(false);
  readonly success = signal('');
  readonly error = signal('');

  private readonly adminService = inject(AdminService);

  syncNow(): void {
    this.syncing.set(true);
    this.success.set('');
    this.error.set('');
    this.adminService.syncCatalog().subscribe({
      next: (res) => {
        this.syncing.set(false);
        this.success.set(res.message);
        setTimeout(() => this.success.set(''), 5000);
      },
      error: () => {
        this.syncing.set(false);
        this.error.set('Synchronisatie mislukt.');
      },
    });
  }

  resetAndSync(): void {
    if (
      !confirm(
        'Weet je zeker dat je de volledige catalogus wil wissen en opnieuw synchroniseren? Reserveringen blijven bewaard.',
      )
    )
      return;
    this.resetting.set(true);
    this.success.set('');
    this.error.set('');
    this.adminService.resetAndSyncCatalog().subscribe({
      next: (res) => {
        this.resetting.set(false);
        this.success.set(res.message);
        setTimeout(() => this.success.set(''), 5000);
      },
      error: () => {
        this.resetting.set(false);
        this.error.set('Reset & sync mislukt.');
      },
    });
  }

  wipeAllOrphaned(): void {
    this.confirmWipeAll.set(false);
    this.wipingOrphaned.set(true);
    this.error.set('');
    this.adminService.getAllReservations().subscribe({
      next: (raiders) => {
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const ids = raiders
          .filter((r) => UUID_RE.test(r.characterName))
          .flatMap((r) => r.reservations.map((res) => res.id));

        if (ids.length === 0) {
          this.wipingOrphaned.set(false);
          this.success.set('Geen wees-reservaties gevonden.');
          setTimeout(() => this.success.set(''), 3000);
          return;
        }

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
              }
            },
            error: () => {
              failed++;
              if (done + failed === ids.length) {
                this.wipingOrphaned.set(false);
                this.error.set(`${failed} reservatie(s) konden niet worden verwijderd.`);
              }
            },
          });
        }
      },
      error: () => {
        this.wipingOrphaned.set(false);
        this.error.set('Kon reserveringen niet ophalen.');
      },
    });
  }
}
