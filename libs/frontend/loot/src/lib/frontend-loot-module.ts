import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RaiderLootOverviewComponent } from './components/raider-loot-overview/raider-loot-overview.component';
import { authGuard } from '@crusaders-bis-list/frontend-auth';

@NgModule({
  imports: [RouterModule.forChild([{ path: '', component: RaiderLootOverviewComponent, canActivate: [authGuard] }])],
})
export class FrontendLootModule {}
