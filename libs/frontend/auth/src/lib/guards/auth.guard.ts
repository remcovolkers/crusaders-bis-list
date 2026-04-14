import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, map, take } from 'rxjs';
import { selectIsAuthenticated, selectIsAdmin } from '../state/auth.selectors';

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
