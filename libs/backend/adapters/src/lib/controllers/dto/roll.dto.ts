import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRollSessionDto {
  @IsString()
  itemName!: string;

  @IsOptional()
  @IsString()
  itemIconUrl?: string;

  @IsOptional()
  @IsString()
  secondaryIconUrl?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsUUID()
  bossId!: string;

  @IsArray()
  @ArrayMinSize(2)
  raiders!: { raiderId: string; name: string; color?: string }[];
}
