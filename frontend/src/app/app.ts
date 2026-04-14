import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectIsAuthenticated, selectCurrentUser, selectIsAdmin, checkAuthToken, loginWithGoogle, logout } from '@crusaders-bis-list/frontend-auth';
import { AuthUser, AuthService } from '@crusaders-bis-list/frontend-auth';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  isAuthenticated$: Observable<boolean>;
  currentUser$: Observable<AuthUser | null>;
  isAdmin$: Observable<boolean>;

  constructor(
    private store: Store,
    private authService: AuthService,
  ) {
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
    this.currentUser$ = this.store.select(selectCurrentUser);
    this.isAdmin$ = this.store.select(selectIsAdmin);
  }

  ngOnInit(): void {
    // Restore session from localStorage on app start
    const token = this.authService.getToken();
    if (token) {
      const user = this.authService.decodeToken(token);
      if (user) {
        this.store.dispatch(checkAuthToken());
        this.store.dispatch({
          type: '[Auth] Login Success',
          user,
          token,
        } as any);
      }
    }
  }

  logout(): void {
    this.authService.clearToken();
    this.store.dispatch(logout());
  }
}

