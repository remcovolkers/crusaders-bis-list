import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RaiderLootOverviewComponent } from './components/raider-loot-overview/raider-loot-overview.component';
import { AuthGuard } from '@crusaders-bis-list/frontend-auth';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: RaiderLootOverviewComponent, canActivate: [AuthGuard] },
    ]),
  ],
})
export class FrontendLootModule {}

