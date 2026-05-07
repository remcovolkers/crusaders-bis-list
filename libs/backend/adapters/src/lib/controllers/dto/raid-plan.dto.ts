import { IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RaidDifficulty, RaidParticipantRole } from '@crusaders-bis-list/shared-domain';

export class RaidPlanParticipantDto {
  @IsUUID()
  userId!: string;

  @IsEnum(RaidParticipantRole)
  role!: RaidParticipantRole;
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
