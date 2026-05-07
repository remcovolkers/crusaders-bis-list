import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IRaidSeason,
  RaidDifficulty,
  RaidParticipantRole,
  CreateRaidPlanParticipantDto,
} from '@crusaders-bis-list/shared-domain';
import { RaidPlanService } from '../../services/raid-plan.service';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';
import { AdminService, RaiderUser } from '@crusaders-bis-list/frontend-admin';

interface ParticipantRow {
  userId: string;
  displayName: string;
  characterName: string;
  role: RaidParticipantRole;
}

@Component({
  selector: 'lib-raid-plan-form',
  imports: [FormsModule],
  templateUrl: './raid-plan-form.component.html',
  styleUrls: ['./raid-plan-form.component.scss'],
})
export class RaidPlanFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(RaidPlanService);
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly isEdit = signal(false);
  readonly planId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly seasons = signal<IRaidSeason[]>([]);
  readonly raiders = signal<RaiderUser[]>([]);

  // Form fields
  readonly selectedSeasonId = signal('');
  readonly selectedDifficulty = signal<RaidDifficulty>(RaidDifficulty.HEROIC);
  readonly scheduledAt = signal('');
  readonly notes = signal('');
  readonly participants = signal<ParticipantRow[]>([]);

  readonly difficulties = Object.values(RaidDifficulty);
  readonly roles = Object.values(RaidParticipantRole);

  readonly availableUsers = computed(() => {
    const current = this.participants().map((p) => p.userId);
    return this.raiders().filter((r) => !current.includes(r.userId));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.planId.set(id);
    }

    this.service.getRaidSeasons().subscribe({
      next: (seasons) => this.seasons.set(seasons),
    });

    this.adminService.getAllRaiders().subscribe({
      next: (raiders) => {
        this.raiders.set(raiders);
        if (!this.isEdit()) this.loading.set(false);
      },
    });

    const editId = this.planId();
    if (this.isEdit() && editId) {
      this.service.getById(editId).subscribe({
        next: (plan) => {
          this.selectedSeasonId.set(plan.raidSeasonId);
          this.selectedDifficulty.set(plan.difficulty);
          this.scheduledAt.set(this.toDatetimeLocal(plan.scheduledAt));
          this.notes.set(plan.notes ?? '');
          this.participants.set(
            plan.participants.map((p) => ({
              userId: p.userId,
              displayName: p.displayName,
              characterName: p.characterName,
              role: p.role,
            })),
          );
          this.loading.set(false);
        },
        error: () => {
          this.toast.show('Kon raidplan niet laden.', 'error');
          this.loading.set(false);
        },
      });
    }
  }

  addParticipant(userId: string): void {
    if (!userId) return;
    const raider = this.raiders().find((r) => r.userId === userId);
    if (!raider) return;
    this.participants.update((rows) => [
      ...rows,
      {
        userId: raider.userId,
        displayName: raider.characterName,
        characterName: raider.characterName,
        role: RaidParticipantRole.RAIDER,
      },
    ]);
  }

  removeParticipant(userId: string): void {
    this.participants.update((rows) => rows.filter((r) => r.userId !== userId));
  }

  setRole(userId: string, role: RaidParticipantRole): void {
    this.participants.update((rows) => rows.map((r) => (r.userId === userId ? { ...r, role } : r)));
  }

  save(): void {
    if (!this.selectedSeasonId() || !this.scheduledAt()) {
      this.toast.show('Vul alle verplichte velden in.', 'error');
      return;
    }

    this.saving.set(true);
    const dto = {
      raidSeasonId: this.selectedSeasonId(),
      difficulty: this.selectedDifficulty(),
      scheduledAt: new Date(this.scheduledAt()).toISOString(),
      notes: this.notes() || undefined,
      participants: this.participants().map((p): CreateRaidPlanParticipantDto => ({ userId: p.userId, role: p.role })),
    };

    const id = this.planId();
    const request$ = this.isEdit() && id ? this.service.update(id, dto) : this.service.create(dto);

    request$.subscribe({
      next: (plan) => {
        this.toast.show(this.isEdit() ? 'Raidplan bijgewerkt!' : 'Raidplan aangemaakt!');
        this.router.navigate(['..', plan.id], { relativeTo: this.route });
      },
      error: () => {
        this.toast.show('Opslaan mislukt.', 'error');
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(this.isEdit() ? ['../..'] : ['..'], { relativeTo: this.route });
  }

  private toDatetimeLocal(date: Date | string): string {
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
