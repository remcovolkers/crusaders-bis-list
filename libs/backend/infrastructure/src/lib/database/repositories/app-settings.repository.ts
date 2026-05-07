import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAppSettingsRepository } from '@crusaders-bis-list/backend-domain';
import { IAppSettings, UpdateAppSettingsDto } from '@crusaders-bis-list/shared-domain';
import { AppSettingsOrmEntity } from '../entities/app-settings.orm-entity';

@Injectable()
export class AppSettingsRepository implements IAppSettingsRepository {
  constructor(
    @InjectRepository(AppSettingsOrmEntity)
    private readonly repo: Repository<AppSettingsOrmEntity>,
  ) {}

  private toModel(e: AppSettingsOrmEntity): IAppSettings {
    return {
      id: e.id,
      discordWebhookUrl: e.discordWebhookUrl,
    };
  }

  async get(): Promise<IAppSettings> {
    let entity = await this.repo.findOne({ where: {} });
    if (!entity) {
      entity = this.repo.create({ discordWebhookUrl: null });
      entity = await this.repo.save(entity);
    }
    return this.toModel(entity);
  }

  async update(dto: UpdateAppSettingsDto): Promise<IAppSettings> {
    let entity = await this.repo.findOne({ where: {} });
    if (!entity) {
      entity = this.repo.create({ discordWebhookUrl: dto.discordWebhookUrl });
    } else {
      entity.discordWebhookUrl = dto.discordWebhookUrl;
    }
    const saved = await this.repo.save(entity);
    return this.toModel(saved);
  }
}
