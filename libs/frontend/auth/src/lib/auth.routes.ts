import { Route } from '@angular/router';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { LoginComponent } from './components/login/login.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';

export const authRoutes: Route[] = [
  { path: 'callback', component: AuthCallbackComponent },
  { path: '', component: LoginComponent },
];

export const unauthorizedRoute: Route = {
  path: 'unauthorized',
  component: UnauthorizedComponent,
};
