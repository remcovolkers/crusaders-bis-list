import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
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
import {
  IRaidPlan,
  CreateRaidPlanDto,
  UpdateRaidPlanDto,
  WowClass,
  WowSpec,
  ScheduleDiscordDto,
} from '@crusaders-bis-list/shared-domain';
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
    const season = dto.raidSeasonId
      ? await this.catalogRepo.findSeasonById(dto.raidSeasonId)
      : await this.catalogRepo.findActiveSeason();
    if (!season) throw new NotFoundException(`No active raid season found`);

    const resolved = await this.resolveParticipants(dto);
    return this.repo.create({ ...dto, raidSeasonId: season.id }, resolved, dto.raidName ?? season.name);
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
        groupNumber: p.groupNumber ?? null,
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
        groupNumber: p.groupNumber ?? null,
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

@Injectable()
export class ScheduleDiscordNotificationUseCase {
  constructor(
    @Inject(RAID_PLAN_REPOSITORY)
    private readonly repo: IRaidPlanRepository,
  ) {}

  async execute(raidPlanId: string, dto: ScheduleDiscordDto): Promise<IRaidPlan> {
    const plan = await this.repo.findById(raidPlanId);
    if (!plan) throw new NotFoundException(`Raid plan ${raidPlanId} not found`);

    const scheduledAt = dto.scheduledDiscordAt ? new Date(dto.scheduledDiscordAt) : null;
    return this.repo.scheduleDiscord(raidPlanId, scheduledAt);
  }
}

@Injectable()
export class ScheduledDiscordService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ScheduledDiscordService.name);
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(
    @Inject(RAID_PLAN_REPOSITORY)
    private readonly repo: IRaidPlanRepository,
    private readonly discord: DiscordWebhookService,
  ) {}

  onApplicationBootstrap(): void {
    // Poll every 60 seconds for pending notifications
    this.intervalId = setInterval(() => this.processPending(), 60_000);
  }

  onApplicationShutdown(): void {
    if (this.intervalId !== undefined) clearInterval(this.intervalId);
  }

  private async processPending(): Promise<void> {
    const webhookUrl = process.env['DISCORD_WEBHOOK_URL'];
    if (!webhookUrl) return;

    let pending: IRaidPlan[];
    try {
      pending = await this.repo.findPendingDiscordNotifications();
    } catch (err) {
      this.logger.error('Failed to fetch pending Discord notifications', err);
      return;
    }

    for (const plan of pending) {
      try {
        await this.discord.sendRaidPlanNotification(plan, webhookUrl);
        await this.repo.markDiscordSent(plan.id, new Date());
        this.logger.log(`Discord notification sent for plan ${plan.id}`);
      } catch (err) {
        this.logger.error(`Failed to send Discord notification for plan ${plan.id}`, err);
      }
    }
  }
}
