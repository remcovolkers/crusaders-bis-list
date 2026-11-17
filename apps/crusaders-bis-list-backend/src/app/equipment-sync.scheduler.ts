import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { SyncTeamEquipmentUseCase } from '@crusaders-bis-list/backend-application';

/**
 * Keeps every raider's worn gear (and with it the "already have" state of reserved / chased items) in step with the
 * Blizzard armory, so lists stay correct for officers and teammates even when a raider does not open the site.
 *
 * EQUIPMENT_SYNC_INTERVAL_MINUTES: default 30 in production, off elsewhere (set it to enable locally); 0 disables.
 * Lives in the API app only (not in the Discord bot, which shares the application module).
 */
@Injectable()
export class EquipmentSyncScheduler implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(EquipmentSyncScheduler.name);
  private startTimer?: ReturnType<typeof setTimeout>;
  private intervalId?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(private readonly syncTeam: SyncTeamEquipmentUseCase) {}

  onApplicationBootstrap(): void {
    const fallback = process.env['NODE_ENV'] === 'production' ? 30 : 0;
    const minutes = Number(process.env['EQUIPMENT_SYNC_INTERVAL_MINUTES'] ?? fallback);
    if (!Number.isFinite(minutes) || minutes <= 0) return;

    const everyMs = minutes * 60_000;
    // First run shortly after boot (not during it), then on the interval
    this.startTimer = setTimeout(() => void this.run(everyMs), 2 * 60_000);
    this.intervalId = setInterval(() => void this.run(everyMs), everyMs);
    this.logger.log(`Gear sync scheduled every ${minutes} min.`);
  }

  onApplicationShutdown(): void {
    if (this.startTimer) clearTimeout(this.startTimer);
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private async run(everyMs: number): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      // Raiders who just opened the site were synced by that visit: skip anyone synced in the last interval
      const summary = await this.syncTeam.execute(null, { minAgeMs: Math.max(60_000, everyMs - 60_000) });
      this.logger.log(
        `Gear sync: ${summary.refreshed}/${summary.raiders} raiders refreshed, ${summary.updates} item update(s).`,
      );
    } catch (err) {
      this.logger.error('Gear sync failed', err as Error);
    } finally {
      this.running = false;
    }
  }
}
