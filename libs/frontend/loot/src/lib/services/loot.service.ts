import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  getCatalog(): Observable<CatalogResponse> {
    return this.http.get<CatalogResponse>(`${this.base}/raider/catalog`);
  }

  getMyReservations(seasonId: string): Observable<IReservation[]> {
    return this.http.get<IReservation[]>(`${this.base}/raider/reservations?seasonId=${seasonId}`);
  }

  getMyProfile(): Observable<IRaiderProfile | null> {
    return this.http.get<IRaiderProfile | null>(`${this.base}/raider/my-profile`);
  }

  saveProfile(dto: {
    characterName: string;
    realm?: string;
    wowClass: string;
    spec: string;
  }): Observable<IRaiderProfile> {
    return this.http.post<IRaiderProfile>(`${this.base}/raider/profile`, dto);
  }

  updateProfile(dto: {
    characterName: string;
    realm?: string;
    wowClass: string;
    spec: string;
  }): Observable<IRaiderProfile> {
    return this.http.put<IRaiderProfile>(`${this.base}/raider/profile`, dto);
  }

  getSeasonConfig(): Observable<ISeasonConfig> {
    return this.http.get<ISeasonConfig>(`${this.base}/raider/season-config`);
  }

  reserve(itemId: string, raidSeasonId: string, itemName?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/raider/reservations`, {
      itemId,
      raidSeasonId,
      itemName,
    });
  }

  cancelReservation(reservationId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/raider/reservations/${reservationId}`);
  }

  getMyReceivedItems(): Observable<IReceivedItem[]> {
    return this.http.get<IReceivedItem[]>(`${this.base}/raider/received-items`);
  }

  markItemReceived(itemId: string, tier: AssignmentStatus, itemName?: string): Observable<IReceivedItem> {
    return this.http.post<IReceivedItem>(`${this.base}/raider/received-items`, { itemId, tier, itemName });
  }

  removeReceivedItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/raider/received-items/${id}`);
  }
}
