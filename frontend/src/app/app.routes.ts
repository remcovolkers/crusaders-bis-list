import { Route } from '@angular/router';
import {
  authRoutes,
  unauthorizedRoute,
  AuthGuard,
  ProfileGuard,
  SuperUserGuard,
  OnboardingComponent,
} from '@crusaders-bis-list/frontend-auth';
import { AdminFeedbackComponent } from './admin-feedback/admin-feedback.component';
import { DevPanelComponent } from './dev-panel/dev-panel.component';

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
  {
    path: 'feedback-inbox',
    canActivate: [SuperUserGuard],
    component: AdminFeedbackComponent,
  },
  {
    path: 'dev-panel',
    canActivate: [SuperUserGuard],
    component: DevPanelComponent,
  },
  { path: '', redirectTo: 'loot', pathMatch: 'full' },
  { path: '**', redirectTo: 'loot' },
];
