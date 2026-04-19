import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import {
  IBossLootView,
  IBoss,
  IEligibleRaider,
  AssignmentStatus,
  WowClass,
  WOW_CLASS_REGISTRY,
  ITEM_CATEGORY_LABELS,
  WEAPON_TYPE_LABELS,
  PRIMARY_STAT_LABELS,
  TIER_LABELS,
  ItemCategory,
  IItem,
} from '@crusaders-bis-list/shared-domain';
import { CatalogResponse } from '@crusaders-bis-list/frontend-loot';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';
import { AdminAssignConfirmComponent, PendingAssignment } from '../admin-assign-confirm/admin-assign-confirm.component';
import { AdminDiceModalComponent } from '../admin-dice-modal/admin-dice-modal.component';

interface DiceModalInput {
  item: IItem;
  bossId: string;
  raiders: IEligibleRaider[];
}

@Component({
  selector: 'lib-admin-boss-view',
  imports: [NgClass, AdminAssignConfirmComponent, AdminDiceModalComponent],
  templateUrl: './admin-boss-view.component.html',
  styleUrls: ['./admin-boss-view.component.scss'],
})
export class AdminBossViewComponent implements OnInit {
  readonly catalog = signal<CatalogResponse | null>(null);
  readonly bossLootViews = signal<IBossLootView[]>([]);
  readonly loadingAll = signal(false);
  readonly pendingAssignment = signal<PendingAssignment | null>(null);
  readonly activeDiceModal = signal<DiceModalInput | null>(null);
  readonly sidebarOpen = signal(false);

  private readonly toast = inject(ToastService);

  readonly tierLabels = TIER_LABELS;

  readonly selectedDifficulty = signal<AssignmentStatus | null>(null);

  readonly difficulties = [
    { key: AssignmentStatus.CHAMPION_TIER, label: 'Champion', value: AssignmentStatus.CHAMPION_TIER },
    { key: AssignmentStatus.HERO_TIER,     label: 'Hero',     value: AssignmentStatus.HERO_TIER },
    { key: AssignmentStatus.MYTH_TIER,     label: 'Myth',     value: AssignmentStatus.MYTH_TIER },
  ];

  readonly categoryLabels = ITEM_CATEGORY_LABELS;
  readonly weaponTypeLabels = WEAPON_TYPE_LABELS;
  readonly primaryStatLabels = PRIMARY_STAT_LABELS;
  readonly ItemCategory = ItemCategory;

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
    this.loadingAll.set(true);
    this.adminService.getCatalog().subscribe({
      next: (catalog) => {
        this.catalog.set(catalog);
        forkJoin(catalog.bosses.map((boss) => this.adminService.getBossLootView(boss.id, catalog.season.id))).subscribe(
          {
            next: (views) => {
              this.bossLootViews.set(views);
              this.loadingAll.set(false);
            },
            error: () => {
              this.toast.show('Kon boss loot niet laden.', 'error');
              this.loadingAll.set(false);
            },
          },
        );
      },
      error: () => {
        this.toast.show('Kon catalogus niet laden.', 'error');
        this.loadingAll.set(false);
      },
    });
  }

  scrollToBoss(bossId: string): void {
    document.getElementById('boss-' + bossId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getBossColor(boss: { raidAccentColor?: string }): string {
    return boss.raidAccentColor ?? '#94a3b8';
  }

  assign(raiderId: string, itemId: string, bossId: string, raiderName: string, item: IItem): void {
    this.pendingAssignment.set({ raiderId, itemId, bossId, raiderName, item });
  }

  confirmAssign(): void {
    const pending = this.pendingAssignment();
    const catalog = this.catalog();
    const difficulty = this.selectedDifficulty();
    if (!pending || !catalog || !difficulty) return;

    this.pendingAssignment.set(null);
    const { raiderId, itemId, bossId } = pending;
    const payload = { raiderId, itemId, bossId, raidSeasonId: catalog.season.id, status: difficulty };

    this.adminService.assignLoot(payload).subscribe({
      next: () => {
        this.toast.show('Toewijzing opgeslagen!');
        this.adminService.getBossLootView(bossId, catalog.season.id).subscribe({
          next: (view) => this.bossLootViews.update((views) => views.map((v) => (v.boss.id === bossId ? view : v))),
        });
      },
      error: (e: unknown) => {
        this.toast.show((e as { error?: { message?: string } })?.error?.message ?? 'Toewijzing mislukt.', 'error');
      },
    });
  }

  private readonly UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private isUuid(val: string): boolean {
    return this.UUID_RE.test(val);
  }

  private readonly TIER_RANK: Record<AssignmentStatus, number> = {
    [AssignmentStatus.CHAMPION_TIER]: 1,
    [AssignmentStatus.HERO_TIER]: 2,
    [AssignmentStatus.MYTH_TIER]: 3,
  };

  /** True als de raider het item al heeft op de geselecteerde difficulty of hoger. */
  private raiderHasAtLeast(raider: IEligibleRaider, difficulty: AssignmentStatus): boolean {
    const required = this.TIER_RANK[difficulty];
    const assignedRank = raider.assignment ? (this.TIER_RANK[raider.assignment.status] ?? 0) : 0;
    const receivedRank = raider.receivedTier ? (this.TIER_RANK[raider.receivedTier] ?? 0) : 0;
    return Math.max(assignedRank, receivedRank) >= required;
  }

  raiderHasSelectedDifficulty(raider: IEligibleRaider): boolean {
    const diff = this.selectedDifficulty();
    return diff ? this.raiderHasAtLeast(raider, diff) : false;
  }

  visibleRaiders(raiders: IEligibleRaider[]): IEligibleRaider[] {
    return raiders.filter((r) => !this.raiderHasSelectedDifficulty(r) && !this.isUuid(r.characterName));
  }

  /** Verberg een drop als alle raiders die het gereserveerd hebben het item al hebben op de huidige difficulty. */
  visibleDrops(drops: IBossLootView['drops']): IBossLootView['drops'] {
    const diff = this.selectedDifficulty();
    if (!diff) return drops;
    return drops.filter((drop) => {
      const eligible = drop.eligibleRaiders.filter((r) => !this.isUuid(r.characterName));
      if (eligible.length === 0) return false;
      return eligible.some((r) => !this.raiderHasAtLeast(r, diff));
    });
  }

  classColor(wowClass: WowClass): string {
    return WOW_CLASS_REGISTRY[wowClass]?.color ?? '#94a3b8';
  }

  difficultyLabel(status: AssignmentStatus): string {
    return this.difficulties.find((d) => d.value === status)?.label ?? status;
  }

  openDiceModal(drop: IBossLootView['drops'][number], bossId: string): void {
    const raiders = this.visibleRaiders(drop.eligibleRaiders);
    if (raiders.length < 2) return;
    this.activeDiceModal.set({ item: drop.item, bossId, raiders });
  }

  onDiceWinner(winner: IEligibleRaider): void {
    const modal = this.activeDiceModal();
    if (!modal) return;
    this.activeDiceModal.set(null);
    this.assign(winner.raiderId, modal.item.id, modal.bossId, winner.characterName, modal.item);
  }
}
