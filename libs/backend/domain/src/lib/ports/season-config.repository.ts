import { ISeasonConfig, UpdateSeasonConfigDto } from '@crusaders-bis-list/shared-domain';

export interface ISeasonConfigRepository {
  findBySeasonId(seasonId: string): Promise<ISeasonConfig | null>;
  findOrCreateDefault(seasonId: string): Promise<ISeasonConfig>;
  update(id: string, dto: UpdateSeasonConfigDto): Promise<ISeasonConfig>;
}

export const SEASON_CONFIG_REPOSITORY = Symbol('ISeasonConfigRepository');
