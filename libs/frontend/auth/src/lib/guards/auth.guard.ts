import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, map, take, switchMap, of, catchError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { selectIsAuthenticated, selectIsAdmin } from '../state/auth.selectors';
import { API_URL } from '../tokens/api-url.token';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.store.select(selectIsAuthenticated).pipe(
      take(1),
      map((authenticated) => {
        if (!authenticated) {
          this.router.navigate(['/auth']);
          return false;
        }
        return true;
      }),
    );
  }
}

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.store.select(selectIsAdmin).pipe(
      take(1),
      map((isAdmin) => {
        if (!isAdmin) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        return true;
      }),
    );
  }
}

@Injectable({ providedIn: 'root' })
export class ProfileGuard implements CanActivate {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  canActivate(): Observable<boolean> {
    return this.store.select(selectIsAuthenticated).pipe(
      take(1),
      switchMap((authenticated) => {
        if (!authenticated) {
          this.router.navigate(['/auth']);
          return of(false);
        }
        return this.http.get(`${this.apiUrl}/raider/my-profile`).pipe(
          map((profile) => {
            if (!profile) {
              this.router.navigate(['/onboarding']);
              return false;
            }
            return true;
          }),
          catchError(() => {
            this.router.navigate(['/onboarding']);
            return of(false);
          }),
        );
      }),
    );
  }
}
