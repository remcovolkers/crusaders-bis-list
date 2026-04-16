import { Component, inject, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '@crusaders-bis-list/frontend-auth';
import { WheelOfFortuneComponent } from '@crusaders-bis-list/frontend-shared-ui';
import { RollEvent, RollSessionInfo } from '@crusaders-bis-list/shared-domain';

@Component({
  selector: 'app-roll-spectator',
  standalone: true,
  imports: [WheelOfFortuneComponent],
  templateUrl: './roll-spectator.component.html',
  styleUrl: './roll-spectator.component.scss',
})
export class RollSpectatorComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL);

  readonly sessionInfo = signal<RollSessionInfo | null>(null);
  readonly displayName = signal('...');
  readonly rolling = signal(false);
  readonly winner = signal<{ name: string; raiderId: string } | null>(null);
  readonly notFound = signal(false);

  readonly wheelRaiders = computed(() => this.sessionInfo()?.raiders ?? []);

  private sseSource: EventSource | null = null;

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    if (!sessionId) {
      this.notFound.set(true);
      return;
    }

    this.http.get<RollSessionInfo>(`${this.apiBase}/roll-sessions/${sessionId}`).subscribe({
      next: (info) => {
        this.sessionInfo.set(info);
        this.displayName.set(info.raiders[0]?.name ?? '...');
        this.connectSse(sessionId);
      },
      error: () => this.notFound.set(true),
    });
  }

  private connectSse(sessionId: string): void {
    this.sseSource = new EventSource(`${this.apiBase}/roll-sessions/${sessionId}/stream`);

    this.sseSource.onmessage = (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as RollEvent;
      if (event.type === 'tick') {
        this.rolling.set(true);
        this.displayName.set(event.name);
      } else if (event.type === 'winner') {
        this.rolling.set(false);
        this.displayName.set(event.name);
        this.winner.set({ name: event.name, raiderId: event.raiderId ?? '' });
        this.sseSource?.close();
      }
    };

    this.sseSource.onerror = () => {
      // Session may have ended or not started yet — silently close
      this.sseSource?.close();
      this.rolling.set(false);
    };
  }

  ngOnDestroy(): void {
    this.sseSource?.close();
  }
}
