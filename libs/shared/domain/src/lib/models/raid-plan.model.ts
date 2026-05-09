import { WowClass } from '../enums/wow-class.enum';
import { WowSpec } from '../enums/wow-spec.enum';
import { RaidDifficulty } from '../enums/raid-difficulty.enum';
import { RaidParticipantRole } from '../enums/raid-participant-role.enum';

export interface IRaidPlanParticipant {
  id: string;
  raidPlanId: string;
  userId: string;
  displayName: string;
  characterName: string;
  wowClass: WowClass;
  spec: WowSpec;
  role: RaidParticipantRole;
  groupNumber?: number | null;
}

export interface IRaidPlan {
  id: string;
  raidSeasonId: string;
  raidName: string;
  difficulty: RaidDifficulty;
  scheduledAt: Date;
  notes?: string;
  participants: IRaidPlanParticipant[];
  scheduledDiscordAt?: Date | null;
  discordSentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleDiscordDto {
  scheduledDiscordAt: string | null; // ISO string or null to clear
}

export interface CreateRaidPlanParticipantDto {
  userId: string;
  role: RaidParticipantRole;
  groupNumber?: number | null;
}

export interface CreateRaidPlanDto {
  raidSeasonId: string;
  difficulty: RaidDifficulty;
  scheduledAt: string; // ISO string
  notes?: string;
  participants: CreateRaidPlanParticipantDto[];
}

export type UpdateRaidPlanDto = Partial<CreateRaidPlanDto>;

// ── Boss notes ────────────────────────────────────────────────────────────────

export type BossNoteStatus = 'progression' | 'farm' | 'skip';

export interface IRaidPlanBossResource {
  id: string;
  bossNoteId: string;
  url: string;
  title: string;
  thumbnailUrl?: string;
  type: 'youtube' | 'link';
}

export interface IRaidPlanBossNote {
  id: string;
  raidPlanId: string;
  bossId: string;
  notes: string;
  status: BossNoteStatus;
  resources: IRaidPlanBossResource[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertBossNoteDto {
  notes?: string;
  status?: BossNoteStatus;
}

export interface AddBossResourceDto {
  url: string;
  title: string;
  thumbnailUrl?: string;
  type: 'youtube' | 'link';
}
