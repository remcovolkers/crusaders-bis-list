import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { IItem, ISeasonConfig } from '@crusaders-bis-list/shared-domain';
import { CatalogResponse } from '@crusaders-bis-list/frontend-loot';

@Component({
  selector: 'lib-admin-season-config',
  imports: [FormsModule],
  templateUrl: './admin-season-config.component.html',
  styleUrl: './admin-season-config.component.scss',
})
export class AdminSeasonConfigComponent implements OnInit {
  readonly config = signal<ISeasonConfig | null>(null);
  readonly trinketLimit = signal(2);
  readonly weaponLimit = signal(2);
  readonly jewelryLimit = signal(1);
  readonly otherLimit = signal(1);
  readonly superrareLimit = signal(0);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly syncing = signal(false);
  readonly syncSuccess = signal('');
  readonly resetting = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  readonly catalog = signal<CatalogResponse | null>(null);
  readonly selectedBossId = signal<string | null>(null);
  readonly selectedBossItems = computed(() => {
    const cat = this.catalog();
    const bossId = this.selectedBossId();
    if (!cat) return [];
    const boss = cat.bosses.find((b) => b.id === bossId) ?? cat.bosses[0];
    return (boss?.items ?? []).filter((i) => i.itemLevel && i.itemLevel > 1);
  });
  readonly superRareUpdating = signal<Set<string>>(new Set());

  private readonly adminService = inject(AdminService);

  ngOnInit(): void {
    this.adminService.getSeasonConfig().subscribe({
      next: (c) => {
        this.config.set(c);
        this.trinketLimit.set(c.trinketLimit);
        this.weaponLimit.set(c.weaponLimit);
        this.jewelryLimit.set(c.jewelryLimit);
        this.otherLimit.set(c.otherLimit);
        this.superrareLimit.set(c.superrareLimit);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Kon configuratie niet laden.');
        this.loading.set(false);
      },
    });
    this.adminService.getCatalog().subscribe({
      next: (c) => {
        this.catalog.set(c);
        if (c.bosses.length) this.selectedBossId.set(c.bosses[0].id);
      },
    });
  }

  save(): void {
    const config = this.config();
    if (!config) return;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.adminService
      .updateSeasonConfig(config.raidSeasonId, {
        trinketLimit: this.trinketLimit(),
        weaponLimit: this.weaponLimit(),
        jewelryLimit: this.jewelryLimit(),
        otherLimit: this.otherLimit(),
        superrareLimit: this.superrareLimit(),
      })
      .subscribe({
        next: (c) => {
          this.config.set(c);
          this.saving.set(false);
          this.success.set('Configuratie opgeslagen!');
          setTimeout(() => this.success.set(''), 3000);
        },
        error: () => {
          this.error.set('Opslaan mislukt.');
          this.saving.set(false);
        },
      });
  }

  syncNow(): void {
    this.syncing.set(true);
    this.syncSuccess.set('');
    this.error.set('');
    this.adminService.syncCatalog().subscribe({
      next: (res) => {
        this.syncing.set(false);
        this.syncSuccess.set(res.message);
        // Reload catalog after sync, preserve boss selection
        this.adminService.getCatalog().subscribe({
          next: (c) => {
            this.catalog.set(c);
            if (!this.selectedBossId() && c.bosses.length) this.selectedBossId.set(c.bosses[0].id);
          },
        });
        setTimeout(() => this.syncSuccess.set(''), 5000);
      },
      error: () => {
        this.syncing.set(false);
        this.error.set('Synchronisatie mislukt.');
      },
    });
  }

  resetAndSync(): void {
    if (
      !confirm(
        'Weet je zeker dat je de volledige catalogus wil wissen en opnieuw synchroniseren? Reserveringen blijven bewaard.',
      )
    )
      return;
    this.resetting.set(true);
    this.syncSuccess.set('');
    this.error.set('');
    this.adminService.resetAndSyncCatalog().subscribe({
      next: (res) => {
        this.resetting.set(false);
        this.syncSuccess.set(res.message);
        this.adminService.getCatalog().subscribe({
          next: (c) => {
            this.catalog.set(c);
            if (c.bosses.length) this.selectedBossId.set(c.bosses[0].id);
          },
        });
        setTimeout(() => this.syncSuccess.set(''), 5000);
      },
      error: () => {
        this.resetting.set(false);
        this.error.set('Reset & sync mislukt.');
      },
    });
  }

  toggleSuperRare(item: IItem): void {
    const current = this.superRareUpdating();
    current.add(item.id);
    this.superRareUpdating.set(new Set(current));

    this.adminService.updateItemSuperRare(item.id, !item.isSuperRare).subscribe({
      next: (updated) => {
        // Patch item in catalog signal
        const cat = this.catalog();
        if (cat) {
          this.catalog.set({
            ...cat,
            bosses: cat.bosses.map((b) => ({
              ...b,
              items: b.items.map((i) => (i.id === updated.id ? updated : i)),
            })),
          });
        }
        const s = this.superRareUpdating();
        s.delete(item.id);
        this.superRareUpdating.set(new Set(s));
      },
      error: () => {
        this.error.set('Super rare bijwerken mislukt.');
        const s = this.superRareUpdating();
        s.delete(item.id);
        this.superRareUpdating.set(new Set(s));
      },
    });
  }

  isUpdating(itemId: string): boolean {
    return this.superRareUpdating().has(itemId);
  }
}
