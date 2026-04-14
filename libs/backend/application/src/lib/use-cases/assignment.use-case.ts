import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ASSIGNMENT_REPOSITORY,
  IAssignmentRepository,
  LootDomainRules,
  CreateAssignmentData,
} from '@crusaders-bis-list/backend-domain';
import { RAIDER_REPOSITORY, IRaiderRepository } from '@crusaders-bis-list/backend-domain';
import { RAID_CATALOG_REPOSITORY, IRaidCatalogRepository } from '@crusaders-bis-list/backend-domain';
import { AssignmentStatus } from '@crusaders-bis-list/shared-domain';

export interface AssignLootInput {
  raiderId: string;
  itemId: string;
  bossId: string;
  raidSeasonId: string;
  status: AssignmentStatus;
  assignedByUserId: string;
}

@Injectable()
export class AssignLootUseCase {
  constructor(
    @Inject(ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: IAssignmentRepository,
    @Inject(RAIDER_REPOSITORY)
    private readonly raiderRepo: IRaiderRepository,
    @Inject(RAID_CATALOG_REPOSITORY)
    private readonly catalogRepo: IRaidCatalogRepository,
  ) {}

  async execute(input: AssignLootInput): Promise<void> {
    const raider = await this.raiderRepo.findById(input.raiderId);
    if (!raider) throw new NotFoundException(`Raider ${input.raiderId} not found`);
    if (!raider.isActive()) throw new BadRequestException('Raider is not active.');

    const item = await this.catalogRepo.findItemById(input.itemId);
    if (!item) throw new NotFoundException(`Item ${input.itemId} not found`);

    const boss = await this.catalogRepo.findBossById(input.bossId);
    if (!boss) throw new NotFoundException(`Boss ${input.bossId} not found`);

    const existingAssignment = await this.assignmentRepo.findByRaiderAndItem(
      input.raiderId,
      input.itemId,
    );
    if (!LootDomainRules.isEligibleForAssignment(existingAssignment)) {
      throw new BadRequestException(
        'This raider already received this item or marked it as no longer needed.',
      );
    }

    await this.assignmentRepo.save({
      raiderId: input.raiderId,
      itemId: input.itemId,
      bossId: input.bossId,
      raidSeasonId: input.raidSeasonId,
      status: input.status,
      assignedByUserId: input.assignedByUserId,
    });
  }
}

@Injectable()
export class UpdateAssignmentStatusUseCase {
  constructor(
    @Inject(ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: IAssignmentRepository,
  ) {}

  async execute(assignmentId: string, status: AssignmentStatus): Promise<void> {
    await this.assignmentRepo.updateStatus(assignmentId, status);
  }
}
