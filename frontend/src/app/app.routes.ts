import { Route } from '@angular/router';
import { authRoutes, unauthorizedRoute, AuthGuard } from '@crusaders-bis-list/frontend-auth';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    children: authRoutes,
  },
  unauthorizedRoute,
  {
    path: 'loot',
    canActivate: [AuthGuard],
    loadChildren: () => import('@crusaders-bis-list/frontend-loot').then((m) => m.FrontendLootModule),
  },
  {
    path: 'admin',
    loadChildren: () => import('@crusaders-bis-list/frontend-admin').then((m) => m.FrontendAdminModule),
  },
  { path: '', redirectTo: 'loot', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' },
];
