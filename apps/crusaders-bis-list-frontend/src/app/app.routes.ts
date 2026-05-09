import { Route } from '@angular/router';
import {
  authRoutes,
  unauthorizedRoute,
  authGuard,
  profileGuard,
  superUserGuard,
  guestGuard,
  OnboardingComponent,
} from '@crusaders-bis-list/frontend-auth';
import { AdminFeedbackComponent, DevPanelComponent, RollSpectatorComponent } from '@crusaders-bis-list/frontend-admin';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: authRoutes,
  },
  unauthorizedRoute,
  {
    path: 'onboarding',
    canActivate: [authGuard],
    component: OnboardingComponent,
  },
  {
    path: 'roll/:sessionId',
    component: RollSpectatorComponent,
  },
  {
    path: 'loot',
    canActivate: [profileGuard],
    loadChildren: () => import('@crusaders-bis-list/frontend-loot').then((m) => m.FrontendLootModule),
  },
  {
    path: 'admin',
    canActivate: [profileGuard],
    loadChildren: () => import('@crusaders-bis-list/frontend-admin').then((m) => m.FrontendAdminModule),
  },
  {
    path: 'feedback-inbox',
    canActivate: [superUserGuard],
    component: AdminFeedbackComponent,
  },
  {
    path: 'raid-plan',
    canActivate: [superUserGuard],
    loadChildren: () => import('@crusaders-bis-list/frontend-raid-plan').then((m) => m.FrontendRaidPlanModule),
  },
  {
    path: 'dev-panel',
    canActivate: [superUserGuard],
    component: DevPanelComponent,
  },
  { path: '', redirectTo: 'loot', pathMatch: 'full' },
  { path: '**', redirectTo: 'loot' },
];
