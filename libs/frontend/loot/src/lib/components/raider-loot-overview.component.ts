import { Component, OnInit } from '@angular/core';
import { LootService, CatalogResponse } from '../services/loot.service';
import { IItem, ItemCategory } from '@crusaders-bis-list/shared-domain';

interface ItemWithReservation extends IItem {
  isReserved?: boolean;
  reservationId?: string;
}

@Component({
  selector: 'app-raider-loot-overview',
  template: `
    <div class="raider-overview" *ngIf="catalog">
      <div class="page-header">
        <h1>⚔️ Crusaders BIS List</h1>
        <p class="season-name">{{ catalog.season.name }}</p>
      </div>

      <div class="filters">
        <label>
          <input type="checkbox" [(ngModel)]="filterPrioritizable" (change)="applyFilter()" />
          Alleen reserveerbare items
        </label>
        <select [(ngModel)]="filterCategory" (change)="applyFilter()">
          <option value="">Alle categorieën</option>
          <option value="trinket">Trinkets</option>
          <option value="weapon">Wapens</option>
        </select>
      </div>

      <div class="reservation-summary">
        <span class="badge">Trinkets gereserveerd: {{ reservedTrinkets }}/2</span>
        <span class="badge">Wapens gereserveerd: {{ reservedWeapons }}/2</span>
      </div>

      <div class="boss-list">
        <div class="boss-section" *ngFor="let boss of catalog.bosses">
          <h2 class="boss-name">{{ boss.order }}. {{ boss.name }}</h2>
          <div class="items-grid">
            <div
              class="item-card"
              *ngFor="let item of getFilteredItems(boss.items)"
              [class.reserved]="item.isReserved"
              [class.not-prioritizable]="!item.isPrioritizable"
            >
              <div class="item-header">
                <span class="item-category" [class]="'cat-' + item.category">
                  {{ getCategoryLabel(item.category) }}
                </span>
                <span class="item-name">{{ item.name }}</span>
              </div>
              <div class="item-actions" *ngIf="item.isPrioritizable">
                <button
                  *ngIf="!item.isReserved"
                  class="btn-reserve"
                  [disabled]="isAtLimit(item.category)"
                  (click)="reserve(item)"
                >
                  {{ isAtLimit(item.category) ? 'Limiet bereikt' : 'Reserveer' }}
                </button>
                <button
                  *ngIf="item.isReserved"
                  class="btn-cancel"
                  (click)="cancelReservation(item)"
                >
                  Annuleer
                </button>
              </div>
              <div class="item-actions" *ngIf="!item.isPrioritizable">
                <span class="not-reservable">Niet reserveerbaar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="!catalog && loading" class="loading">
      <p>Laden...</p>
    </div>

    <div *ngIf="error" class="error">{{ error }}</div>
  `,
  styles: [`
    .raider-overview {
      max-width: 1200px; margin: 0 auto; padding: 24px;
      color: #e8e8e8; background: #0d1117; min-height: 100vh;
    }
    .page-header h1 { color: #f0c040; font-size: 2rem; margin: 0; }
    .season-name { color: #888; margin: 4px 0 24px; }
    .filters { display: flex; gap: 16px; align-items: center; margin-bottom: 16px; }
    .filters select { padding: 6px 12px; border-radius: 6px; background: #1e2530; color: #e8e8e8; border: 1px solid #333; }
    .reservation-summary { display: flex; gap: 12px; margin-bottom: 24px; }
    .badge {
      padding: 6px 14px; border-radius: 20px;
      background: rgba(240,192,64,0.15); color: #f0c040;
      border: 1px solid rgba(240,192,64,0.3); font-size: 0.875rem;
    }
    .boss-section { margin-bottom: 40px; }
    .boss-name { color: #a78bfa; border-bottom: 1px solid #333; padding-bottom: 8px; }
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .item-card {
      background: #161b22; border: 1px solid #30363d; border-radius: 10px;
      padding: 14px; transition: border-color 0.2s;
    }
    .item-card.reserved { border-color: #f0c040; background: rgba(240,192,64,0.05); }
    .item-card.not-prioritizable { opacity: 0.6; }
    .item-header { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 10px; }
    .item-category {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      padding: 2px 8px; border-radius: 4px; white-space: nowrap;
    }
    .cat-trinket { background: rgba(167,139,250,0.2); color: #a78bfa; }
    .cat-weapon { background: rgba(248,113,113,0.2); color: #f87171; }
    .cat-other { background: rgba(148,163,184,0.1); color: #94a3b8; }
    .item-name { font-weight: 500; font-size: 0.9rem; }
    .btn-reserve, .btn-cancel {
      padding: 6px 16px; border: none; border-radius: 6px;
      cursor: pointer; font-size: 0.875rem; font-weight: 600; width: 100%;
    }
    .btn-reserve { background: #f0c040; color: #1a1a2e; }
    .btn-reserve:disabled { background: #555; color: #999; cursor: not-allowed; }
    .btn-cancel { background: rgba(248,113,113,0.2); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
    .not-reservable { color: #555; font-size: 0.8rem; }
    .loading, .error { text-align: center; padding: 48px; color: #999; }
    .error { color: #f87171; }
  `],
})
export class RaiderLootOverviewComponent implements OnInit {
  catalog: CatalogResponse | null = null;
  loading = false;
  error = '';
  filterPrioritizable = false;
  filterCategory = '';

