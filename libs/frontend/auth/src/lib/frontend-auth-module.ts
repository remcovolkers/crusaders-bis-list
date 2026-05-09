import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { LoginComponent } from './components/login/login.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';

@NgModule({
  imports: [RouterModule, AuthCallbackComponent, LoginComponent, UnauthorizedComponent],
  exports: [AuthCallbackComponent, LoginComponent, UnauthorizedComponent],
})
export class FrontendAuthModule {}
