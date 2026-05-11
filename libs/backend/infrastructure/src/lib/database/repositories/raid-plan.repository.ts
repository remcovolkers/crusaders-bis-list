import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, IsNull, Repository } from 'typeorm';
import { IRaidPlanRepository, ResolvedParticipant } from '@crusaders-bis-list/backend-domain';
import {
  IRaidPlan,
  IRaidPlanParticipant,
  CreateRaidPlanDto,
  UpdateRaidPlanDto,
  RaidDifficulty,
  RaidParticipantRole,
  WowClass,
  WowSpec,
} from '@crusaders-bis-list/shared-domain';
import { RaidPlanOrmEntity, RaidPlanParticipantOrmEntity } from '../entities/raid-plan.orm-entity';

@Injectable()
export class RaidPlanRepository implements IRaidPlanRepository {
  constructor(
    @InjectRepository(RaidPlanOrmEntity)
    private readonly planRepo: Repository<RaidPlanOrmEntity>,
    @InjectRepository(RaidPlanParticipantOrmEntity)
    private readonly participantRepo: Repository<RaidPlanParticipantOrmEntity>,
  ) {}

  private toModel(entity: RaidPlanOrmEntity): IRaidPlan {
    return {
      id: entity.id,
      raidSeasonId: entity.raidSeasonId,
      raidName: entity.raidName,
      difficulty: entity.difficulty as RaidDifficulty,
      scheduledAt: entity.scheduledAt,
      notes: entity.notes,
      participants: (entity.participants ?? []).map((p) => this.toParticipantModel(p)),
      scheduledDiscordAt: entity.scheduledDiscordAt ?? null,
      discordSentAt: entity.discordSentAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toParticipantModel(p: RaidPlanParticipantOrmEntity): IRaidPlanParticipant {
    return {
      id: p.id,
      raidPlanId: p.raidPlanId,
      userId: p.userId,
      displayName: p.displayName,
      characterName: p.characterName,
      wowClass: p.wowClass as WowClass,
      spec: p.spec as WowSpec,
      role: p.role as RaidParticipantRole,
      groupNumber: p.groupNumber ?? null,
    };
  }

  async findAll(): Promise<IRaidPlan[]> {
    const entities = await this.planRepo.find({ order: { scheduledAt: 'DESC' } });
    return entities.map((e) => this.toModel(e));
  }

  async findById(id: string): Promise<IRaidPlan | null> {
    const entity = await this.planRepo.findOne({ where: { id } });
    return entity ? this.toModel(entity) : null;
  }

  async create(
    dto: CreateRaidPlanDto,
    resolvedParticipants: ResolvedParticipant[],
    raidName: string,
  ): Promise<IRaidPlan> {
    const plan = this.planRepo.create({
      raidSeasonId: dto.raidSeasonId,
      raidName,
      difficulty: dto.difficulty,
      scheduledAt: new Date(dto.scheduledAt),
      notes: dto.notes,
      participants: resolvedParticipants.map((p) =>
        this.participantRepo.create({
          userId: p.userId,
          displayName: p.displayName,
          characterName: p.characterName,
          wowClass: p.wowClass,
          spec: p.spec,
          role: p.role,
          groupNumber: p.groupNumber ?? null,
        }),
      ),
    });
    const saved = await this.planRepo.save(plan);
    return this.toModel(saved);
  }

  async update(id: string, dto: UpdateRaidPlanDto, resolvedParticipants?: ResolvedParticipant[]): Promise<IRaidPlan> {
    const existing = await this.planRepo.findOneOrFail({ where: { id } });

    if (dto.raidSeasonId !== undefined) existing.raidSeasonId = dto.raidSeasonId;
    if (dto.raidName !== undefined) existing.raidName = dto.raidName;
    if (dto.difficulty !== undefined) existing.difficulty = dto.difficulty;
    if (dto.scheduledAt !== undefined) existing.scheduledAt = new Date(dto.scheduledAt);
    if (dto.notes !== undefined) existing.notes = dto.notes;

    if (resolvedParticipants !== undefined) {
      await this.participantRepo.delete({ raidPlanId: id });
      existing.participants = resolvedParticipants.map((p) =>
        this.participantRepo.create({
          raidPlanId: id,
          userId: p.userId,
          displayName: p.displayName,
          characterName: p.characterName,
          wowClass: p.wowClass,
          spec: p.spec,
          role: p.role,
          groupNumber: p.groupNumber ?? null,
        }),
      );
    }

    const saved = await this.planRepo.save(existing);
    return this.toModel(saved);
  }

  async delete(id: string): Promise<void> {
    await this.planRepo.delete(id);
  }

  async findPendingDiscordNotifications(): Promise<IRaidPlan[]> {
    const now = new Date();
    const entities = await this.planRepo.find({
      where: {
        scheduledDiscordAt: LessThanOrEqual(now),
        discordSentAt: IsNull(),
      },
    });
    return entities.map((e) => this.toModel(e));
  }

  async scheduleDiscord(id: string, scheduledAt: Date | null): Promise<IRaidPlan> {
    const existing = await this.planRepo.findOneOrFail({ where: { id } });
    existing.scheduledDiscordAt = scheduledAt;
    existing.discordSentAt = null;
    const saved = await this.planRepo.save(existing);
    return this.toModel(saved);
  }

  async markDiscordSent(id: string, sentAt: Date): Promise<void> {
    await this.planRepo.update(id, { discordSentAt: sentAt });
  }
}
