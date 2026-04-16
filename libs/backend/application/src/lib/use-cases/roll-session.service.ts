import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { RollEvent, RollSessionInfo } from '@crusaders-bis-list/shared-domain';

interface RollRaider {
  raiderId: string;
  name: string;
}

interface RollSession {
  id: string;
  itemName: string;
  itemIconUrl?: string;
  bossId: string;
  raiders: RollRaider[];
  status: 'waiting' | 'rolling' | 'done';
  winner: RollRaider | null;
  subject: Subject<RollEvent>;
  cleanupTimer: ReturnType<typeof setTimeout> | null;
}

@Injectable()
export class RollSessionService {
  private readonly sessions = new Map<string, RollSession>();

  create(itemName: string, itemIconUrl: string | undefined, bossId: string, raiders: RollRaider[]): string {
    const sessionId = crypto.randomUUID();
    const subject = new Subject<RollEvent>();

    const session: RollSession = {
      id: sessionId,
      itemName,
      itemIconUrl,
      bossId,
      raiders,
      status: 'waiting',
      winner: null,
      subject,
      cleanupTimer: null,
    };

    this.sessions.set(sessionId, session);

    // Auto-cleanup after 10 minutes
    session.cleanupTimer = setTimeout(() => this.destroy(sessionId), 10 * 60 * 1000);

    return sessionId;
  }

  getInfo(sessionId: string): RollSessionInfo | null {
    const s = this.sessions.get(sessionId);
    if (!s) return null;
    return { sessionId: s.id, itemName: s.itemName, itemIconUrl: s.itemIconUrl, raiders: s.raiders, status: s.status };
  }

  getStream(sessionId: string): Observable<RollEvent> | null {
    const s = this.sessions.get(sessionId);
    if (!s) return null;
    return s.subject.asObservable();
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
