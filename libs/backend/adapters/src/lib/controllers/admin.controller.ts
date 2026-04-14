import {
  Controller, Get, Post, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../guards/auth.guard';
import { Roles } from '../guards/roles.decorator';
import {
  AssignLootUseCase,
  UpdateAssignmentStatusUseCase,
  GetBossLootViewUseCase,
  GetRaidCatalogUseCase,
} from '@crusaders-bis-list/backend-application';
import { RAIDER_REPOSITORY, IRaiderRepository } from '@crusaders-bis-list/backend-domain';
import { Inject, Req } from '@nestjs/common';
import { Request } from 'express';
import { AssignmentStatus, UserRole } from '@crusaders-bis-list/shared-domain';
import { IsEnum, IsUUID } from 'class-validator';

export class AssignLootDto {
  @IsUUID()
  raiderId: string;

  @IsUUID()
  itemId: string;

  @IsUUID()
  bossId: string;

  @IsUUID()
  raidSeasonId: string;

  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;
}

export class UpdateAssignmentStatusDto {
  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly assignLoot: AssignLootUseCase,
    private readonly updateStatus: UpdateAssignmentStatusUseCase,
    private readonly getBossView: GetBossLootViewUseCase,
    private readonly getCatalog: GetRaidCatalogUseCase,
    @Inject(RAIDER_REPOSITORY) private readonly raiderRepo: IRaiderRepository,
  ) {}

  @Get('raiders')
  getAllRaiders() {
    return this.raiderRepo.findAll();
  }

  @Get('catalog')
  getCatalogView() {
    return this.getCatalog.getActiveSeasonWithBossesAndItems();
  }

  @Get('boss/:bossId/loot/:seasonId')
  getBossLoot(@Param('bossId') bossId: string, @Param('seasonId') seasonId: string) {
    return this.getBossView.execute(bossId, seasonId);
  }

  @Post('assignments')
  @HttpCode(HttpStatus.CREATED)
  async assignLootToRaider(@Req() req: Request, @Body() dto: AssignLootDto) {
    const adminId = (req.user as any).sub;
    await this.assignLoot.execute({
      raiderId: dto.raiderId,
      itemId: dto.itemId,
      bossId: dto.bossId,
      raidSeasonId: dto.raidSeasonId,
      status: dto.status,
      assignedByUserId: adminId,
    });
    return { message: 'Assignment created' };
  }

  @Post('assignments/:id/status')
  @HttpCode(HttpStatus.OK)
  updateAssignmentStatus(
    @Param('id') assignmentId: string,
    @Body() dto: UpdateAssignmentStatusDto,
  ) {
    return this.updateStatus.execute(assignmentId, dto.status);
  }
}
