import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminBossViewComponent } from './components/admin-boss-view.component';
import { AdminUserManagementComponent } from './components/admin-user-management.component';
import { AdminGuard } from '@crusaders-bis-list/frontend-auth';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        canActivate: [AdminGuard],
        children: [
          { path: '', redirectTo: 'boss-view', pathMatch: 'full' },
          { path: 'boss-view', component: AdminBossViewComponent },
          { path: 'users', component: AdminUserManagementComponent },
        ],
      },
    ]),
  ],
  declarations: [AdminBossViewComponent, AdminUserManagementComponent],
  exports: [AdminBossViewComponent, AdminUserManagementComponent],
})
export class FrontendAdminModule {}

