import { Component, inject, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { IRaidPlan, RaidParticipantRole } from '@crusaders-bis-list/shared-domain';
import { RaidPlanService } from '../../services/raid-plan.service';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';

@Component({
  selector: 'lib-raid-plan-list',
  imports: [RouterLink],
  templateUrl: './raid-plan-list.component.html',
  styleUrls: ['./raid-plan-list.component.scss'],
})
export class RaidPlanListComponent {
  private readonly service = inject(RaidPlanService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly plansResource = rxResource({
    stream: () => this.service.getAll(),
  });

  readonly loading = this.plansResource.isLoading;

  private readonly allPlans = computed(() => this.plansResource.value() ?? []);
  readonly plans = this.allPlans;

  readonly upcoming = computed(() => {
    const now = new Date();
    return this.allPlans()
      .filter((p) => new Date(p.scheduledAt) >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  });

  readonly past = computed(() => {
    const now = new Date();
    return this.allPlans()
      .filter((p) => new Date(p.scheduledAt) < now)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  });

  readonly pendingDelete = signal<IRaidPlan | null>(null);

  requestDelete(plan: IRaidPlan, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.pendingDelete.set(plan);
  }

  confirmDelete(event: Event): void {
    event.stopPropagation();
    const plan = this.pendingDelete();
    if (!plan) return;
    this.pendingDelete.set(null);
    this.service.delete(plan.id).subscribe({
      next: () => {
        this.plansResource.update((plans) => plans?.filter((p) => p.id !== plan.id));
        this.toast.show('Raidplan verwijderd.');
      },
      error: () => this.toast.show('Verwijderen mislukt.', 'error'),
    });
  }

  abortDelete(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.pendingDelete.set(null);
  }

  raiderCount(plan: IRaidPlan): number {
    return plan.participants.filter((p) => p.role === RaidParticipantRole.RAIDER).length;
  }

  benchCount(plan: IRaidPlan): number {
    return plan.participants.filter((p) => p.role === RaidParticipantRole.BENCH).length;
  }

  absentCount(plan: IRaidPlan): number {
    return plan.participants.filter((p) => p.role === RaidParticipantRole.ABSENT).length;
  }

  discordStatus(plan: IRaidPlan): 'sent' | 'scheduled' | 'none' {
    if (plan.discordSentAt) return 'sent';
    if (plan.scheduledDiscordAt) return 'scheduled';
    return 'none';
  }

  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  daysUntil(date: Date | string): number {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
