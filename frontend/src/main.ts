import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { Store } from '@ngrx/store';
import { App } from './app/app';
import { appRoutes } from './app/app.routes';
import { API_URL, AuthInterceptor, authReducer, AuthService, loginSuccess } from '@crusaders-bis-list/frontend-auth';
import { environment } from './environments/environment';

bootstrapApplication(App, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    provideStore({ auth: authReducer }),
    provideEffects([]),
    { provide: API_URL, useValue: environment.apiUrl },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      const store = inject(Store);
      const token = authService.getToken();
      if (token) {
        const user = authService.decodeToken(token);
        if (user) {
          store.dispatch(loginSuccess({ user, token }));
        } else {
          authService.clearToken();
        }
      }
    }),
  ],
}).catch((err) => console.error(err));
