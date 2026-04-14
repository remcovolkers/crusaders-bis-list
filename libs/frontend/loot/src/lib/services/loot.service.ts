import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@crusaders-bis-list/frontend-auth';
import { IBoss, IItem, IRaidSeason, IReservation } from '@crusaders-bis-list/shared-domain';

export interface CatalogResponse {
  season: IRaidSeason;
  bosses: (IBoss & { items: IItem[] })[];
}

@Injectable({ providedIn: 'root' })
export class LootService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private base: string,
  ) {}

  getCatalog(): Observable<CatalogResponse> {
    return this.http.get<CatalogResponse>(`${this.base}/raider/catalog`);
  }

  getMyReservations(seasonId: string): Observable<IReservation[]> {
    return this.http.get<IReservation[]>(`${this.base}/raider/reservations?seasonId=${seasonId}`);
  }

  reserve(itemId: string, raidSeasonId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/raider/reservations`, {
      itemId,
      raidSeasonId,
    });
  }

  cancelReservation(reservationId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/raider/reservations/${reservationId}`);
  }
}
