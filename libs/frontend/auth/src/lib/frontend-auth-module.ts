import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { authReducer } from './state/auth.reducer';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AuthCallbackComponent } from './components/auth-callback.component';
import { LoginComponent } from './components/login.component';
import { UnauthorizedComponent } from './components/unauthorized.component';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('auth', authReducer),
    RouterModule.forChild([
      { path: 'callback', component: AuthCallbackComponent },
      { path: '', component: LoginComponent },
    ]),
  ],
  declarations: [AuthCallbackComponent, LoginComponent, UnauthorizedComponent],
  exports: [AuthCallbackComponent, LoginComponent, UnauthorizedComponent],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
})
export class FrontendAuthModule {}

