import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@crusaders-bis-list/frontend-auth';
import {
  IBossLootView,
  AssignmentStatus,
  IUser,
  UserRole,
  IItem,
  ISeasonConfig,
  UpdateSeasonConfigDto,
  RollSessionInfo,
} from '@crusaders-bis-list/shared-domain';
import { CatalogResponse } from '@crusaders-bis-list/frontend-loot';

export interface AssignLootPayload {
  raiderId: string;
  itemId: string;
  bossId: string;
  raidSeasonId: string;
  status: AssignmentStatus;
  raiderName?: string;
  itemName?: string;
}

export interface RaiderUser {
  id: string;
  userId: string;
  characterName: string;
  wowClass: string;
  spec: string;
  status: string;
}

export interface RaiderReservationEntry {
  /** Reservation ID, or null when receivedOnly=true (no reservation exists). */
  id: string | null;
  itemId: string;
  itemName: string;
  iconUrl?: string;
  secondaryIconUrl?: string;
  itemCategory: string;
  isSuperRare: boolean;
  createdAt: string;
  assignment: { id: string; status: AssignmentStatus; assignedAt: string } | null;
  receivedTier?: AssignmentStatus | null;
  /** True when there is no reservation — only a received-item record. */
  receivedOnly?: boolean;
}

export interface RaiderReservationSummary {
  raiderId: string;
  userId: string;
  characterName: string;
  wowClass: string;
  spec: string;
  reservations: RaiderReservationEntry[];
}

export type AuditAction =
  | 'reservation_created'
  | 'reservation_cancelled'
  | 'reservation_reset_all'
  | 'loot_assigned'
  | 'assignment_updated'
  | 'received_item_marked';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  actorId: string;
  actorName: string;
  raiderName: string | null;
  itemName: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);

  getBase(): string {
    return this.base;
  }

  getCatalog(): Observable<CatalogResponse> {
    return this.http.get<CatalogResponse>(`${this.base}/admin/catalog`);
  }

  getBossLootView(bossId: string, seasonId: string): Observable<IBossLootView> {
    return this.http.get<IBossLootView>(`${this.base}/admin/boss/${bossId}/loot/${seasonId}`);
  }

  assignLoot(payload: AssignLootPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/admin/assignments`, payload);
  }

  updateAssignmentStatus(assignmentId: string, status: AssignmentStatus): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/assignments/${assignmentId}/status`, { status });
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

  updateUserMembership(userId: string, isCrusadersMember: boolean): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/users/${userId}/membership`, { isCrusadersMember });
  }

  getAllReservations(): Observable<RaiderReservationSummary[]> {
    return this.http.get<RaiderReservationSummary[]>(`${this.base}/admin/reservations`);
  }

  cancelReservation(reservationId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/reservations/${reservationId}`);
  }

  deleteReceivedItem(raiderId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/raiders/${raiderId}/received-items/${itemId}`);
  }

  resetAllReservations(reason?: string): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/reservations/reset-all`, { reason });
  }

  resetRaiderProfile(raiderId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/raiders/${raiderId}`);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/users/${userId}`);
  }

  unlinkBnet(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/users/${userId}/bnet`);
  }

  syncCatalog(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/admin/sync`, {});
  }

  resetAndSyncCatalog(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/admin/reset-and-sync`, {});
  }

  getSeasonConfig(): Observable<ISeasonConfig> {
    return this.http.get<ISeasonConfig>(`${this.base}/admin/season-config`);
  }

  updateSeasonConfig(seasonId: string, dto: UpdateSeasonConfigDto): Observable<ISeasonConfig> {
    return this.http.put<ISeasonConfig>(`${this.base}/admin/season-config/${seasonId}`, dto);
  }

  updateItemSuperRare(itemId: string, isSuperRare: boolean): Observable<IItem> {
    return this.http.put<IItem>(`${this.base}/admin/items/${itemId}/super-rare`, { isSuperRare });
  }

  createRollSession(
    itemName: string,
    itemIconUrl: string | undefined,
    secondaryIconUrl: string | undefined,
    difficulty: string | undefined,
    bossId: string,
    raiders: { raiderId: string; name: string; color?: string }[],
  ): Observable<{ sessionId: string }> {
    return this.http.post<{ sessionId: string }>(`${this.base}/roll-sessions`, {
      itemName,
      itemIconUrl,
      secondaryIconUrl,
      difficulty,
      bossId,
      raiders,
    });
  }

  startRoll(sessionId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/roll-sessions/${sessionId}/start`, {});
  }

  getRollSession(sessionId: string): Observable<RollSessionInfo> {
    return this.http.get<RollSessionInfo>(`${this.base}/roll-sessions/${sessionId}`);
  }

  getAuditLog(): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.base}/admin/audit-log`);
  }
}
