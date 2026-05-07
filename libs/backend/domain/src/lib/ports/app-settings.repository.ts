import { IAppSettings, UpdateAppSettingsDto } from '@crusaders-bis-list/shared-domain';

export interface IAppSettingsRepository {
  get(): Promise<IAppSettings>;
  update(dto: UpdateAppSettingsDto): Promise<IAppSettings>;
}

export const APP_SETTINGS_REPOSITORY = Symbol('IAppSettingsRepository');
