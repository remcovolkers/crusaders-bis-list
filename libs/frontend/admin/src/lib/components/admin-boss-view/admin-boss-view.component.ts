import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { IBossLootView, IBoss, IItem, AssignmentStatus } from '@crusaders-bis-list/shared-domain';
import { CatalogResponse } from '@crusaders-bis-list/frontend-loot';

@Component({
  selector: 'lib-admin-boss-view',
  imports: [NgClass],
  templateUrl: './admin-boss-view.component.html',
  styleUrls: ['./admin-boss-view.component.scss'],
})
export class AdminBossViewComponent implements OnInit {
  readonly catalog = signal<CatalogResponse | null>(null);
  readonly selectedBoss = signal<IBoss | null>(null);
  readonly bossLootView = signal<IBossLootView | null>(null);
  readonly loadingBoss = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');

  readonly assignmentStatuses = [
    { key: 'champion', label: 'Champion', value: AssignmentStatus.CHAMPION_TIER },
    { key: 'hero', label: 'Hero', value: AssignmentStatus.HERO_TIER },
    { key: 'myth', label: 'Myth', value: AssignmentStatus.MYTH_TIER },
    { key: 'no-need', label: 'Niet nodig', value: AssignmentStatus.NIET_MEER_NODIG },
  ];

  readonly confirmingDeleteResId = signal<string | null>(null);

  readonly raidGroups = computed(() => {
    const catalog = this.catalog();
    if (!catalog) return [];
    const groups = new Map<string, { color: string; bosses: IBoss[] }>();
    for (const boss of catalog.bosses) {
      const key = boss.raidName ?? 'Onbekende raid';
      if (!groups.has(key)) groups.set(key, { color: boss.raidAccentColor ?? '#94a3b8', bosses: [] });
      groups.get(key)?.bosses.push(boss);
    }
    return Array.from(groups.entries()).map(([raidName, v]) => ({ raidName, ...v }));
  });

  private readonly adminService = inject(AdminService);

  ngOnInit(): void {
    this.adminService.getCatalog().subscribe({
      next: (catalog) => this.catalog.set(catalog),
      error: () => this.error.set('Kon catalogus niet laden.'),
    });
  }

  selectBoss(boss: IBoss & { items?: IItem[] }): void {
    this.selectedBoss.set(boss);
    this.bossLootView.set(null);
    this.loadingBoss.set(true);
    this.error.set('');

    const catalog = this.catalog();
    if (!catalog) return;
    this.adminService.getBossLootView(boss.id, catalog.season.id).subscribe({
      next: (view) => {
        this.bossLootView.set(view);
        this.loadingBoss.set(false);
      },
      error: () => {
        this.error.set('Kon boss loot niet laden.');
        this.loadingBoss.set(false);
      },
    });
  }

  getBossColor(boss: { raidAccentColor?: string }): string {
    return boss.raidAccentColor ?? '#94a3b8';
  }

  assign(raiderId: string, itemId: string, status: AssignmentStatus): void {
    const catalog = this.catalog();
    const selectedBoss = this.selectedBoss();
    if (!catalog || !selectedBoss) return;
    this.error.set('');
    this.successMessage.set('');

    const payload = {
      raiderId,
      itemId,
      bossId: selectedBoss.id,
      raidSeasonId: catalog.season.id,
      status,
    };

    this.adminService.assignLoot(payload).subscribe({
      next: () => {
        this.successMessage.set('Toewijzing opgeslagen!');
        this.selectBoss(selectedBoss as IBoss & { items?: IItem[] });
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (e: unknown) => {
        this.error.set((e as { error?: { message?: string } })?.error?.message ?? 'Toewijzing mislukt.');
      },
    });
  }

  requestDeleteReservation(reservationId: string): void {
    this.confirmingDeleteResId.set(reservationId);
  }

  confirmDeleteReservation(reservationId: string): void {
    this.confirmingDeleteResId.set(null);
    this.error.set('');
    this.adminService.cancelReservation(reservationId).subscribe({
      next: () => {
        const boss = this.selectedBoss();
        if (boss) this.selectBoss(boss as IBoss & { items?: IItem[] });
        this.successMessage.set('Reservering verwijderd.');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => {
        this.error.set('Reservering verwijderen mislukt.');
      },
    });
  }

  abortDeleteReservation(): void {
    this.confirmingDeleteResId.set(null);
  }
}
