import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AuthStateService } from '../../state/auth-state.service';
import { API_URL } from '../../tokens/api-url.token';
import { AuthUser } from '../../state/auth.state';

@Component({
  selector: 'lib-auth-callback',
  imports: [],
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss'],
})
export class AuthCallbackComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.authState.setError('No token received');
      this.router.navigate(['/login']);
      return;
    }

    const user = this.authService.decodeToken(token);
    if (!user) {
      this.authState.setError('Invalid token');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.saveToken(token);
    this.authState.loginSuccess(user, token);

    const rt = this.route.snapshot.queryParamMap.get('rt');
    if (rt) {
      this.authService.saveRefreshToken(rt);
    }

    this.http.get<AuthUser>(`${this.apiUrl}/auth/me`).subscribe({
      next: (freshUser) => {
        if (freshUser) this.authState.loginSuccess(freshUser, token);
      },
      error: () => {
        /* non-critical */
      },
    });

    this.http.get(`${this.apiUrl}/raider/my-profile`).subscribe({
      next: (profile) => {
        this.router.navigate([profile ? '/loot' : '/onboarding']);
      },
      error: () => {
        this.router.navigate(['/onboarding']);
      },
    });
  }
}
