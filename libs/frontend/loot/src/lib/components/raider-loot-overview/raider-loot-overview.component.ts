import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LootService, CatalogResponse } from '../../services/loot.service';
import {
  IItem,
  IBoss,
  ISeasonConfig,
  IRaiderProfile,
  ItemCategory,
  ArmorType,
  CLASS_ARMOR_TYPE,
  WOW_CLASS_COLOR,
  WowClass,
  WowSpec,
} from '@crusaders-bis-list/shared-domain';
import { ClassSpecSelectorComponent, ClassSpecSelection } from '@crusaders-bis-list/frontend-shared-ui';

type CategoryTab = 'all' | 'trinket' | 'weapon' | 'cloth' | 'leather' | 'mail' | 'plate' | 'jewelry';

interface ItemWithReservation extends IItem {
  isReserved?: boolean;
  reservationId?: string;
}

@Component({
  selector: 'lib-raider-loot-overview',
  imports: [NgClass, FormsModule, ClassSpecSelectorComponent],
  templateUrl: './raider-loot-overview.component.html',
  styleUrls: ['./raider-loot-overview.component.scss'],
})
export class RaiderLootOverviewComponent implements OnInit {
  readonly catalog = signal<CatalogResponse | null>(null);
  readonly profile = signal<IRaiderProfile | null>(null);
  readonly config = signal<ISeasonConfig | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly activeTab = signal<CategoryTab>('all');
  readonly showProfileEditor = signal(false);
  readonly editCharName = signal('');
  readonly editClass = signal<WowClass | null>(null);
  readonly editSpec = signal<WowSpec | null>(null);

  private readonly reservationMap = signal(new Map<string, string>());
  private readonly lootService = inject(LootService);

  readonly tabs: { key: CategoryTab; label: string }[] = [
    { key: 'all', label: 'Alles' },
    { key: 'trinket', label: 'Trinkets' },
    { key: 'weapon', label: 'Wapens' },
    { key: 'cloth', label: 'Cloth' },
    { key: 'leather', label: 'Leather' },
    { key: 'mail', label: 'Mail' },
    { key: 'plate', label: 'Plate' },
    { key: 'jewelry', label: 'Jewelry' },
  ];

  readonly trinketLimit = computed(() => this.config()?.trinketLimit ?? 2);
  readonly weaponLimit = computed(() => this.config()?.weaponLimit ?? 2);
  readonly jewelryLimit = computed(() => this.config()?.jewelryLimit ?? 0);
  readonly otherLimit = computed(() => this.config()?.otherLimit ?? 0);
  readonly superrareLimit = computed(() => this.config()?.superrareLimit ?? 0);

  readonly classColor = computed(() => {
    const wowClass = this.profile()?.wowClass;
    if (!wowClass) return 'var(--accent-gold)';
    return WOW_CLASS_COLOR[wowClass] ?? 'var(--accent-gold)';
  });

  readonly reservedTrinkets = computed(
    () =>
      Array.from(this.reservationMap().keys()).filter((id) => this.findItem(id)?.category === ItemCategory.TRINKET)
        .length,
  );

  readonly reservedWeapons = computed(
    () =>
      Array.from(this.reservationMap().keys()).filter((id) => {
        const cat = this.findItem(id)?.category;
        return cat === ItemCategory.WEAPON || cat === ItemCategory.OFFHAND;
      }).length,
  );

  readonly reservedJewelry = computed(
    () =>
      Array.from(this.reservationMap().keys()).filter((id) => this.findItem(id)?.category === ItemCategory.JEWELRY)
        .length,
  );

  readonly reservedOther = computed(
    () =>
      Array.from(this.reservationMap().keys()).filter((id) => this.findItem(id)?.category === ItemCategory.OTHER)
        .length,
  );

  readonly reservedSuperrare = computed(
    () => Array.from(this.reservationMap().keys()).filter((id) => this.findItem(id)?.isSuperRare === true).length,
  );

  ngOnInit(): void {
    this.lootService.getMyProfile().subscribe({
      next: (p) => this.profile.set(p),
    });
    this.lootService.getSeasonConfig().subscribe({
      next: (c) => this.config.set(c),
    });
    this.lootService.getCatalog().subscribe({
      next: (catalog) => {
        this.catalog.set(catalog);
        this.loading.set(false);
        this.loadReservations(catalog.season.id);
        const wowClass = this.profile()?.wowClass;
        if (wowClass) {
          const armorType = CLASS_ARMOR_TYPE[wowClass];
          if (armorType && armorType !== ArmorType.NONE) {
            this.activeTab.set(armorType as CategoryTab);
          }
        }
      },
      error: () => {
        this.error.set('Kon catalogus niet laden.');
        this.loading.set(false);
      },
    });
  }

