import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '@crusaders-bis-list/frontend-auth';
import {
  IRaidPlan,
  IRaidSeason,
  IBoss,
  CreateRaidPlanDto,
  UpdateRaidPlanDto,
  IRaidPlanBossNote,
  UpsertBossNoteDto,
  AddBossResourceDto,
  ScheduleDiscordDto,
} from '@crusaders-bis-list/shared-domain';

@Injectable({ providedIn: 'root' })
export class RaidPlanService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);

  getAll() {
    return this.http.get<IRaidPlan[]>(`${this.base}/raid-plans`);
  }

  getRaidSeasons() {
    return this.http.get<IRaidSeason[]>(`${this.base}/raid-plans/seasons`);
  }

  getBossesForSeason(seasonId: string) {
    return this.http.get<IBoss[]>(`${this.base}/raid-plans/seasons/${seasonId}/bosses`);
  }

  getById(id: string) {
    return this.http.get<IRaidPlan>(`${this.base}/raid-plans/${id}`);
  }

  create(dto: CreateRaidPlanDto) {
    return this.http.post<IRaidPlan>(`${this.base}/raid-plans`, dto);
  }

  update(id: string, dto: UpdateRaidPlanDto) {
    return this.http.patch<IRaidPlan>(`${this.base}/raid-plans/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/raid-plans/${id}`);
  }

  sendDiscordNotification(id: string) {
    return this.http.post<{ ok: boolean }>(`${this.base}/raid-plans/${id}/notify`, {});
  }

  scheduleDiscordNotification(id: string, dto: ScheduleDiscordDto) {
    return this.http.patch<IRaidPlan>(`${this.base}/raid-plans/${id}/discord-schedule`, dto);
  }

  // ── Boss notes ────────────────────────────────────────────────────────────────

  getBossNotes(raidPlanId: string) {
    return this.http.get<IRaidPlanBossNote[]>(`${this.base}/raid-plans/${raidPlanId}/bosses`);
  }

  upsertBossNote(raidPlanId: string, bossId: string, dto: UpsertBossNoteDto) {
    return this.http.patch<IRaidPlanBossNote>(`${this.base}/raid-plans/${raidPlanId}/bosses/${bossId}`, dto);
  }

  addBossResource(raidPlanId: string, bossId: string, dto: AddBossResourceDto) {
    return this.http.post<IRaidPlanBossNote>(`${this.base}/raid-plans/${raidPlanId}/bosses/${bossId}/resources`, dto);
  }

  deleteBossResource(raidPlanId: string, bossId: string, resourceId: string) {
    return this.http.delete<void>(`${this.base}/raid-plans/${raidPlanId}/bosses/${bossId}/resources/${resourceId}`);
  }
}
