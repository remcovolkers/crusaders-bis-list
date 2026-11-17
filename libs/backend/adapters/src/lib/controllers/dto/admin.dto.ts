import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';
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

  @IsOptional()
  @IsString()
  itemName?: string;

  @IsOptional()
  @IsString()
  raiderName?: string;
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

  /** Item level caps for the Hero / Myth track of worn gear (null = use the season definition's default). */
  @IsOptional()
  @IsInt()
  @Min(0)
  mythItemLevelFrom?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  ambiguousItemLevelFrom?: number | null;

  @IsOptional()
  @IsBoolean()
  bonusRollEnabled?: boolean;

  /** Highest item level a boss drop gives (null = season default). */
  @IsOptional()
  @IsInt()
  @Min(0)
  maxItemLevel?: number | null;

  /** { [Blizzard encounter id]: item level a bonus roll gives on that boss } */
  @IsOptional()
  @IsObject()
  bonusRollItemLevels?: Record<string, number>;
}
