import { Component, inject, computed, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthStateService, AuthService } from '@crusaders-bis-list/frontend-auth';
import { ToastComponent, FeedbackButtonComponent } from '@crusaders-bis-list/frontend-shared-ui';
import { AppUpdateService } from './app-update.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FeedbackButtonComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authState = inject(AuthStateService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly appUpdateService = inject(AppUpdateService);

  constructor() {
    this.appUpdateService.init();
  }

  readonly isOldDomain = signal(this.document.location.hostname === 'crusaders-bis-list.onrender.com');

  readonly isAuthenticated = this.authState.isAuthenticated;
  readonly currentUser = this.authState.user;
  readonly isAdmin = this.authState.isAdmin;
  readonly isSuperUser = this.authState.isSuperAdmin;
  readonly isBnetLinked = computed(() => this.currentUser()?.bnetLinked ?? false);
  readonly menuOpen = signal(false);

  linkBnet(): void {
    this.authService.redirectToBnetLink();
  }

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  readonly showFeedbackButton = computed(() => {
    const url = this.currentUrl();
    return !url.startsWith('/dev-panel') && !url.startsWith('/feedback-inbox');
  });

  logout(): void {
    this.authService.clearToken();
    this.authService.clearRefreshToken();
    this.authState.logout();
    this.router.navigate(['/auth']);
  }
}
