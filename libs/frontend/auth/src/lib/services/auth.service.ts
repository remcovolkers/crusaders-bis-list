import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import { AuthUser } from '../state/auth.state';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'auth_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  redirectToGoogleLogin(): void {
    window.location.href = `${this.apiUrl}/auth/google`;
  }

  redirectToBnetLogin(): void {
    window.location.href = `${this.apiUrl}/auth/bnet`;
  }

  redirectToBnetLink(): void {
    const token = this.getToken();
    this.http
      .post<{ linkToken: string }>(
        `${this.apiUrl}/auth/bnet/link/init`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .subscribe((res) => {
        window.location.href = `${this.apiUrl}/auth/bnet/oauth-start?lt=${encodeURIComponent(res.linkToken)}`;
      });
  }

  getMe(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/auth/me`);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.storageKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.storageKey);
  }

  saveRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  clearRefreshToken(): void {
    localStorage.removeItem(this.refreshTokenKey);
  }

  refreshAccessToken(): Observable<{ token: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<{ token: string }>(`${this.apiUrl}/auth/refresh`, { refreshToken });
  }

  decodeToken(token: string): AuthUser | null {
    try {
      // Simple JWT payload decode (no verify — server already validated)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        email: payload.email,
        displayName: payload.displayName ?? payload.email,
        roles: payload.roles ?? [],
        isCrusadersMember: payload.isCrusadersMember ?? false,
      };
    } catch {
      return null;
    }
  }
}
