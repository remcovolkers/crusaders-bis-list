import { IsString, IsUUID } from 'class-validator';

export class ReserveItemDto {
  @IsUUID()
  itemId!: string;

  @IsUUID()
  raidSeasonId!: string;
}

export class CreateRaiderProfileDto {
  @IsString()
  characterName!: string;

  @IsString()
  wowClass!: string;

  @IsString()
  spec!: string;
}

export class UpdateRaiderProfileDto {
  @IsString()
  characterName!: string;

  @IsString()
  wowClass!: string;

  @IsString()
  spec!: string;
}
