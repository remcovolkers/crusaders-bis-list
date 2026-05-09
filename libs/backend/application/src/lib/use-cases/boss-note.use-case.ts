import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  RAID_PLAN_BOSS_NOTE_REPOSITORY,
  IRaidPlanBossNoteRepository,
  RAID_PLAN_REPOSITORY,
  IRaidPlanRepository,
} from '@crusaders-bis-list/backend-domain';
import { IRaidPlanBossNote, UpsertBossNoteDto, AddBossResourceDto } from '@crusaders-bis-list/shared-domain';

@Injectable()
export class GetBossNotesUseCase {
  constructor(
    @Inject(RAID_PLAN_BOSS_NOTE_REPOSITORY)
    private readonly repo: IRaidPlanBossNoteRepository,
  ) {}

  execute(raidPlanId: string): Promise<IRaidPlanBossNote[]> {
    return this.repo.findAllByPlan(raidPlanId);
  }
}

@Injectable()
export class UpsertBossNoteUseCase {
  constructor(
    @Inject(RAID_PLAN_REPOSITORY)
    private readonly planRepo: IRaidPlanRepository,
    @Inject(RAID_PLAN_BOSS_NOTE_REPOSITORY)
    private readonly repo: IRaidPlanBossNoteRepository,
  ) {}

  async execute(raidPlanId: string, bossId: string, dto: UpsertBossNoteDto): Promise<IRaidPlanBossNote> {
    const plan = await this.planRepo.findById(raidPlanId);
    if (!plan) throw new NotFoundException(`Raid plan ${raidPlanId} not found`);
    return this.repo.upsert(raidPlanId, bossId, dto);
  }
}

@Injectable()
export class AddBossResourceUseCase {
  constructor(
    @Inject(RAID_PLAN_BOSS_NOTE_REPOSITORY)
    private readonly repo: IRaidPlanBossNoteRepository,
  ) {}

  async execute(raidPlanId: string, bossId: string, dto: AddBossResourceDto): Promise<IRaidPlanBossNote> {
    // Ensure the boss note row exists before adding a resource
    let note = await this.repo.findByPlanAndBoss(raidPlanId, bossId);
    if (!note) {
      note = await this.repo.upsert(raidPlanId, bossId, {});
    }
    return this.repo.addResource(note.id, dto);
  }
}

@Injectable()
export class DeleteBossResourceUseCase {
  constructor(
    @Inject(RAID_PLAN_BOSS_NOTE_REPOSITORY)
    private readonly repo: IRaidPlanBossNoteRepository,
  ) {}

  async execute(raidPlanId: string, bossId: string, resourceId: string): Promise<IRaidPlanBossNote> {
    const note = await this.repo.findByPlanAndBoss(raidPlanId, bossId);
    if (!note) throw new NotFoundException(`Boss note for boss ${bossId} not found`);
    return this.repo.deleteResource(note.id, resourceId);
  }
}
