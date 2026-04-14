import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RaiderLootOverviewComponent } from './components/raider-loot-overview.component';
import { AuthGuard } from '@crusaders-bis-list/frontend-auth';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: RaiderLootOverviewComponent, canActivate: [AuthGuard] },
    ]),
  ],
  declarations: [RaiderLootOverviewComponent],
  exports: [RaiderLootOverviewComponent],
})
export class FrontendLootModule {}