  private reservationMap = new Map<string, string>(); // itemId -> reservationId

  constructor(private lootService: LootService) {}

  ngOnInit(): void {
    this.loading = true;
    this.lootService.getCatalog().subscribe({
      next: (catalog) => {
        this.catalog = catalog;
        this.loading = false;
        this.loadReservations(catalog.season.id);
      },
      error: (e) => {
        this.error = 'Kon catalogus niet laden.';
        this.loading = false;
      },
    });
  }

  private loadReservations(seasonId: string): void {
    this.lootService.getMyReservations(seasonId).subscribe({
      next: (reservations) => {
        this.reservationMap.clear();
        reservations.forEach((r) => this.reservationMap.set(r.itemId, r.id));
      },
    });
  }

  getFilteredItems(items: IItem[]): ItemWithReservation[] {
    return items
      .filter((i) => !this.filterPrioritizable || i.isPrioritizable)
      .filter((i) => !this.filterCategory || i.category === this.filterCategory)
      .map((i) => ({
        ...i,
        isReserved: this.reservationMap.has(i.id),
        reservationId: this.reservationMap.get(i.id),
      }));
  }

  getCategoryLabel(category: ItemCategory): string {
    const labels: Record<string, string> = {
      trinket: 'Trinket',
      weapon: 'Wapen',
      other: 'Anders',
    };
    return labels[category] ?? category;
  }

  get reservedTrinkets(): number {
    if (!this.catalog) return 0;
    return Array.from(this.reservationMap.keys()).filter(
      (itemId) => this.findItem(itemId)?.category === ItemCategory.TRINKET,
    ).length;
  }

  get reservedWeapons(): number {
    if (!this.catalog) return 0;
    return Array.from(this.reservationMap.keys()).filter(
      (itemId) => this.findItem(itemId)?.category === ItemCategory.WEAPON,
    ).length;
  }

  isAtLimit(category: ItemCategory): boolean {
    if (category === ItemCategory.TRINKET) return this.reservedTrinkets >= 2;
    if (category === ItemCategory.WEAPON) return this.reservedWeapons >= 2;
    return true;
  }

  private findItem(itemId: string): IItem | undefined {
    return this.catalog?.bosses.flatMap((b) => b.items).find((i) => i.id === itemId);
  }

  reserve(item: ItemWithReservation): void {
    if (!this.catalog) return;
    this.lootService.reserve(item.id, this.catalog.season.id).subscribe({
      next: () => {
        if (!this.catalog) return;
        this.loadReservations(this.catalog.season.id);
      },
      error: (e) => {
        alert(e.error?.message ?? 'Reservering mislukt');
      },
    });
  }

  cancelReservation(item: ItemWithReservation): void {
    const reservationId = item.reservationId;
    if (!reservationId || !this.catalog) return;
    this.lootService.cancelReservation(reservationId).subscribe({
      next: () => {
        if (!this.catalog) return;
        this.loadReservations(this.catalog.season.id);
      },
    });
  }

  applyFilter(): void {
    // Triggers change detection via ngModel binding
  }
}
