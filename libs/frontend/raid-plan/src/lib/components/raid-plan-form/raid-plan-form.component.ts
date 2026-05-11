import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { RaidDifficulty, CreateRaidPlanParticipantDto } from '@crusaders-bis-list/shared-domain';
import { RaidPlanService } from '../../services/raid-plan.service';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';

@Component({
  selector: 'lib-raid-plan-form',
  imports: [FormsModule],
  templateUrl: './raid-plan-form.component.html',
  styleUrls: ['./raid-plan-form.component.scss'],
})
export class RaidPlanFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(RaidPlanService);
  private readonly toast = inject(ToastService);

  readonly saving = signal(false);

  // Load bosses for the active season (no season selection needed)
  readonly bossesResource = rxResource({
    stream: () => this.service.getBossesForActiveSeason(),
  });

  /** Unique raid names within the active season, in encounter order */
  readonly raidNames = computed((): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const b of this.bossesResource.value() ?? []) {
      if (b.raidName && !seen.has(b.raidName)) {
        seen.add(b.raidName);
        result.push(b.raidName);
      }
    }
    return result;
  });

  /** Selected raid names (multi-select chips) */
  readonly selectedRaids = signal<Set<string>>(new Set());

  /** Derived raidName sent to backend */
  readonly derivedRaidName = computed(() => [...this.selectedRaids()].join(' + '));

  toggleRaid(name: string): void {
    this.selectedRaids.update((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  isRaidSelected(name: string): boolean {
    return this.selectedRaids().has(name);
  }

  // ── Other form fields ─────────────────────────────────────────────────────
  readonly selectedDifficulty = signal<RaidDifficulty>(RaidDifficulty.HEROIC);
  readonly scheduledDate = signal('');
  readonly scheduledTime = signal('20:00');
  readonly notes = signal('');

  readonly difficulties = Object.values(RaidDifficulty);

  readonly timeOptions: string[] = (() => {
    const times: string[] = [];
    for (let h = 12; h <= 23; h++) {
      times.push(`${String(h).padStart(2, '0')}:00`);
      times.push(`${String(h).padStart(2, '0')}:30`);
    }
    return times;
  })();

  readonly canSave = computed(() => this.selectedRaids().size > 0 && !!this.scheduledDate());

  save(): void {
    if (!this.canSave()) {
      this.toast.show('Selecteer minstens één raid en een datum.', 'error');
      return;
    }
    this.saving.set(true);
    const dto = {
      // raidSeasonId omitted — backend uses active season
      raidName: this.derivedRaidName(),
      difficulty: this.selectedDifficulty(),
      scheduledAt: new Date(`${this.scheduledDate()}T${this.scheduledTime()}`).toISOString(),
      notes: this.notes() || undefined,
      participants: [] as CreateRaidPlanParticipantDto[],
    };
    this.service.create(dto).subscribe({
      next: (plan) => {
        this.toast.show('Raidplan aangemaakt!');
        this.router.navigate(['..', plan.id], { relativeTo: this.route });
      },
      error: () => {
        this.toast.show('Opslaan mislukt.', 'error');
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
