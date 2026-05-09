import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '@crusaders-bis-list/frontend-auth';

export interface FeedbackEntry {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  message: string;
  pageContext: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);

  submit(message: string, pageContext: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/feedback`, { message, pageContext });
  }

  getAll(): Observable<FeedbackEntry[]> {
    return this.http.get<FeedbackEntry[]>(`${this.base}/feedback`);
  }

  resolve(id: string): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.base}/feedback/${id}/resolve`, {});
  }

  unresolve(id: string): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.base}/feedback/${id}/unresolve`, {});
  }
}
