import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SEASON_CONFIG_REPOSITORY,
  ISeasonConfigRepository,
  RAID_CATALOG_REPOSITORY,
  IRaidCatalogRepository,
} from '@crusaders-bis-list/backend-domain';
import { ISeasonConfig, UpdateSeasonConfigDto } from '@crusaders-bis-list/shared-domain';

@Injectable()
export class GetSeasonConfigUseCase {
  constructor(
    @Inject(SEASON_CONFIG_REPOSITORY)
    private readonly configRepo: ISeasonConfigRepository,
    @Inject(RAID_CATALOG_REPOSITORY)
    private readonly catalogRepo: IRaidCatalogRepository,
  ) {}

  async execute(seasonId?: string): Promise<ISeasonConfig> {
    let id = seasonId;
    if (!id) {
      const season = await this.catalogRepo.findActiveSeason();
      if (!season) throw new NotFoundException('No active season found.');
      id = season.id;
    }
    return this.configRepo.findOrCreateDefault(id);
  }
}

@Injectable()
export class UpdateSeasonConfigUseCase {
  constructor(
    @Inject(SEASON_CONFIG_REPOSITORY)
    private readonly configRepo: ISeasonConfigRepository,
  ) {}

  async execute(seasonId: string, dto: UpdateSeasonConfigDto): Promise<ISeasonConfig> {
    const config = await this.configRepo.findOrCreateDefault(seasonId);
    return this.configRepo.update(config.id, dto);
  }
}
