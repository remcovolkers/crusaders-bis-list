import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { loginSuccess } from '../state/auth.actions';
import * as AuthActions from '../state/auth.actions';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          !req.url.includes('/auth/refresh') &&
          !req.url.includes('/auth/me') &&
          !req.headers.has('X-Retry')
        ) {
          return this.tryRefresh(req, next);
        }
        return throwError(() => error);
      }),
    );
  }

  private tryRefresh(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const refreshToken = this.authService.getRefreshToken();
    if (!refreshToken) {
      this.clearAndRedirect();
      return throwError(() => new Error('No refresh token'));
    }

    return this.authService.refreshAccessToken().pipe(
      switchMap(({ token }) => {
        this.authService.saveToken(token);
        const user = this.authService.decodeToken(token);
        if (user) this.store.dispatch(loginSuccess({ user, token }));
        const retried = req.clone({
          setHeaders: { Authorization: `Bearer ${token}`, 'X-Retry': 'true' },
        });
        return next.handle(retried);
      }),
      catchError(() => {
        this.clearAndRedirect();
        return throwError(() => new Error('Sessie verlopen'));
      }),
    );
  }

  private clearAndRedirect(): void {
    this.authService.clearToken();
    this.authService.clearRefreshToken();
    this.store.dispatch(AuthActions.logout());
    this.router.navigate(['/auth']);
  }
}
