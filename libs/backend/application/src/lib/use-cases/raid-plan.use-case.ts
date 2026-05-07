import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  RAID_PLAN_REPOSITORY,
  IRaidPlanRepository,
  RAID_CATALOG_REPOSITORY,
  IRaidCatalogRepository,
  RAIDER_REPOSITORY,
  IRaiderRepository,
  USER_REPOSITORY,
  IUserRepository,
  ResolvedParticipant,
} from '@crusaders-bis-list/backend-domain';
import { IRaidPlan, CreateRaidPlanDto, UpdateRaidPlanDto, WowClass, WowSpec } from '@crusaders-bis-list/shared-domain';
import { DiscordWebhookService } from '@crusaders-bis-list/backend-infrastructure';

@Injectable()
export class GetRaidPlansUseCase {
  constructor(
    @Inject(RAID_PLAN_REPOSITORY)
    private readonly repo: IRaidPlanRepository,
  ) {}

  execute(): Promise<IRaidPlan[]> {
    return this.repo.findAll();
  }
}

@Injectable()
export class GetRaidPlanUseCase {
  constructor(
    @Inject(RAID_PLAN_REPOSITORY)
    private readonly repo: IRaidPlanRepository,
  ) {}

  async execute(id: string): Promise<IRaidPlan> {
    const plan = await this.repo.findById(id);
    if (!plan) throw new NotFoundException(`Raid plan ${id} not found`);
    return plan;
  }
}

@Injectable()
export class CreateRaidPlanUseCase {
  constructor(
    @Inject(RAID_PLAN_REPOSITORY)
    private readonly repo: IRaidPlanRepository,
    @Inject(RAID_CATALOG_REPOSITORY)
    private readonly catalogRepo: IRaidCatalogRepository,
    @Inject(RAIDER_REPOSITORY)
    private readonly raiderRepo: IRaiderRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(dto: CreateRaidPlanDto): Promise<IRaidPlan> {
    const season = await this.catalogRepo.findSeasonById(dto.raidSeasonId);
    if (!season) throw new NotFoundException(`Raid season ${dto.raidSeasonId} not found`);

    const resolved = await this.resolveParticipants(dto);
    return this.repo.create(dto, resolved, season.name);
  }

  private async resolveParticipants(dto: CreateRaidPlanDto): Promise<ResolvedParticipant[]> {
    const resolved: ResolvedParticipant[] = [];
    for (const p of dto.participants) {
      const user = await this.userRepo.findById(p.userId);
      if (!user) throw new NotFoundException(`User ${p.userId} not found`);
      const raider = await this.raiderRepo.findByUserId(p.userId);
      resolved.push({
        userId: p.userId,
        displayName: user.displayName,
        characterName: raider?.characterName ?? user.displayName,
        wowClass: (raider?.wowClass as WowClass) ?? WowClass.WARRIOR,
        spec: (raider?.spec as WowSpec) ?? WowSpec.ARMS,
        role: p.role,
      });
    }
    return resolved;
  }
}

@Injectable()
export class UpdateRaidPlanUseCase {
  constructor(
    @Inject(RAID_PLAN_REPOSITORY)
    private readonly repo: IRaidPlanRepository,
    @Inject(RAIDER_REPOSITORY)
    private readonly raiderRepo: IRaiderRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(id: string, dto: UpdateRaidPlanDto): Promise<IRaidPlan> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Raid plan ${id} not found`);

    let resolved: ResolvedParticipant[] | undefined;
    if (dto.participants !== undefined) {
      resolved = await this.resolveParticipants(dto.participants);
    }

    return this.repo.update(id, dto, resolved);
  }

  private async resolveParticipants(participants: UpdateRaidPlanDto['participants']): Promise<ResolvedParticipant[]> {
    const resolved: ResolvedParticipant[] = [];
    for (const p of participants ?? []) {
      const user = await this.userRepo.findById(p.userId);
      if (!user) throw new NotFoundException(`User ${p.userId} not found`);
      const raider = await this.raiderRepo.findByUserId(p.userId);
      resolved.push({
        userId: p.userId,
        displayName: user.displayName,
        characterName: raider?.characterName ?? user.displayName,
        wowClass: (raider?.wowClass as WowClass) ?? WowClass.WARRIOR,
        spec: (raider?.spec as WowSpec) ?? WowSpec.ARMS,
        role: p.role,
      });
    }
    return resolved;
  }
}

@Injectable()
export class DeleteRaidPlanUseCase {
  constructor(
    @Inject(RAID_PLAN_REPOSITORY)
    private readonly repo: IRaidPlanRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Raid plan ${id} not found`);
    await this.repo.delete(id);
  }
}

@Injectable()
export class SendDiscordNotificationUseCase {
  constructor(
    @Inject(RAID_PLAN_REPOSITORY)
    private readonly repo: IRaidPlanRepository,
    private readonly discord: DiscordWebhookService,
  ) {}

  async execute(raidPlanId: string): Promise<void> {
    const webhookUrl = process.env['DISCORD_WEBHOOK_URL'];
    if (!webhookUrl) {
      throw new BadRequestException('DISCORD_WEBHOOK_URL is not configured.');
    }

    const plan = await this.repo.findById(raidPlanId);
    if (!plan) throw new NotFoundException(`Raid plan ${raidPlanId} not found`);

    await this.discord.sendRaidPlanNotification(plan, webhookUrl);
  }
}
