import { WowClass } from '../enums/wow-class.enum';
import { WowSpec } from '../enums/wow-spec.enum';
import { RaidDifficulty } from '../enums/raid-difficulty.enum';
import { RaidParticipantRole } from '../enums/raid-participant-role.enum';

export interface IRaidPlanParticipant {
  id: string;
  raidPlanId: string;
  userId: string;
  displayName: string;
  characterName: string;
  wowClass: WowClass;
  spec: WowSpec;
  role: RaidParticipantRole;
}

export interface IRaidPlan {
  id: string;
  raidSeasonId: string;
  raidName: string;
  difficulty: RaidDifficulty;
  scheduledAt: Date;
  notes?: string;
  participants: IRaidPlanParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRaidPlanParticipantDto {
  userId: string;
  role: RaidParticipantRole;
}

export interface CreateRaidPlanDto {
  raidSeasonId: string;
  difficulty: RaidDifficulty;
  scheduledAt: string; // ISO string
  notes?: string;
  participants: CreateRaidPlanParticipantDto[];
}

export type UpdateRaidPlanDto = Partial<CreateRaidPlanDto>;
