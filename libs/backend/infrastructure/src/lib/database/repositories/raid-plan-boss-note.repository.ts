import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRaidPlanBossNoteRepository } from '@crusaders-bis-list/backend-domain';
import {
  IRaidPlanBossNote,
  IRaidPlanBossResource,
  UpsertBossNoteDto,
  AddBossResourceDto,
  BossNoteStatus,
} from '@crusaders-bis-list/shared-domain';
import { RaidPlanBossNoteOrmEntity, RaidPlanBossResourceOrmEntity } from '../entities/raid-plan-boss-note.orm-entity';

@Injectable()
export class RaidPlanBossNoteRepository implements IRaidPlanBossNoteRepository {
  constructor(
    @InjectRepository(RaidPlanBossNoteOrmEntity)
    private readonly noteRepo: Repository<RaidPlanBossNoteOrmEntity>,
    @InjectRepository(RaidPlanBossResourceOrmEntity)
    private readonly resourceRepo: Repository<RaidPlanBossResourceOrmEntity>,
  ) {}

  private toModel(entity: RaidPlanBossNoteOrmEntity): IRaidPlanBossNote {
    return {
      id: entity.id,
      raidPlanId: entity.raidPlanId,
      bossId: entity.bossId,
      notes: entity.notes,
      status: entity.status as BossNoteStatus,
      resources: (entity.resources ?? []).map((r) => this.toResourceModel(r)),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toResourceModel(r: RaidPlanBossResourceOrmEntity): IRaidPlanBossResource {
    return {
      id: r.id,
      bossNoteId: r.bossNoteId,
      url: r.url,
      title: r.title,
      thumbnailUrl: r.thumbnailUrl,
      type: r.type as 'youtube' | 'link',
    };
  }

  private async withResources(id: string): Promise<RaidPlanBossNoteOrmEntity | null> {
    return this.noteRepo.findOne({ where: { id } });
  }

  async findAllByPlan(raidPlanId: string): Promise<IRaidPlanBossNote[]> {
    const entities = await this.noteRepo.find({ where: { raidPlanId } });
    return entities.map((e) => this.toModel(e));
  }

  async findByPlanAndBoss(raidPlanId: string, bossId: string): Promise<IRaidPlanBossNote | null> {
    const entity = await this.noteRepo.findOne({ where: { raidPlanId, bossId } });
    return entity ? this.toModel(entity) : null;
  }

  async upsert(raidPlanId: string, bossId: string, dto: UpsertBossNoteDto): Promise<IRaidPlanBossNote> {
    let entity = await this.noteRepo.findOne({ where: { raidPlanId, bossId } });
    if (!entity) {
      entity = this.noteRepo.create({ raidPlanId, bossId, notes: '', status: 'progression' });
    }
    if (dto.notes !== undefined) entity.notes = dto.notes;
    if (dto.status !== undefined) entity.status = dto.status;
    const saved = await this.noteRepo.save(entity);
    return this.toModel((await this.withResources(saved.id))!);
  }

  async addResource(bossNoteId: string, dto: AddBossResourceDto): Promise<IRaidPlanBossNote> {
    const resource = this.resourceRepo.create({ ...dto, bossNoteId });
    await this.resourceRepo.save(resource);
    return this.toModel((await this.withResources(bossNoteId))!);
  }

  async deleteResource(bossNoteId: string, resourceId: string): Promise<IRaidPlanBossNote> {
    await this.resourceRepo.delete({ id: resourceId, bossNoteId });
    return this.toModel((await this.withResources(bossNoteId))!);
  }
}
