import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { authReducer } from './state/auth.reducer';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { LoginComponent } from './components/login/login.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';

@NgModule({
  imports: [
    RouterModule,
    StoreModule.forFeature('auth', authReducer),
    AuthCallbackComponent,
    LoginComponent,
    UnauthorizedComponent,
  ],
  exports: [AuthCallbackComponent, LoginComponent, UnauthorizedComponent],
})
export class FrontendAuthModule {}

