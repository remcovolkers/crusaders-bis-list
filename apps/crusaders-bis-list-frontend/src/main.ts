import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { inject, provideAppInitializer, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { App } from './app/app';
import { appRoutes } from './app/app.routes';
import { API_URL, AuthInterceptor, AuthStateService, AuthService, AuthUser } from '@crusaders-bis-list/frontend-auth';
import { environment } from './environments/environment';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { provideServiceWorker } from '@angular/service-worker';

bootstrapApplication(App, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: API_URL, useValue: environment.apiUrl },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideAppInitializer(async () => {
      const authService = inject(AuthService);
      const authState = inject(AuthStateService);
      const http = inject(HttpClient);

      const tryRefresh = async (): Promise<boolean> => {
        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) return false;
        try {
          const result = await firstValueFrom(
            http.post<{ token: string }>(`${environment.apiUrl}/auth/refresh`, { refreshToken }),
          );
          authService.saveToken(result.token);
          // Fetch full user data (includes bnetLinked, displayName, etc.)
          const freshUser = await firstValueFrom(
            http.get<AuthUser>(`${environment.apiUrl}/auth/me`, {
              headers: { Authorization: `Bearer ${result.token}` },
            }),
          );
          const user = freshUser ?? authService.decodeToken(result.token);
          if (user) authState.loginSuccess(user, result.token);
          return !!user;
        } catch {
          authService.clearToken();
          authService.clearRefreshToken();
          return false;
        }
      };

      const token = authService.getToken();
      if (token) {
        try {
          const user = await firstValueFrom(
            http.get<AuthUser>(`${environment.apiUrl}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          );
          if (user) {
            authState.loginSuccess(user, token);
          } else {
            await tryRefresh();
          }
        } catch (err) {
          if (err instanceof HttpErrorResponse && err.status === 401) {
            // Access token expired — try refresh token
            await tryRefresh();
          } else {
            // Network error / server unreachable — fall back to decoded JWT
            const user = authService.decodeToken(token);
            if (user) {
              authState.loginSuccess(user, token);
            } else {
              authService.clearToken();
              authService.clearRefreshToken();
            }
          }
        }
      } else {
        // No access token — attempt silent re-login via refresh token
        await tryRefresh();
      }
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
}).catch((err) => console.error(err));
