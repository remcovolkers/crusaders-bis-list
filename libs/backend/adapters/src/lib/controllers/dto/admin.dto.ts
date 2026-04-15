import { IsEnum, IsInt, IsUUID, Min } from 'class-validator';
import { AssignmentStatus } from '@crusaders-bis-list/shared-domain';

export class AssignLootDto {
  @IsUUID()
  raiderId!: string;

  @IsUUID()
  itemId!: string;

  @IsUUID()
  bossId!: string;

  @IsUUID()
  raidSeasonId!: string;

  @IsEnum(AssignmentStatus)
  status!: AssignmentStatus;
}

export class UpdateAssignmentStatusDto {
  @IsEnum(AssignmentStatus)
  status!: AssignmentStatus;
}

export class UpdateSeasonConfigDto {
  @IsInt()
  @Min(0)
  trinketLimit!: number;

  @IsInt()
  @Min(0)
  weaponLimit!: number;

  @IsInt()
  @Min(0)
  jewelryLimit!: number;

  @IsInt()
  @Min(0)
  armorLimit!: number;

  @IsInt()
  @Min(0)
  superrareLimit!: number;
}
