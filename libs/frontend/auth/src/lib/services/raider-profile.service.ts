import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';

@Injectable({ providedIn: 'root' })
export class RaiderProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  async hasProfile(): Promise<boolean> {
    try {
      const profile = await firstValueFrom(this.http.get(`${this.apiUrl}/raider/my-profile`));
      return !!profile;
    } catch {
      return false;
    }
  }
}
