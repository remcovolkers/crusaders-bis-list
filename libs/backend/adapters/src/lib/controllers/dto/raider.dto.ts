import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AssignmentStatus } from '@crusaders-bis-list/shared-domain';

export class ReserveItemDto {
  @IsUUID()
  itemId!: string;

  @IsUUID()
  raidSeasonId!: string;
}

export class CreateRaiderProfileDto {
  @IsString()
  characterName!: string;

  @IsOptional()
  @IsString()
  realm?: string;

  @IsString()
  wowClass!: string;

  @IsString()
  spec!: string;
}

export class UpdateRaiderProfileDto {
  @IsString()
  characterName!: string;

  @IsOptional()
  @IsString()
  realm?: string;

  @IsString()
  wowClass!: string;

  @IsString()
  spec!: string;
}

export class MarkReceivedDto {
  @IsUUID()
  itemId!: string;

  @IsEnum(AssignmentStatus)
  tier!: AssignmentStatus;
}
