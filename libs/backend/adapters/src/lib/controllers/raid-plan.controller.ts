import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import {
  GetRaidPlansUseCase,
  GetRaidPlanUseCase,
  CreateRaidPlanUseCase,
  UpdateRaidPlanUseCase,
  DeleteRaidPlanUseCase,
  SendDiscordNotificationUseCase,
  ScheduleDiscordNotificationUseCase,
  GetBossNotesUseCase,
  UpsertBossNoteUseCase,
  AddBossResourceUseCase,
  DeleteBossResourceUseCase,
} from '@crusaders-bis-list/backend-application';
import { RAID_CATALOG_REPOSITORY, IRaidCatalogRepository } from '@crusaders-bis-list/backend-domain';
import { UserRole } from '@crusaders-bis-list/shared-domain';
import { Request } from 'express';
import { JwtPayload } from '../auth/jwt.strategy';
import {
  CreateRaidPlanDto,
  UpdateRaidPlanDto,
  UpsertBossNoteDto,
  AddBossResourceDto,
  ScheduleDiscordDto,
} from './dto/raid-plan.dto';

function assertSuperAdmin(req: Request): void {
  const user = req.user as JwtPayload;
  if (!user.roles?.includes(UserRole.SUPER_ADMIN)) throw new ForbiddenException();
}

@Controller('raid-plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RaidPlanController {
  constructor(
    private readonly getPlans: GetRaidPlansUseCase,
    private readonly getPlan: GetRaidPlanUseCase,
    private readonly createPlan: CreateRaidPlanUseCase,
    private readonly updatePlan: UpdateRaidPlanUseCase,
    private readonly deletePlan: DeleteRaidPlanUseCase,
    private readonly notifyDiscord: SendDiscordNotificationUseCase,
    private readonly scheduleDiscord: ScheduleDiscordNotificationUseCase,
    private readonly getBossNotes: GetBossNotesUseCase,
    private readonly upsertBossNote: UpsertBossNoteUseCase,
    private readonly addBossResource: AddBossResourceUseCase,
    private readonly deleteBossResource: DeleteBossResourceUseCase,
    @Inject(RAID_CATALOG_REPOSITORY)
    private readonly catalogRepo: IRaidCatalogRepository,
  ) {}

  @Get('seasons')
  async getSeasons(@Req() req: Request) {
    assertSuperAdmin(req);
    return this.catalogRepo.findAllSeasons();
  }

  @Get('seasons/active/bosses')
  async getBossesForActiveSeason(@Req() req: Request) {
    assertSuperAdmin(req);
    const season = await this.catalogRepo.findActiveSeason();
    if (!season) return [];
    return this.catalogRepo.findBossesBySeason(season.id);
  }

  @Get('seasons/:seasonId/bosses')
  async getBossesBySeason(@Req() req: Request, @Param('seasonId') seasonId: string) {
    assertSuperAdmin(req);
    return this.catalogRepo.findBossesBySeason(seasonId);
  }

  @Get()
  list(@Req() req: Request) {
    assertSuperAdmin(req);
    return this.getPlans.execute();
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    assertSuperAdmin(req);
    return this.getPlan.execute(id);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateRaidPlanDto) {
    assertSuperAdmin(req);
    return this.createPlan.execute(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateRaidPlanDto) {
    assertSuperAdmin(req);
    return this.updatePlan.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string) {
    assertSuperAdmin(req);
    await this.deletePlan.execute(id);
  }

  @Post(':id/notify')
  @HttpCode(HttpStatus.OK)
  async notify(@Req() req: Request, @Param('id') id: string) {
    assertSuperAdmin(req);
    await this.notifyDiscord.execute(id);
    return { ok: true };
  }

  @Patch(':id/discord-schedule')
  @HttpCode(HttpStatus.OK)
  async discordSchedule(@Req() req: Request, @Param('id') id: string, @Body() dto: ScheduleDiscordDto) {
    assertSuperAdmin(req);
    return this.scheduleDiscord.execute(id, { scheduledDiscordAt: dto.scheduledDiscordAt ?? null });
  }

  // ── Boss notes ────────────────────────────────────────────────────────────

  @Get(':id/bosses')
  getBosses(@Req() req: Request, @Param('id') id: string) {
    assertSuperAdmin(req);
    return this.getBossNotes.execute(id);
  }

  @Patch(':id/bosses/:bossId')
  upsertNote(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('bossId') bossId: string,
    @Body() dto: UpsertBossNoteDto,
  ) {
    assertSuperAdmin(req);
    return this.upsertBossNote.execute(id, bossId, dto);
  }

  @Post(':id/bosses/:bossId/resources')
  addResource(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('bossId') bossId: string,
    @Body() dto: AddBossResourceDto,
  ) {
    assertSuperAdmin(req);
    return this.addBossResource.execute(id, bossId, dto);
  }

  @Delete(':id/bosses/:bossId/resources/:resourceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteResource(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('bossId') bossId: string,
    @Param('resourceId') resourceId: string,
  ) {
    assertSuperAdmin(req);
    await this.deleteBossResource.execute(id, bossId, resourceId);
  }
}
