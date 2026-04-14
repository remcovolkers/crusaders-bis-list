import { Injectable, Logger } from '@nestjs/common';
import { SyncRaidCatalogFromBlizzardUseCase } from './sync-raid-catalog.use-case';

@Injectable()
export class ResetCatalogAndSyncUseCase {
  private readonly logger = new Logger(ResetCatalogAndSyncUseCase.name);

  constructor(private readonly syncUseCase: SyncRaidCatalogFromBlizzardUseCase) {}

  async execute(): Promise<{ itemsSynced: number }> {
    this.logger.log('Forcing full re-sync from Blizzard (items updated in-place, UUIDs preserved)…');
    await this.syncUseCase.execute();
    this.logger.log('Re-sync complete.');
    return { itemsSynced: 0 };
  }
}
