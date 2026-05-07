import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@crusaders-bis-list/frontend-auth';
import { IRaidPlan, IRaidSeason, CreateRaidPlanDto, UpdateRaidPlanDto } from '@crusaders-bis-list/shared-domain';

@Injectable({ providedIn: 'root' })
export class RaidPlanService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);

  getAll(): Observable<IRaidPlan[]> {
    return this.http.get<IRaidPlan[]>(`${this.base}/raid-plans`);
  }

  getRaidSeasons(): Observable<IRaidSeason[]> {
    return this.http.get<IRaidSeason[]>(`${this.base}/raid-plans/seasons`);
  }

  getById(id: string): Observable<IRaidPlan> {
    return this.http.get<IRaidPlan>(`${this.base}/raid-plans/${id}`);
  }

  create(dto: CreateRaidPlanDto): Observable<IRaidPlan> {
    return this.http.post<IRaidPlan>(`${this.base}/raid-plans`, dto);
  }

  update(id: string, dto: UpdateRaidPlanDto): Observable<IRaidPlan> {
    return this.http.patch<IRaidPlan>(`${this.base}/raid-plans/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/raid-plans/${id}`);
  }

  sendDiscordNotification(id: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/raid-plans/${id}/notify`, {});
  }
}
