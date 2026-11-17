import { IsArray, IsEnum, IsInt, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { AssignmentStatus, CATALYST_SLOTS, ChaseMethod, EquipmentSlot, Team, WowClass, WowSpec } from '@crusaders-bis-list/shared-domain';

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

export class AddChaseItemDto {
  @IsUUID()
  itemId!: string;

  @IsUUID()
  raidSeasonId!: string;

  /** How the raider hopes to get the item: boss drop, bonus roll or both. An empty list removes the chase. */
  @IsArray()
  @IsEnum(ChaseMethod, { each: true })
  methods!: ChaseMethod[];

  @IsOptional()
  @IsString()
  itemName?: string;
}

export class CatalyseChaseDto {
  /** The tier slot that now holds the catalysed tier piece. */
  @IsIn(CATALYST_SLOTS as unknown as string[])
  slot!: EquipmentSlot;
}

export class BisMarkDto {
  /** Blizzard item id of the worn item that is marked as best in slot. */
  @IsInt()
  itemId!: number;
}
