import { Component, inject, OnDestroy, effect, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  IRaidPlan,
  IRaidPlanParticipant,
  RaidParticipantRole,
  RaidDifficulty,
  CreateRaidPlanParticipantDto,
  IBoss,
  WowClass,
  WowSpec,
} from '@crusaders-bis-list/shared-domain';
import { RaidPlanService } from '../../services/raid-plan.service';
import { ToastService, RaiderCardComponent } from '@crusaders-bis-list/frontend-shared-ui';
import { AdminService } from '@crusaders-bis-list/frontend-admin';
import { CompositionAnalysisComponent } from '../composition-analysis/composition-analysis.component';
import { BossPlanningComponent } from '../boss-planning/boss-planning.component';
import { DiscordComposerComponent } from '../discord-composer/discord-composer.component';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

const GROUP_COUNT = 4;

@Component({
  selector: 'lib-raid-plan-detail',
  imports: [
    RouterLink,
    FormsModule,
    CdkDropList,
    CdkDrag,
    RaiderCardComponent,
    CompositionAnalysisComponent,
    BossPlanningComponent,
    DiscordComposerComponent,
  ],
  templateUrl: './raid-plan-detail.component.html',
  styleUrls: ['./raid-plan-detail.component.scss'],
})
export class RaidPlanDetailComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(RaidPlanService);
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  private readonly planId = this.route.snapshot.paramMap.get('id') ?? '';

  // ── Remote data ──────────────────────────────────────────────────────────────

  readonly planResource = rxResource({
    stream: () => this.service.getById(this.planId),
  });

  readonly raidersResource = rxResource({
    stream: () => this.adminService.getAllRaiders(),
  });

  readonly bossesResource = rxResource({
    params: () => this.planResource.value()?.raidSeasonId,
    stream: ({ params: seasonId }) => this.service.getBossesForSeason(seasonId),
  });

  readonly plan = computed((): IRaidPlan | null => this.planResource.value() ?? null);
  readonly bosses = computed((): IBoss[] => this.bossesResource.value() ?? []);
  readonly loading = computed(() => this.planResource.isLoading() || this.raidersResource.isLoading());

  // ── Edit mode ────────────────────────────────────────────────────────────────

  readonly editMode = signal(false);
  readonly saving = signal(false);
  readonly notifying = signal(false);

  readonly editDate = signal('');
  readonly editTime = signal('20:00');
  readonly editDifficulty = signal<RaidDifficulty>(RaidDifficulty.HEROIC);
  readonly editNotes = signal('');

  readonly difficulties = Object.values(RaidDifficulty);

  readonly timeOptions: string[] = (() => {
    const times: string[] = [];
    for (let h = 12; h <= 23; h++) {
      times.push(`${String(h).padStart(2, '0')}:00`);
      times.push(`${String(h).padStart(2, '0')}:30`);
    }
    return times;
  })();

  // Mutable roster arrays — CDK modifies these in place via transferArrayItem / moveItemInArray
  // Protected (not private) so template binding [cdkDropListData]="_bench" works
  protected _groups: IRaidPlanParticipant[][] = Array.from({ length: GROUP_COUNT }, () => []);
  protected _bench: IRaidPlanParticipant[] = [];
  protected _absent: IRaidPlanParticipant[] = [];

  private readonly _rosterVersion = signal(0);
  private _rosterInitialized = false;

  readonly groups = computed(() => {
    this._rosterVersion();
    return this._groups;
  });
  readonly bench = computed(() => {
    this._rosterVersion();
    return this._bench;
  });
  readonly absent = computed(() => {
    this._rosterVersion();
    return this._absent;
  });
  readonly raiders = computed(() => this.groups().flat());

  readonly groupIds = Array.from({ length: GROUP_COUNT }, (_, i) => `group-${i}`);
  readonly allListIds = [...this.groupIds, 'bench-zone', 'absent-zone'];

  // Merge all guild raiders with saved plan assignments once both are loaded
  private readonly _rosterEffect = effect(() => {
    if (this._rosterInitialized) return;
    const plan = this.planResource.value();
    const allRaiders = this.raidersResource.value();
    if (!plan || !allRaiders) return;

    this._rosterInitialized = true;
    const roleMap = new Map(plan.participants.map((p) => [p.userId, p]));
    const merged: IRaidPlanParticipant[] = allRaiders.map((r) => {
      const existing = roleMap.get(r.userId);
      return (
        existing ?? {
          id: `unsaved-${r.userId}`,
          raidPlanId: plan.id,
          userId: r.userId,
          displayName: r.characterName,
          characterName: r.characterName,
          wowClass: r.wowClass as WowClass,
          spec: r.spec as WowSpec,
          role: RaidParticipantRole.RAIDER,
          groupNumber: null,
        }
      );
    });
    this.distributeParticipants(merged);
  });

  private saveTimer?: ReturnType<typeof setTimeout>;

  ngOnDestroy(): void {
    clearTimeout(this.saveTimer);
  }

  // ── Roster distribution ──────────────────────────────────────────────────────

  private distributeParticipants(participants: IRaidPlanParticipant[]): void {
    this._groups = Array.from({ length: GROUP_COUNT }, () => []);
    this._bench = [];
    this._absent = [];
    for (const p of participants) {
      if (p.role === RaidParticipantRole.BENCH) {
        this._bench.push(p);
      } else if (p.role === RaidParticipantRole.ABSENT) {
        this._absent.push(p);
      } else {
        const idx = p.groupNumber != null ? Math.min(p.groupNumber - 1, GROUP_COUNT - 1) : 0;
        this._groups[idx].push(p);
      }
    }
    this._rosterVersion.update((v) => v + 1);
  }

  // ── Drag & drop ──────────────────────────────────────────────────────────────

  onGroupDrop(event: CdkDragDrop<IRaidPlanParticipant[]>, groupIndex: number): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(this._groups[groupIndex], event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        this._groups[groupIndex],
        event.previousIndex,
        event.currentIndex,
      );
    }
    this.notifyRosterChange();
  }

  onBenchDrop(event: CdkDragDrop<IRaidPlanParticipant[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(this._bench, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, this._bench, event.previousIndex, event.currentIndex);
    }
    this.notifyRosterChange();
  }

  onAbsentDrop(event: CdkDragDrop<IRaidPlanParticipant[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(this._absent, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, this._absent, event.previousIndex, event.currentIndex);
    }
    this.notifyRosterChange();
  }

  private notifyRosterChange(): void {
    this._rosterVersion.update((v) => v + 1);
    this.triggerAutoSave();
  }

  // ── Auto-save roster ─────────────────────────────────────────────────────────

  private triggerAutoSave(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveRoster(), 500);
  }

  private saveRoster(): void {
    const plan = this.plan();
    if (!plan) return;
    const participants: CreateRaidPlanParticipantDto[] = [
      ...this._groups.flatMap((group, i) =>
        group.map((p) => ({ userId: p.userId, role: RaidParticipantRole.RAIDER, groupNumber: i + 1 })),
      ),
      ...this._bench.map((p) => ({ userId: p.userId, role: RaidParticipantRole.BENCH })),
      ...this._absent.map((p) => ({ userId: p.userId, role: RaidParticipantRole.ABSENT })),
    ];
    this.saving.set(true);
    this.service.update(plan.id, { participants }).subscribe({
      next: (updated) => {
        this.planResource.set(updated);
        this.saving.set(false);
      },
      error: () => {
        this.toast.show('Auto-save mislukt.', 'error');
        this.saving.set(false);
      },
    });
  }

  // ── Inline edit ──────────────────────────────────────────────────────────────

  enterEdit(): void {
    const p = this.plan();
    if (!p) return;
    const dtLocal = this.toDatetimeLocal(p.scheduledAt);
    this.editDate.set(dtLocal.split('T')[0]);
    this.editTime.set(dtLocal.split('T')[1].substring(0, 5));
    this.editDifficulty.set(p.difficulty);
    this.editNotes.set(p.notes ?? '');
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
  }

  saveEdit(): void {
    const plan = this.plan();
    if (!plan) return;
    this.saving.set(true);
    this.service
      .update(plan.id, {
        difficulty: this.editDifficulty(),
        scheduledAt: new Date(`${this.editDate()}T${this.editTime()}`).toISOString(),
        notes: this.editNotes() || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.planResource.set(updated);
          this.editMode.set(false);
          this.saving.set(false);
        },
        error: () => {
          this.toast.show('Opslaan mislukt.', 'error');
          this.saving.set(false);
        },
      });
  }

  // ── Discord ──────────────────────────────────────────────────────────────────

  onPlanUpdated(updated: IRaidPlan): void {
    this.planResource.set(updated);
  }

  sendToDiscord(): void {
    const plan = this.plan();
    if (!plan) return;
    this.notifying.set(true);
    this.service.sendDiscordNotification(plan.id).subscribe({
      next: () => {
        this.toast.show('Discord bericht verstuurd!');
        this.notifying.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Versturen mislukt.';
        this.toast.show(msg, 'error');
        this.notifying.set(false);
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  trackById(_: number, p: IRaidPlanParticipant): string {
    return p.id;
  }

  private toDatetimeLocal(date: Date | string): string {
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
