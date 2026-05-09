import { Injectable, computed, signal } from '@angular/core';
import { UserRole } from '@crusaders-bis-list/shared-domain';
import { AuthUser } from './auth.state';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  readonly user = signal<AuthUser | null>(null);
  readonly token = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly isAuthenticated = computed(() => !!this.user() && !!this.token());
  readonly isAdmin = computed(() => this.user()?.roles?.includes(UserRole.ADMIN) ?? false);
  readonly isSuperAdmin = computed(() => this.user()?.roles?.includes(UserRole.SUPER_ADMIN) ?? false);

  loginSuccess(user: AuthUser, token: string): void {
    this.user.set(user);
    this.token.set(token);
    this.loading.set(false);
    this.error.set(null);
  }

  logout(): void {
    this.user.set(null);
    this.token.set(null);
    this.loading.set(false);
    this.error.set(null);
  }

  setLoading(loading: boolean): void {
    this.loading.set(loading);
  }

  setError(error: string): void {
    this.error.set(error);
    this.loading.set(false);
  }
}
