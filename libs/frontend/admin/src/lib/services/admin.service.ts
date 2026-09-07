import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '@crusaders-bis-list/frontend-auth';
import {
  IBossLootView,
  AssignmentStatus,
  IUser,
  UserRole,
  Team,
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
  team: Team;
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

  getCatalog(team?: Team) {
    const suffix = team ? `?team=${team}` : '';
    return this.http.get<CatalogResponse>(`${this.base}/admin/catalog${suffix}`);
  }

  getBossLootView(bossId: string, seasonId: string, team?: Team) {
    const suffix = team ? `?team=${team}` : '';
    return this.http.get<IBossLootView>(`${this.base}/admin/boss/${bossId}/loot/${seasonId}${suffix}`);
  }

  assignLoot(payload: AssignLootPayload) {
    return this.http.post<{ message: string }>(`${this.base}/admin/assignments`, payload);
  }

  updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
    return this.http.post<void>(`${this.base}/admin/assignments/${assignmentId}/status`, { status });
  }

  getAllRaiders(team?: Team) {
    const suffix = team ? `?team=${team}` : '';
    return this.http.get<RaiderUser[]>(`${this.base}/admin/raiders${suffix}`);
  }

  getAllUsers(team?: Team) {
    const suffix = team ? `?team=${team}` : '';
    return this.http.get<IUser[]>(`${this.base}/admin/users${suffix}`);
  }

  updateUserRoles(userId: string, roles: UserRole[]) {
    return this.http.post<void>(`${this.base}/admin/users/${userId}/roles`, { roles });
  }

  updateUserTeam(userId: string, team: Team) {
    return this.http.post<void>(`${this.base}/admin/users/${userId}/team`, { team });
  }

  getAllReservations(team?: Team) {
    const suffix = team ? `?team=${team}` : '';
    return this.http.get<RaiderReservationSummary[]>(`${this.base}/admin/reservations${suffix}`);
  }

  cancelReservation(reservationId: string) {
    return this.http.delete<void>(`${this.base}/admin/reservations/${reservationId}`);
  }

  deleteReceivedItem(raiderId: string, itemId: string) {
    return this.http.delete<void>(`${this.base}/admin/raiders/${raiderId}/received-items/${itemId}`);
  }

  resetAllReservations(reason?: string) {
    return this.http.post<void>(`${this.base}/admin/reservations/reset-all`, { reason });
  }

  resetRaiderProfile(raiderId: string) {
    return this.http.delete<void>(`${this.base}/admin/raiders/${raiderId}`);
  }

  deleteUser(userId: string) {
    return this.http.delete<void>(`${this.base}/admin/users/${userId}`);
  }

  unlinkBnet(userId: string) {
    return this.http.delete<void>(`${this.base}/admin/users/${userId}/bnet`);
  }

  syncCatalog() {
    return this.http.post<{ message: string }>(`${this.base}/admin/sync`, {});
  }

  resetAndSyncCatalog() {
    return this.http.post<{ message: string }>(`${this.base}/admin/reset-and-sync`, {});
  }

  getSeasonConfig(team?: Team) {
    const suffix = team ? `?team=${team}` : '';
    return this.http.get<ISeasonConfig>(`${this.base}/admin/season-config${suffix}`);
  }

  updateSeasonConfig(seasonId: string, dto: UpdateSeasonConfigDto, team?: Team) {
    const suffix = team ? `?team=${team}` : '';
    return this.http.put<ISeasonConfig>(`${this.base}/admin/season-config/${seasonId}${suffix}`, dto);
  }

  updateItemSuperRare(itemId: string, isSuperRare: boolean, team?: Team) {
    const suffix = team ? `?team=${team}` : '';
    return this.http.put<IItem>(`${this.base}/admin/items/${itemId}/super-rare${suffix}`, { isSuperRare });
  }

  createRollSession(
    itemName: string,
    itemIconUrl: string | undefined,
    secondaryIconUrl: string | undefined,
    difficulty: string | undefined,
    bossId: string,
    raiders: { raiderId: string; name: string; color?: string }[],
  ) {
    return this.http.post<{ sessionId: string }>(`${this.base}/roll-sessions`, {
      itemName,
      itemIconUrl,
      secondaryIconUrl,
      difficulty,
      bossId,
      raiders,
    });
  }

  startRoll(sessionId: string) {
    return this.http.post<void>(`${this.base}/roll-sessions/${sessionId}/start`, {});
  }

  getRollSession(sessionId: string) {
    return this.http.get<RollSessionInfo>(`${this.base}/roll-sessions/${sessionId}`);
  }

  getAuditLog(team?: Team) {
    const suffix = team ? `?team=${team}` : '';
    return this.http.get<AuditLogEntry[]>(`${this.base}/admin/audit-log${suffix}`);
  }
}
