import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IRaidPlan } from '@crusaders-bis-list/shared-domain';
import { RaidPlanService } from '../../services/raid-plan.service';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';

@Component({
  selector: 'lib-raid-plan-list',
  imports: [RouterLink],
  templateUrl: './raid-plan-list.component.html',
  styleUrls: ['./raid-plan-list.component.scss'],
})
export class RaidPlanListComponent implements OnInit {
  private readonly service = inject(RaidPlanService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly plans = signal<IRaidPlan[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.service.getAll().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: () => {
        this.toast.show('Kon raidplannen niet laden.', 'error');
        this.loading.set(false);
      },
    });
  }

  delete(plan: IRaidPlan, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Raidplan voor ${plan.raidName} verwijderen?`)) return;
    this.service.delete(plan.id).subscribe({
      next: () => {
        this.plans.update((plans) => plans.filter((p) => p.id !== plan.id));
        this.toast.show('Raidplan verwijderd.');
      },
      error: () => this.toast.show('Verwijderen mislukt.', 'error'),
    });
  }

  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }
}
