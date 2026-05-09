import { Component, inject, OnDestroy, computed, effect, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { API_URL, AuthStateService } from '@crusaders-bis-list/frontend-auth';
import { WheelOfFortuneComponent } from '@crusaders-bis-list/frontend-shared-ui';
import { RollEvent, RollSessionInfo, SpectatorInfo } from '@crusaders-bis-list/shared-domain';

@Component({
  selector: 'lib-roll-spectator',
  standalone: true,
  imports: [WheelOfFortuneComponent],
  templateUrl: './roll-spectator.component.html',
  styleUrl: './roll-spectator.component.scss',
})
export class RollSpectatorComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_URL);
  private readonly authState = inject(AuthStateService);

  private readonly sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';

  private readonly sessionResource = rxResource({
    params: () => this.sessionId || undefined,
    stream: ({ params: id }) => this.http.get<RollSessionInfo>(`${this.apiBase}/roll-sessions/${id}`),
  });

  readonly sessionInfo = signal<RollSessionInfo | null>(null);
  readonly displayName = signal('...');
  readonly rolling = signal(false);
  readonly winner = signal<{ name: string; raiderId: string } | null>(null);
  readonly notFound = computed(() => !this.sessionId || this.sessionResource.error() !== undefined);
  readonly spectators = signal<SpectatorInfo[]>([]);

  readonly wheelRaiders = computed(() => this.sessionInfo()?.raiders ?? []);

  private sseSource: EventSource | null = null;
  private _sseStarted = false;

  constructor() {
    effect(() => {
      const info = this.sessionResource.value();
      if (!info || this._sseStarted) return;
      this.sessionInfo.set(info);

      if (info.status === 'done' && info.winner) {
        this.winner.set({ name: info.winner.name, raiderId: info.winner.raiderId });
        this.displayName.set(info.winner.name);
        return;
      }

      this.spectators.set(info.spectators ?? []);
      this.displayName.set(info.raiders[0]?.name ?? '...');

      if (info.status === 'rolling') {
        this.rolling.set(true);
      }

      this._sseStarted = true;
      this.connectSse(this.sessionId);
    });
  }

  private connectSse(sessionId: string): void {
    const myDisplayName = this.authState.user()?.displayName ?? 'Oningelogde gebruiker';
    const url = `${this.apiBase}/roll-sessions/${sessionId}/stream?displayName=${encodeURIComponent(myDisplayName)}`;
    this.sseSource = new EventSource(url);

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
      } else if (event.type === 'spectators') {
        this.spectators.set(event.spectators ?? []);
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
