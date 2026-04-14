import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    loadChildren: () =>
      import('@crusaders-bis-list/frontend-auth').then((m) => m.FrontendAuthModule),
  },
  {
    path: 'login',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: 'unauthorized',
    loadChildren: () =>
      import('@crusaders-bis-list/frontend-auth').then((m) => m.FrontendAuthModule),
  },
  {
    path: 'loot',
    loadChildren: () =>
      import('@crusaders-bis-list/frontend-loot').then((m) => m.FrontendLootModule),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('@crusaders-bis-list/frontend-admin').then((m) => m.FrontendAdminModule),
  },
  { path: '', redirectTo: 'loot', pathMatch: 'full' },
  { path: '**', redirectTo: 'loot' },
];

