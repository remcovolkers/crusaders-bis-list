import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminBossViewComponent } from './components/admin-boss-view/admin-boss-view.component';
import { AdminUserManagementComponent } from './components/admin-user-management/admin-user-management.component';
import { AdminSeasonConfigComponent } from './components/admin-season-config/admin-season-config.component';
import { AdminAuditLogComponent } from './components/admin-audit-log/admin-audit-log.component';
import { AdminShellComponent } from './components/admin-shell/admin-shell.component';
import { adminGuard } from '@crusaders-bis-list/frontend-auth';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        canActivate: [adminGuard],
        component: AdminShellComponent,
        children: [
          { path: '', redirectTo: 'boss-view', pathMatch: 'full' },
          { path: 'boss-view', component: AdminBossViewComponent },
          { path: 'users', component: AdminUserManagementComponent },
          { path: 'season-config', component: AdminSeasonConfigComponent },
          { path: 'audit-log', component: AdminAuditLogComponent },
          // Legacy redirect
          { path: 'admin-panel', redirectTo: 'season-config', pathMatch: 'full' },
        ],
      },
    ]),
  ],
})
export class FrontendAdminModule {}
