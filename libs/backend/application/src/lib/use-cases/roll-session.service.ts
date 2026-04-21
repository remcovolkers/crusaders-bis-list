import { Injectable } from '@nestjs/common';
import { Subject, Observable, concat, of } from 'rxjs';
import { RollEvent, RollSessionInfo, SpectatorInfo } from '@crusaders-bis-list/shared-domain';

interface RollRaider {
  raiderId: string;
  name: string;
  color?: string;
}

interface RollSession {
  id: string;
  itemName: string;
  itemIconUrl?: string;
  secondaryIconUrl?: string;
  difficulty?: string;
  bossId: string;
  raiders: RollRaider[];
  status: 'waiting' | 'rolling' | 'done';
  winner: RollRaider | null;
  subject: Subject<RollEvent>;
  cleanupTimer: ReturnType<typeof setTimeout> | null;
  spectators: Map<string, SpectatorInfo>;
}

@Injectable()
export class RollSessionService {
  private readonly sessions = new Map<string, RollSession>();

  create(
    itemName: string,
    itemIconUrl: string | undefined,
    secondaryIconUrl: string | undefined,
    difficulty: string | undefined,
    bossId: string,
    raiders: RollRaider[],
  ): string {
    const sessionId = crypto.randomUUID();
    const subject = new Subject<RollEvent>();

    const session: RollSession = {
      id: sessionId,
      itemName,
      itemIconUrl,
      secondaryIconUrl,
      difficulty,
      bossId,
      raiders,
      status: 'waiting',
      winner: null,
      subject,
      cleanupTimer: null,
      spectators: new Map(),
    };

    this.sessions.set(sessionId, session);

    // Auto-cleanup after 10 minutes
    session.cleanupTimer = setTimeout(() => this.destroy(sessionId), 10 * 60 * 1000);

    return sessionId;
  }

  getInfo(sessionId: string): RollSessionInfo | null {
    const s = this.sessions.get(sessionId);
    if (!s) return null;
    return {
      sessionId: s.id,
      itemName: s.itemName,
      itemIconUrl: s.itemIconUrl,
      secondaryIconUrl: s.secondaryIconUrl,
      difficulty: s.difficulty,
      raiders: s.raiders,
      status: s.status,
      spectators: [...s.spectators.values()],
      winner: s.winner ? { raiderId: s.winner.raiderId, name: s.winner.name } : null,
    };
  }

  addSpectator(sessionId: string, spectatorId: string, displayName: string): void {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    s.spectators.set(spectatorId, { displayName });
    if (!s.subject.isStopped) {
      s.subject.next({ type: 'spectators', name: '', spectators: [...s.spectators.values()] });
    }
  }

  removeSpectator(sessionId: string, spectatorId: string): void {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    s.spectators.delete(spectatorId);
    if (!s.subject.isStopped) {
      s.subject.next({ type: 'spectators', name: '', spectators: [...s.spectators.values()] });
    }
  }

  getStream(sessionId: string): Observable<RollEvent> | null {
    const s = this.sessions.get(sessionId);
    if (!s) return null;

    const currentSpectators$ = of<RollEvent>({
      type: 'spectators',
      name: '',
      spectators: [...s.spectators.values()],
    });

    // Session already finished: immediately replay winner so late joiners see the result
    if (s.status === 'done' && s.winner) {
      return concat(
        currentSpectators$,
        of<RollEvent>({ type: 'winner', name: s.winner.name, raiderId: s.winner.raiderId }),
      );
    }

    // Waiting or rolling: prepend current spectator snapshot so new joiners see who's watching,
    // then continue with the live subject (mid-roll joiners will catch remaining ticks + winner)
    return concat(currentSpectators$, s.subject.asObservable());
  }

  startRoll(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'waiting') return false;

    session.status = 'rolling';
    const names = session.raiders.map((r) => r.name);
    const totalTicks = 30;
    const baseInterval = 60;
    let tick = 0;

    const doTick = (): void => {
      tick++;
      const progress = tick / totalTicks;
      const delay = baseInterval + Math.pow(progress, 2) * 600;
      const current = names[tick % names.length];

      session.subject.next({ type: 'tick', name: current });

      if (tick >= totalTicks) {
        const winnerIndex = Math.floor(Math.random() * session.raiders.length);
        const winner = session.raiders[winnerIndex];
        session.winner = winner;
        session.status = 'done';
        session.subject.next({ type: 'winner', name: winner.name, raiderId: winner.raiderId });
        session.subject.complete();
        return;
      }

      setTimeout(doTick, delay);
    };

    setTimeout(doTick, baseInterval);
    return true;
  }

  destroy(sessionId: string): void {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    if (s.cleanupTimer) clearTimeout(s.cleanupTimer);
    if (!s.subject.closed) s.subject.complete();
    this.sessions.delete(sessionId);
  }
}
