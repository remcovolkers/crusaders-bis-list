import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RaidPlanListComponent } from './components/raid-plan-list/raid-plan-list.component';
import { RaidPlanFormComponent } from './components/raid-plan-form/raid-plan-form.component';
import { RaidPlanDetailComponent } from './components/raid-plan-detail/raid-plan-detail.component';
import { SuperUserGuard } from '@crusaders-bis-list/frontend-auth';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        canActivate: [SuperUserGuard],
        children: [
          { path: '', component: RaidPlanListComponent },
          { path: 'new', component: RaidPlanFormComponent },
          { path: ':id', component: RaidPlanDetailComponent },
          { path: ':id/edit', component: RaidPlanFormComponent },
        ],
      },
    ]),
  ],
})
export class FrontendRaidPlanModule {}
