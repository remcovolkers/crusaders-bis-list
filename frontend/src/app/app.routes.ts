import { Route } from '@angular/router';
import {
  authRoutes,
  unauthorizedRoute,
  AuthGuard,
  ProfileGuard,
  OnboardingComponent,
} from '@crusaders-bis-list/frontend-auth';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    children: authRoutes,
  },
  unauthorizedRoute,
  {
    path: 'onboarding',
    canActivate: [AuthGuard],
    component: OnboardingComponent,
  },
  {
    path: 'loot',
    canActivate: [ProfileGuard],
    loadChildren: () => import('@crusaders-bis-list/frontend-loot').then((m) => m.FrontendLootModule),
  },
  {
    path: 'admin',
    canActivate: [ProfileGuard],
    loadChildren: () => import('@crusaders-bis-list/frontend-admin').then((m) => m.FrontendAdminModule),
  },
  { path: '', redirectTo: 'loot', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' },
];
