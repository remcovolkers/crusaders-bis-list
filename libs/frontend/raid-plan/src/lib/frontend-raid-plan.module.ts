import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RaidPlanListComponent } from './components/raid-plan-list/raid-plan-list.component';
import { RaidPlanFormComponent } from './components/raid-plan-form/raid-plan-form.component';
import { RaidPlanDetailComponent } from './components/raid-plan-detail/raid-plan-detail.component';
import { superUserGuard } from '@crusaders-bis-list/frontend-auth';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        canActivate: [superUserGuard],
        children: [
          { path: '', component: RaidPlanListComponent },
          { path: 'new', component: RaidPlanFormComponent },
          { path: ':id', component: RaidPlanDetailComponent },
        ],
      },
    ]),
  ],
})
export class FrontendRaidPlanModule {}
