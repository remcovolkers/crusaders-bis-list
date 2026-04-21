import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { Store } from '@ngrx/store';
import { App } from './app/app';
import { appRoutes } from './app/app.routes';
import {
  API_URL,
  AuthInterceptor,
  authReducer,
  AuthService,
  AuthUser,
  loginSuccess,
} from '@crusaders-bis-list/frontend-auth';
import { environment } from './environments/environment';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

bootstrapApplication(App, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    provideStore({ auth: authReducer }),
    provideEffects([]),
    { provide: API_URL, useValue: environment.apiUrl },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideAppInitializer(async () => {
      const authService = inject(AuthService);
      const store = inject(Store);
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
          if (user) store.dispatch(loginSuccess({ user, token: result.token }));
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
            store.dispatch(loginSuccess({ user, token }));
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
              store.dispatch(loginSuccess({ user, token }));
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
  ],
}).catch((err) => console.error(err));
