import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RaidDifficulty, RaidParticipantRole } from '@crusaders-bis-list/shared-domain';

const BOSS_NOTE_STATUSES = ['progression', 'farm', 'skip'] as const;
type BossNoteStatus = (typeof BOSS_NOTE_STATUSES)[number];

const RESOURCE_TYPES = ['youtube', 'link'] as const;
type ResourceType = (typeof RESOURCE_TYPES)[number];

export class RaidPlanParticipantDto {
  @IsUUID()
  userId!: string;

  @IsEnum(RaidParticipantRole)
  role!: RaidParticipantRole;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  groupNumber?: number;
}

export class CreateRaidPlanDto {
  @IsUUID()
  raidSeasonId!: string;

  @IsEnum(RaidDifficulty)
  difficulty!: RaidDifficulty;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RaidPlanParticipantDto)
  participants!: RaidPlanParticipantDto[];
}

export class UpdateRaidPlanDto {
  @IsOptional()
  @IsUUID()
  raidSeasonId?: string;

  @IsOptional()
  @IsEnum(RaidDifficulty)
  difficulty?: RaidDifficulty;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RaidPlanParticipantDto)
  participants?: RaidPlanParticipantDto[];
}

export class UpsertBossNoteDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(BOSS_NOTE_STATUSES)
  status?: BossNoteStatus;
}

export class AddBossResourceDto {
  @IsUrl()
  url!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsEnum(RESOURCE_TYPES)
  type!: ResourceType;
}

export class ScheduleDiscordDto {
  @IsOptional()
  @IsDateString()
  scheduledDiscordAt?: string | null;
}
