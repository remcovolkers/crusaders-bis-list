import { IRaidPlan, CreateRaidPlanDto, UpdateRaidPlanDto } from '@crusaders-bis-list/shared-domain';

export interface IRaidPlanRepository {
  findAll(): Promise<IRaidPlan[]>;
  findById(id: string): Promise<IRaidPlan | null>;
  findPendingDiscordNotifications(): Promise<IRaidPlan[]>;
  create(dto: CreateRaidPlanDto, resolvedParticipants: ResolvedParticipant[], raidName: string): Promise<IRaidPlan>;
  update(id: string, dto: UpdateRaidPlanDto, resolvedParticipants?: ResolvedParticipant[]): Promise<IRaidPlan>;
  scheduleDiscord(id: string, scheduledAt: Date | null): Promise<IRaidPlan>;
  markDiscordSent(id: string, sentAt: Date): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ResolvedParticipant {
  userId: string;
  displayName: string;
  characterName: string;
  wowClass: string;
  spec: string;
  role: string;
  groupNumber?: number | null;
}

export const RAID_PLAN_REPOSITORY = Symbol('IRaidPlanRepository');
