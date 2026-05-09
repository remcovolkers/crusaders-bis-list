import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';

@Injectable({ providedIn: 'root' })
export class RaiderProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  hasProfile(): Observable<boolean> {
    return this.http.get(`${this.apiUrl}/raider/my-profile`).pipe(
      map((profile) => !!profile),
      catchError(() => of(false)),
    );
  }
}
