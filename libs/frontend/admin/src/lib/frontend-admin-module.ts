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
        canActivate: [AdminGuard],
        children: [
          { path: '', redirectTo: 'boss-view', pathMatch: 'full' },
          { path: 'boss-view', component: AdminBossViewComponent },
          { path: 'users', component: AdminUserManagementComponent },
          { path: 'reservations', component: AdminReservationManagementComponent },
          { path: 'season-config', component: AdminSeasonConfigComponent },
        ],
      },
    ]),
  ],
})
export class FrontendAdminModule {}
