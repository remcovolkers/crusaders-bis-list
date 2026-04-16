import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRollSessionDto {
  @IsString()
  itemName!: string;

  @IsOptional()
  @IsString()
  itemIconUrl?: string;

  @IsUUID()
  bossId!: string;

  @IsArray()
  @ArrayMinSize(2)
  raiders!: { raiderId: string; name: string }[];
}
