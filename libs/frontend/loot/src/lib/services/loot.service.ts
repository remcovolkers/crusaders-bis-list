import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '@crusaders-bis-list/frontend-auth';
import {
  IBoss,
  IItem,
  IRaidSeason,
  IReservation,
  ISeasonConfig,
  IRaiderProfile,
  IReceivedItem,
  AssignmentStatus,
} from '@crusaders-bis-list/shared-domain';

export interface CatalogResponse {
  season: IRaidSeason;
  bosses: (IBoss & { items: IItem[] })[];
}

@Injectable({ providedIn: 'root' })
export class LootService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);

  getCatalog() {
    return this.http.get<CatalogResponse>(`${this.base}/raider/catalog`);
  }

  getMyReservations(seasonId: string) {
    return this.http.get<IReservation[]>(`${this.base}/raider/reservations?seasonId=${seasonId}`);
  }

  getMyProfile() {
    return this.http.get<IRaiderProfile | null>(`${this.base}/raider/my-profile`);
  }

  saveProfile(dto: { characterName: string; realm?: string; wowClass: string; spec: string }) {
    return this.http.post<IRaiderProfile>(`${this.base}/raider/profile`, dto);
  }

  updateProfile(dto: { characterName: string; realm?: string; wowClass: string; spec: string }) {
    return this.http.put<IRaiderProfile>(`${this.base}/raider/profile`, dto);
  }

  getSeasonConfig() {
    return this.http.get<ISeasonConfig>(`${this.base}/raider/season-config`);
  }

  reserve(itemId: string, raidSeasonId: string, itemName?: string, receivedTier?: AssignmentStatus) {
    return this.http.post<{ message: string }>(`${this.base}/raider/reservations`, {
      itemId,
      raidSeasonId,
      itemName,
      ...(receivedTier ? { receivedTier } : {}),
    });
  }

  cancelReservation(reservationId: string) {
    return this.http.delete<void>(`${this.base}/raider/reservations/${reservationId}`);
  }

  getMyReceivedItems() {
    return this.http.get<IReceivedItem[]>(`${this.base}/raider/received-items`);
  }

  markItemReceived(itemId: string, tier: AssignmentStatus, itemName?: string) {
    return this.http.post<IReceivedItem>(`${this.base}/raider/received-items`, { itemId, tier, itemName });
  }

  removeReceivedItem(id: string) {
    return this.http.delete<void>(`${this.base}/raider/received-items/${id}`);
  }

  getItemPeers(itemId: string) {
    return this.http.get<{ characterName: string; receivedTier: AssignmentStatus | null }[]>(
      `${this.base}/raider/item-peers/${itemId}`,
    );
  }

  getItemPeerCounts() {
    return this.http.get<Record<string, Record<AssignmentStatus, number>>>(`${this.base}/raider/item-peer-counts`);
  }
}
