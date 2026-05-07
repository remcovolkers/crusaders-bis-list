import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IRaidPlan, IRaidPlanParticipant, RaidParticipantRole } from '@crusaders-bis-list/shared-domain';
import { RaidPlanService } from '../../services/raid-plan.service';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';

@Component({
  selector: 'lib-raid-plan-detail',
  imports: [RouterLink],
  templateUrl: './raid-plan-detail.component.html',
  styleUrls: ['./raid-plan-detail.component.scss'],
})
export class RaidPlanDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(RaidPlanService);
  private readonly toast = inject(ToastService);

  readonly plan = signal<IRaidPlan | null>(null);
  readonly loading = signal(true);
  readonly notifying = signal(false);

  readonly raiders = computed(
    () => this.plan()?.participants.filter((p) => p.role === RaidParticipantRole.RAIDER) ?? [],
  );
  readonly bench = computed(() => this.plan()?.participants.filter((p) => p.role === RaidParticipantRole.BENCH) ?? []);
  readonly absent = computed(
    () => this.plan()?.participants.filter((p) => p.role === RaidParticipantRole.ABSENT) ?? [],
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.service.getById(id).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.loading.set(false);
      },
      error: () => {
        this.toast.show('Kon raidplan niet laden.', 'error');
        this.loading.set(false);
      },
    });
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
}
