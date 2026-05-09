import { IRaidPlanBossNote, UpsertBossNoteDto, AddBossResourceDto } from '@crusaders-bis-list/shared-domain';

export interface IRaidPlanBossNoteRepository {
  findAllByPlan(raidPlanId: string): Promise<IRaidPlanBossNote[]>;
  findByPlanAndBoss(raidPlanId: string, bossId: string): Promise<IRaidPlanBossNote | null>;
  upsert(raidPlanId: string, bossId: string, dto: UpsertBossNoteDto): Promise<IRaidPlanBossNote>;
  addResource(bossNoteId: string, dto: AddBossResourceDto): Promise<IRaidPlanBossNote>;
  deleteResource(bossNoteId: string, resourceId: string): Promise<IRaidPlanBossNote>;
}

export const RAID_PLAN_BOSS_NOTE_REPOSITORY = Symbol('IRaidPlanBossNoteRepository');
