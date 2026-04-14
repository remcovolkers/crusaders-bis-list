import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@crusaders-bis-list/frontend-auth';
import { IBossLootView, AssignmentStatus, IUser, UserRole } from '@crusaders-bis-list/shared-domain';
import { CatalogResponse } from '@crusaders-bis-list/frontend-loot';

export interface AssignLootPayload {
  raiderId: string;
  itemId: string;
  bossId: string;
  raidSeasonId: string;
  status: AssignmentStatus;
}

export interface RaiderUser {
  id: string;
  userId: string;
  characterName: string;
  wowClass: string;
  spec: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private base: string,
  ) {}

  getCatalog(): Observable<CatalogResponse> {
    return this.http.get<CatalogResponse>(`${this.base}/admin/catalog`);
  }

  getBossLootView(bossId: string, seasonId: string): Observable<IBossLootView> {
    return this.http.get<IBossLootView>(`${this.base}/admin/boss/${bossId}/loot/${seasonId}`);
  }

  assignLoot(payload: AssignLootPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/admin/assignments`, payload);
  }

  updateAssignmentStatus(
    assignmentId: string,
    status: AssignmentStatus,
  ): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/assignments/${assignmentId}/status`, {
      status,
    });
  }

  getAllRaiders(): Observable<RaiderUser[]> {
    return this.http.get<RaiderUser[]>(`${this.base}/admin/raiders`);
  }

  getAllUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.base}/admin/users`);
  }

  updateUserRoles(userId: string, roles: UserRole[]): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/users/${userId}/roles`, { roles });
  }
}