  private loadReservations(seasonId: string): void {
    this.lootService.getMyReservations(seasonId).subscribe({
      next: (reservations) => {
        const map = new Map<string, string>();
        reservations.forEach((r) => map.set(r.itemId, r.id));
        this.reservationMap.set(map);
      },
    });
  }

  getFilteredItems(items: IItem[]): ItemWithReservation[] {
    const activeTab = this.activeTab();
    const map = this.reservationMap();
    return items
      .filter((i) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'weapon') {
          return i.category === ItemCategory.WEAPON || i.category === ItemCategory.OFFHAND;
        }
        return i.category === (activeTab as ItemCategory);
      })
      .map((i) => ({
        ...i,
        isReserved: map.has(i.id),
        reservationId: map.get(i.id),
      }));
  }

  hasBossItems(items: IItem[]): boolean {
    return this.getFilteredItems(items).length > 0;
  }

  isAtLimit(category: ItemCategory, isSuperRare = false): boolean {
    if (category === ItemCategory.TRINKET) return this.reservedTrinkets() >= this.trinketLimit();
    if (category === ItemCategory.WEAPON || category === ItemCategory.OFFHAND)
      return this.reservedWeapons() >= this.weaponLimit();
    if (category === ItemCategory.JEWELRY) {
      if (this.jewelryLimit() === 0) return true;
      return this.reservedJewelry() >= this.jewelryLimit();
    }
    if (category === ItemCategory.OTHER) {
      if (this.otherLimit() === 0) return true;
      return this.reservedOther() >= this.otherLimit();
    }
    if (isSuperRare && this.superrareLimit() > 0) {
      return this.reservedSuperrare() >= this.superrareLimit();
    }
    return true;
  }

  getCategoryLabel(category: ItemCategory): string {
    const labels: Record<string, string> = {
      trinket: 'Trinket',
      weapon: 'Weapon',
      offhand: 'Off-hand',
      cloth: 'Cloth',
      leather: 'Leather',
      mail: 'Mail',
      plate: 'Plate',
      jewelry: 'Jewelry',
      other: 'Other',
    };
    return labels[category] ?? category;
  }

  getCategoryClass(category: ItemCategory): string {
    return `cat-${category}`;
  }

  getBossColor(boss: { raidAccentColor?: string }): string {
    return boss.raidAccentColor ?? '#94a3b8';
  }

  groupBossesByRaid(): { raidName: string; color: string; bosses: IBoss[] }[] {
    const catalog = this.catalog();
    if (!catalog) return [];
    const groups = new Map<string, { color: string; bosses: IBoss[] }>();
    for (const boss of catalog.bosses) {
      const key = boss.raidName ?? 'Unknown Raid';
      if (!groups.has(key)) {
        groups.set(key, { color: boss.raidAccentColor ?? '#94a3b8', bosses: [] });
      }
      groups.get(key)?.bosses.push(boss);
    }
    return Array.from(groups.entries()).map(([raidName, v]) => ({ raidName, ...v }));
  }

  openProfileEditor(): void {
    const p = this.profile();
    this.editCharName.set(p?.characterName ?? '');
    this.editClass.set(p?.wowClass ?? null);
    this.editSpec.set(p?.spec ?? null);
    this.showProfileEditor.set(true);
  }

  onClassSpecChange(sel: ClassSpecSelection): void {
    this.editClass.set(sel.wowClass);
    this.editSpec.set(sel.spec);
  }

  saveProfile(): void {
    const editClass = this.editClass();
    const editSpec = this.editSpec();
    const editCharName = this.editCharName().trim();
    if (!editClass || !editSpec || !editCharName) return;
    const dto = { characterName: editCharName, wowClass: editClass, spec: editSpec };
    const req = this.profile() ? this.lootService.updateProfile(dto) : this.lootService.saveProfile(dto);
    req.subscribe({
      next: (p) => {
        this.profile.set(p);
        this.showProfileEditor.set(false);
        if (p.wowClass) {
          const armorType = CLASS_ARMOR_TYPE[p.wowClass];
          if (armorType && armorType !== ArmorType.NONE) this.activeTab.set(armorType as CategoryTab);
        }
      },
      error: () => alert('Profiel opslaan mislukt.'),
    });
  }

  reserve(item: ItemWithReservation): void {
    const catalog = this.catalog();
    if (!catalog) return;
    this.lootService.reserve(item.id, catalog.season.id).subscribe({
      next: () => this.loadReservations(catalog.season.id),
      error: (e: unknown) => alert((e as { error?: { message?: string } }).error?.message ?? 'Reservering mislukt'),
    });
  }

  scrollToBoss(bossId: string): void {
    document.getElementById('boss-' + bossId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private findItem(itemId: string): IItem | undefined {
    return this.catalog()
      ?.bosses.flatMap((b) => b.items)
      .find((i) => i.id === itemId);
  }
}
