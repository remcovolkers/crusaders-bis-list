import { Injectable, inject, isDevMode } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly toastService = inject(ToastService);

  init(): void {
    if (isDevMode() || !this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => {
        this.toastService.show('Nieuwe versie beschikbaar — pagina wordt herladen...', 'info', 5000);
        setTimeout(() => {
          this.swUpdate.activateUpdate().then(() => document.location.reload());
        }, 5000);
      });
  }
}
