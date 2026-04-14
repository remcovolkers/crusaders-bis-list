import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectIsAdmin,
  logout,
  AuthUser,
  AuthService,
} from '@crusaders-bis-list/frontend-auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isAuthenticated$: Observable<boolean> = this.store.select(selectIsAuthenticated);
  readonly currentUser$: Observable<AuthUser | null> = this.store.select(selectCurrentUser);
  readonly isAdmin$: Observable<boolean> = this.store.select(selectIsAdmin);

  logout(): void {
    this.authService.clearToken();
    this.store.dispatch(logout());
    this.router.navigate(['/auth']);
  }
}
