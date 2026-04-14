import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from '../../services/auth.service';
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
    this.router.navigate(['/']);
  }
}