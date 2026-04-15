import { RaiderProfile } from '../entities/raider-profile.entity';
import { RaiderStatus, WowClass, WowSpec } from '@crusaders-bis-list/shared-domain';

export interface CreateRaiderProfileDto {
  userId: string;
  characterName: string;
  realm?: string;
  wowClass: WowClass;
  spec: WowSpec;
}

export interface UpdateRaiderProfileDto {
  characterName?: string;
  realm?: string;
  wowClass?: WowClass;
  spec?: WowSpec;
  status?: RaiderStatus;
}

export interface IRaiderRepository {
  findAll(activeOnly?: boolean): Promise<RaiderProfile[]>;
  findById(id: string): Promise<RaiderProfile | null>;
  findByUserId(userId: string): Promise<RaiderProfile | null>;
  save(dto: CreateRaiderProfileDto): Promise<RaiderProfile>;
  update(id: string, dto: UpdateRaiderProfileDto): Promise<RaiderProfile>;
  delete(id: string): Promise<void>;
}

export const RAIDER_REPOSITORY = Symbol('IRaiderRepository');
