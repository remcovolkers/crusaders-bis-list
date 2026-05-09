import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { RaidDifficulty, CreateRaidPlanParticipantDto, IRaidSeason } from '@crusaders-bis-list/shared-domain';
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

  readonly seasonsResource = rxResource({
    stream: () => this.service.getRaidSeasons(),
  });
  readonly seasons = computed((): IRaidSeason[] => this.seasonsResource.value() ?? []);

  // Form fields
  readonly selectedSeasonId = signal('');
  readonly selectedDifficulty = signal<RaidDifficulty>(RaidDifficulty.HEROIC);
  readonly scheduledDate = signal('');
  readonly scheduledTime = signal('20:00');
  readonly scheduledAt = computed(() => {
    if (!this.scheduledDate()) return '';
    return `${this.scheduledDate()}T${this.scheduledTime() || '00:00'}`;
  });
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

  save(): void {
    if (!this.selectedSeasonId() || !this.scheduledAt()) {
      this.toast.show('Vul seizoen en datum in.', 'error');
      return;
    }
    this.saving.set(true);
    const dto = {
      raidSeasonId: this.selectedSeasonId(),
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
