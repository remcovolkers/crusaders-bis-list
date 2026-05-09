import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { AdminService } from '../../services/admin.service';
import { IItem, ISeasonConfig } from '@crusaders-bis-list/shared-domain';
import { CatalogResponse } from '@crusaders-bis-list/frontend-loot';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';

@Component({
  selector: 'lib-admin-season-config',
  imports: [FormsModule],
  templateUrl: './admin-season-config.component.html',
  styleUrl: './admin-season-config.component.scss',
})
export class AdminSeasonConfigComponent {
  private readonly toast = inject(ToastService);
  private readonly adminService = inject(AdminService);

  private readonly configResource = rxResource({ stream: () => this.adminService.getSeasonConfig() });
  private readonly catalogResource = rxResource({ stream: () => this.adminService.getCatalog() });

  readonly config = computed(() => this.configResource.value() ?? null);
  readonly catalog = computed(() => this.catalogResource.value() ?? null);
  readonly loading = this.configResource.isLoading;
  readonly saving = signal(false);

  readonly trinketLimit = signal(2);
  readonly weaponLimit = signal(2);
  readonly jewelryLimit = signal(1);
  readonly armorLimit = signal(1);
  readonly superrareLimit = signal(0);

  readonly selectedBossId = signal<string | null>(null);
  readonly selectedBossItems = computed(() => {
    const cat = this.catalog();
    const bossId = this.selectedBossId();
    if (!cat) return [];
    const boss = cat.bosses.find((b) => b.id === bossId) ?? cat.bosses[0];
    return (boss?.items ?? []).filter((i) => i.itemLevel && i.itemLevel > 1);
  });
  readonly superRareUpdating = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      const c = this.configResource.value();
      if (!c) return;
      this.trinketLimit.set(c.trinketLimit);
      this.weaponLimit.set(c.weaponLimit);
      this.jewelryLimit.set(c.jewelryLimit);
      this.armorLimit.set(c.armorLimit);
      this.superrareLimit.set(c.superrareLimit);
    });
    effect(() => {
      const c = this.catalogResource.value();
      if (c?.bosses.length) this.selectedBossId.set(c.bosses[0].id);
    });
  }

  save(): void {
    const config = this.config();
    if (!config) return;
    this.saving.set(true);
    this.adminService
      .updateSeasonConfig(config.raidSeasonId, {
        trinketLimit: this.trinketLimit(),
        weaponLimit: this.weaponLimit(),
        jewelryLimit: this.jewelryLimit(),
        armorLimit: this.armorLimit(),
        superrareLimit: this.superrareLimit(),
      })
      .subscribe({
        next: (c) => {
          this.configResource.update(() => c);
          this.saving.set(false);
          this.toast.show('Configuratie opgeslagen!');
        },
        error: () => {
          this.toast.show('Opslaan mislukt.', 'error');
          this.saving.set(false);
        },
      });
  }

  toggleSuperRare(item: IItem): void {
    const current = this.superRareUpdating();
    current.add(item.id);
    this.superRareUpdating.set(new Set(current));

    this.adminService.updateItemSuperRare(item.id, !item.isSuperRare).subscribe({
      next: (updated) => {
        this.catalogResource.update((cat) =>
          cat
            ? {
                ...cat,
                bosses: cat.bosses.map((b) => ({
                  ...b,
                  items: b.items.map((i) => (i.id === updated.id ? updated : i)),
                })),
              }
            : cat,
        );
        const s = this.superRareUpdating();
        s.delete(item.id);
        this.superRareUpdating.set(new Set(s));
      },
      error: () => {
        this.toast.show('Super rare bijwerken mislukt.', 'error');
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
