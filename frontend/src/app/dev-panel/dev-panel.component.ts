import { Component, inject, signal } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { AdminService } from '@crusaders-bis-list/frontend-admin';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';

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

  private readonly toast = inject(ToastService);
  private readonly adminService = inject(AdminService);

  syncNow(): void {
    this.syncing.set(true);
    this.adminService.syncCatalog().subscribe({
      next: (res) => {
        this.syncing.set(false);
        this.toast.show(res.message);
      },
      error: () => {
        this.syncing.set(false);
        this.toast.show('Synchronisatie mislukt.', 'error');
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
    this.adminService.resetAndSyncCatalog().subscribe({
      next: (res) => {
        this.resetting.set(false);
        this.toast.show(res.message);
      },
      error: () => {
        this.resetting.set(false);
        this.toast.show('Reset & sync mislukt.', 'error');
      },
    });
  }

  wipeAllOrphaned(): void {
    this.confirmWipeAll.set(false);
    this.wipingOrphaned.set(true);
    this.adminService.getAllReservations().subscribe({
      next: (raiders) => {
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const ids = raiders
          .filter((r) => UUID_RE.test(r.characterName))
          .flatMap((r) => r.reservations.map((res) => res.id).filter((id): id is string => id !== null));

        if (ids.length === 0) {
          this.wipingOrphaned.set(false);
          this.toast.show('Geen wees-reservaties gevonden.', 'info');
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
                this.toast.show(`${done} wees-reservatie(s) verwijderd.`);
              }
            },
            error: () => {
              failed++;
              if (done + failed === ids.length) {
                this.wipingOrphaned.set(false);
                this.toast.show(`${failed} reservatie(s) konden niet worden verwijderd.`, 'error');
              }
            },
          });
        }
      },
      error: () => {
        this.wipingOrphaned.set(false);
        this.toast.show('Kon reserveringen niet ophalen.', 'error');
      },
    });
  }
}
