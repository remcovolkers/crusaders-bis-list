import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from '../services/auth.service';
import * as AuthActions from '../state/auth.actions';

@Component({
  selector: 'app-auth-callback',
  template: `<div class="callback-container"><p>Inloggen...</p></div>`,
  styles: [`.callback-container { display: flex; justify-content: center; align-items: center; height: 100vh; }`],
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private store: Store,
  ) {}

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
