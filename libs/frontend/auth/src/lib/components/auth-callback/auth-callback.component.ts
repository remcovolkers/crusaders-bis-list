import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { API_URL } from '../../tokens/api-url.token';
import { AuthUser } from '../../state/auth.state';
import * as AuthActions from '../../state/auth.actions';

@Component({
  selector: 'lib-auth-callback',
  imports: [],
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss'],
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly store = inject(Store);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.store.dispatch(AuthActions.loginFailure({ error: 'No token received' }));
      this.router.navigate(['/login']);
      return;
    }

    const user = this.authService.decodeToken(token);
    if (!user) {
      this.store.dispatch(AuthActions.loginFailure({ error: 'Invalid token' }));
      this.router.navigate(['/login']);
      return;
    }

    this.authService.saveToken(token);
    this.store.dispatch(AuthActions.loginSuccess({ user, token }));

    // Save refresh token if provided
    const rt = this.route.snapshot.queryParamMap.get('rt');
    if (rt) {
      this.authService.saveRefreshToken(rt);
    }

    // Fetch fresh user data (includes bnetLinked, latest roles, etc.) and update store
    this.http.get<AuthUser>(`${this.apiUrl}/auth/me`).subscribe({
      next: (freshUser) => {
        if (freshUser) this.store.dispatch(AuthActions.loginSuccess({ user: freshUser, token }));
      },
      error: () => {
        /* non-critical, store already has basic user data */
      },
    });

    // Check if user already has a raider profile; if not, send to onboarding
    this.http.get(`${this.apiUrl}/raider/my-profile`).subscribe({
      next: (profile) => {
        this.router.navigate([profile ? '/loot' : '/onboarding']);
      },
      error: () => {
        // Treat errors (e.g. 404 / null) as "no profile"
        this.router.navigate(['/onboarding']);
      },
    });
  }
}
