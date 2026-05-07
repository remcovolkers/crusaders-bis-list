import { Inject, Injectable } from '@nestjs/common';
import { APP_SETTINGS_REPOSITORY, IAppSettingsRepository } from '@crusaders-bis-list/backend-domain';
import { IAppSettings, UpdateAppSettingsDto } from '@crusaders-bis-list/shared-domain';

@Injectable()
export class GetAppSettingsUseCase {
  constructor(
    @Inject(APP_SETTINGS_REPOSITORY)
    private readonly repo: IAppSettingsRepository,
  ) {}

  execute(): Promise<IAppSettings> {
    return this.repo.get();
  }
}

@Injectable()
export class UpdateAppSettingsUseCase {
  constructor(
    @Inject(APP_SETTINGS_REPOSITORY)
    private readonly repo: IAppSettingsRepository,
  ) {}

  execute(dto: UpdateAppSettingsDto): Promise<IAppSettings> {
    return this.repo.update(dto);
  }
}
