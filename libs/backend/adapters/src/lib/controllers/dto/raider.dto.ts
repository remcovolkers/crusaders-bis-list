import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AssignmentStatus, Team, WowClass, WowSpec } from '@crusaders-bis-list/shared-domain';

export class ReserveItemDto {
  @IsUUID()
  itemId!: string;

  @IsUUID()
  raidSeasonId!: string;

  @IsOptional()
  @IsString()
  itemName?: string;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  receivedTier?: AssignmentStatus;
}

export class CreateRaiderProfileDto {
  @IsString()
  characterName!: string;

  @IsOptional()
  @IsString()
  realm?: string;

  @IsEnum(WowClass)
  wowClass!: WowClass;

  @IsEnum(WowSpec)
  spec!: WowSpec;

  @IsEnum(Team)
  team!: Team;
}

export class UpdateRaiderProfileDto {
  @IsString()
  characterName!: string;

  @IsOptional()
  @IsString()
  realm?: string;

  @IsEnum(WowClass)
  wowClass!: WowClass;

  @IsEnum(WowSpec)
  spec!: WowSpec;

  @IsEnum(Team)
  team!: Team;
}

export class MarkReceivedDto {
  @IsUUID()
  itemId!: string;

  @IsEnum(AssignmentStatus)
  tier!: AssignmentStatus;

  @IsOptional()
  @IsString()
  itemName?: string;
}
