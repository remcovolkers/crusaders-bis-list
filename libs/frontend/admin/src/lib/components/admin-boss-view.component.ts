import { Component, OnInit } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { IBossLootView, IBoss, AssignmentStatus } from '@crusaders-bis-list/shared-domain';
import { CatalogResponse } from '@crusaders-bis-list/frontend-loot';

@Component({
  selector: 'app-admin-boss-view',
  template: `
    <div class="admin-view">
      <div class="page-header">
        <h1>🛡️ Admin — Loot toewijzing</h1>
        <p class="subtitle" *ngIf="catalog">{{ catalog.season.name }}</p>
      </div>

      <!-- Boss selectie -->
      <div class="boss-selector" *ngIf="catalog">
        <h2>Selecteer boss</h2>
        <div class="boss-buttons">
          <button
            *ngFor="let boss of catalog.bosses"
            class="boss-btn"
            [class.active]="selectedBoss?.id === boss.id"
            (click)="selectBoss(boss)"
          >
            {{ boss.order }}. {{ boss.name }}
          </button>
        </div>
      </div>

      <!-- Loot view voor geselecteerde boss -->
      <div class="loot-view" *ngIf="bossLootView">
        <h2>{{ bossLootView.boss.name }} — loot toewijzing</h2>

        <div class="item-panels">
          <div class="item-panel" *ngFor="let drop of bossLootView.drops">
            <div class="item-panel-header">
              <span class="item-category" [class]="'cat-' + drop.item.category">
                {{ drop.item.category | uppercase }}
              </span>
              <h3>{{ drop.item.name }}</h3>
            </div>

            <div class="no-eligible" *ngIf="drop.eligibleRaiders.length === 0">
              Geen eligible raiders — allen hebben dit item al.
            </div>

            <div class="raiders-list" *ngIf="drop.eligibleRaiders.length > 0">
              <div class="raider-row" *ngFor="let raider of drop.eligibleRaiders">
                <div class="raider-info">
                  <span class="raider-name">{{ raider.characterName }}</span>
                  <span class="raider-class">{{ raider.wowClass }} — {{ raider.spec }}</span>
                  <span class="reservation-badge" *ngIf="raider.hasReservation">⭐ Gereserveerd</span>
                </div>
                <div class="assign-actions">
                  <button
                    *ngFor="let status of assignmentStatuses"
                    class="assign-btn"
                    [class]="'tier-' + status.key"
                    (click)="assign(raider.raiderId, drop.item.id, status.value)"
                  >
                    {{ status.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="loadingBoss" class="loading">Laden...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
      <div *ngIf="successMessage" class="success">{{ successMessage }}</div>
    </div>
  `,
  styles: [`
    .admin-view { max-width: 1100px; margin: 0 auto; padding: 24px; color: #e8e8e8; background: #0d1117; min-height: 100vh; }
    .page-header h1 { color: #f0c040; }
    .subtitle { color: #888; }
    .boss-selector h2 { color: #a78bfa; margin-bottom: 12px; }
    .boss-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
    .boss-btn {
      padding: 8px 16px; border: 1px solid #333; border-radius: 8px;
      background: #161b22; color: #e8e8e8; cursor: pointer; transition: all 0.2s;
    }
    .boss-btn.active { border-color: #f0c040; color: #f0c040; background: rgba(240,192,64,0.1); }
    .boss-btn:hover { border-color: #a78bfa; }
    .loot-view h2 { color: #f0c040; border-bottom: 1px solid #333; padding-bottom: 12px; }
    .item-panels { display: flex; flex-direction: column; gap: 20px; }
    .item-panel { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 20px; }
    .item-panel-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .item-panel-header h3 { color: #e8e8e8; margin: 0; }
    .item-category { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 3px 10px; border-radius: 4px; }
    .cat-trinket { background: rgba(167,139,250,0.2); color: #a78bfa; }
    .cat-weapon { background: rgba(248,113,113,0.2); color: #f87171; }
    .no-eligible { color: #555; font-style: italic; padding: 12px 0; }
    .raider-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px; border-bottom: 1px solid #21262d; gap: 16px;
    }
    .raider-row:last-child { border-bottom: none; }
    .raider-info { display: flex; flex-direction: column; gap: 2px; min-width: 160px; }
    .raider-name { font-weight: 600; }
    .raider-class { font-size: 0.8rem; color: #888; }
    .reservation-badge { font-size: 0.75rem; color: #f0c040; }
    .assign-actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .assign-btn {
      padding: 5px 12px; border: none; border-radius: 6px;
      cursor: pointer; font-size: 0.8rem; font-weight: 700;
    }
    .tier-champion { background: #3b5998; color: white; }
    .tier-hero { background: #7b2fbe; color: white; }
    .tier-myth { background: #c0392b; color: white; }
    .tier-no-need { background: #2d3748; color: #94a3b8; }
    .loading { text-align: center; padding: 40px; color: #888; }
    .error { color: #f87171; padding: 12px; background: rgba(248,113,113,0.1); border-radius: 8px; margin-top: 16px; }
    .success { color: #4ade80; padding: 12px; background: rgba(74,222,128,0.1); border-radius: 8px; margin-top: 16px; }
  `],
})
export class AdminBossViewComponent implements OnInit {
  catalog: CatalogResponse | null = null;
  selectedBoss: IBoss | null = null;
  bossLootView: IBossLootView | null = null;
  loadingBoss = false;
  error = '';
  successMessage = '';

  readonly assignmentStatuses = [
    { key: 'champion', label: 'Champion', value: AssignmentStatus.CHAMPION_TIER },
    { key: 'hero', label: 'Hero', value: AssignmentStatus.HERO_TIER },
    { key: 'myth', label: 'Myth', value: AssignmentStatus.MYTH_TIER },
    { key: 'no-need', label: 'Niet meer nodig', value: AssignmentStatus.NIET_MEER_NODIG },
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getCatalog().subscribe({
      next: (catalog) => (this.catalog = catalog),
      error: () => (this.error = 'Kon catalogus niet laden.'),
    });
  }

  selectBoss(boss: IBoss & { items?: any[] }): void {
    this.selectedBoss = boss;
    this.bossLootView = null;
    this.loadingBoss = true;
    this.error = '';

    if (!this.catalog) return;
    this.adminService.getBossLootView(boss.id, this.catalog.season.id).subscribe({
      next: (view) => {
        this.bossLootView = view;
        this.loadingBoss = false;
      },
      error: () => {
        this.error = 'Kon boss loot niet laden.';
        this.loadingBoss = false;
      },
    });
  }

  assign(raiderId: string, itemId: string, status: AssignmentStatus): void {
    if (!this.catalog || !this.selectedBoss) return;
    this.error = '';
    this.successMessage = '';

    const payload = {
      raiderId,
      itemId,
      bossId: this.selectedBoss.id,
      raidSeasonId: this.catalog.season.id,
      status,
    };

    this.adminService.assignLoot(payload).subscribe({
      next: () => {
        this.successMessage = 'Toewijzing opgeslagen!';
        // Reload the view to reflect updated eligibility
        this.selectBoss(this.selectedBoss!);
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (e) => {
        this.error = e.error?.message ?? 'Toewijzing mislukt.';
      },
    });
  }
}
