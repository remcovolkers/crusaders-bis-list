import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminBossViewComponent } from './components/admin-boss-view/admin-boss-view.component';
import { AdminUserManagementComponent } from './components/admin-user-management/admin-user-management.component';
import { AdminSeasonConfigComponent } from './components/admin-season-config/admin-season-config.component';
import { AdminReservationManagementComponent } from './components/admin-reservation-management/admin-reservation-management.component';
import { AdminGuard } from '@crusaders-bis-list/frontend-auth';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        children: [
          { path: '', redirectTo: 'boss-view', pathMatch: 'full' },
          { path: 'boss-view', canActivate: [AdminGuard], component: AdminBossViewComponent },
          { path: 'users', canActivate: [AdminGuard], component: AdminUserManagementComponent },
          { path: 'reservations', canActivate: [AdminGuard], component: AdminReservationManagementComponent },
          { path: 'admin-panel', canActivate: [AdminGuard], component: AdminSeasonConfigComponent },
        ],
      },
    ]),
  ],
})
export class FrontendAdminModule {}
