import { Component, inject, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectIsAdmin,
  logout,
  AuthService,
} from '@crusaders-bis-list/frontend-auth';
import { FeedbackButtonComponent } from './feedback-button/feedback-button.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FeedbackButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isAuthenticated = toSignal(this.store.select(selectIsAuthenticated), { initialValue: false });
  readonly currentUser = toSignal(this.store.select(selectCurrentUser), { initialValue: null });
  readonly isAdmin = toSignal(this.store.select(selectIsAdmin), { initialValue: false });
  readonly isSuperUser = computed(() => this.currentUser()?.email === 'remco.volkers1@gmail.com');

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
    this.store.dispatch(logout());
    this.router.navigate(['/auth']);
  }
}
