import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../guards/auth.guard';
import { Roles } from '../guards/roles.decorator';
import {
  AssignLootUseCase,
  UpdateAssignmentStatusUseCase,
  GetBossLootViewUseCase,
  GetRaidCatalogUseCase,
  GetSeasonConfigUseCase,
  UpdateSeasonConfigUseCase,
  CancelReservationUseCase,
  GetAllRaiderReservationsUseCase,
  SyncRaidCatalogFromBlizzardUseCase,
  ResetCatalogAndSyncUseCase,
  UpdateItemSuperRareUseCase,
  ResetAllReservationsUseCase,
} from '@crusaders-bis-list/backend-application';
import {
  RAIDER_REPOSITORY,
  IRaiderRepository,
  USER_REPOSITORY,
  IUserRepository,
  RESERVATION_REPOSITORY,
  IReservationRepository,
  RAID_CATALOG_REPOSITORY,
  IRaidCatalogRepository,
  RECEIVED_ITEM_REPOSITORY,
  IReceivedItemRepository,
} from '@crusaders-bis-list/backend-domain';
import { Request } from 'express';
import { UserRole, Team, SUPER_USER_EMAIL } from '@crusaders-bis-list/shared-domain';
import { AuditLogService } from '@crusaders-bis-list/backend-infrastructure';
import { AssignLootDto, UpdateAssignmentStatusDto, UpdateSeasonConfigDto } from './dto/admin.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly assignLoot: AssignLootUseCase,
    private readonly updateStatus: UpdateAssignmentStatusUseCase,
    private readonly getBossView: GetBossLootViewUseCase,
    private readonly getCatalog: GetRaidCatalogUseCase,
    private readonly getSeasonConfig: GetSeasonConfigUseCase,
    private readonly updateSeasonConfig: UpdateSeasonConfigUseCase,
    private readonly cancelReservation: CancelReservationUseCase,
    private readonly getAllReservations: GetAllRaiderReservationsUseCase,
    private readonly syncCatalog: SyncRaidCatalogFromBlizzardUseCase,
    private readonly resetAndSync: ResetCatalogAndSyncUseCase,
    private readonly updateItemSuperRare: UpdateItemSuperRareUseCase,
    private readonly resetAllReservations: ResetAllReservationsUseCase,
    private readonly auditLog: AuditLogService,
    @Inject(RAIDER_REPOSITORY) private readonly raiderRepo: IRaiderRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(RESERVATION_REPOSITORY) private readonly reservationRepo: IReservationRepository,
    @Inject(RAID_CATALOG_REPOSITORY) private readonly catalogRepo: IRaidCatalogRepository,
    @Inject(RECEIVED_ITEM_REPOSITORY) private readonly receivedItemRepo: IReceivedItemRepository,
  ) {}

  /**
   * Team every admin is scoped to, unless they are the hardcoded super user AND explicitly
   * requested a different team via `?team=`. Never trust a client-supplied team otherwise.
   */
  private async resolveEffectiveTeam(req: Request, requestedTeam?: Team): Promise<Team> {
    const requesterId = (req.user as JwtPayload).sub;
    const requester = await this.userRepo.findById(requesterId);
    if (requester?.email === SUPER_USER_EMAIL && requestedTeam) return requestedTeam;
    return requester?.team ?? Team.CRUSADERS;
  }

  @Get('raiders')
  async getAllRaiders(@Req() req: Request, @Query('team') teamQuery?: Team) {
    const team = await this.resolveEffectiveTeam(req, teamQuery);
    const [raiders, users] = await Promise.all([this.raiderRepo.findAll(), this.userRepo.findAll()]);
    const teamUserIds = new Set(users.filter((u) => u.team === team).map((u) => u.id));
    return raiders.filter((r) => teamUserIds.has(r.userId));
  }

  @Get('users')
  async getAllUsers(@Req() req: Request, @Query('team') teamQuery?: Team) {
    const team = await this.resolveEffectiveTeam(req, teamQuery);
    const users = await this.userRepo.findAll();
    return users.filter((u) => u.team === team);
  }

  @Post('users/:userId/roles')
  @HttpCode(HttpStatus.OK)
  async updateUserRoles(@Param('userId') userId: string, @Body() dto: { roles: UserRole[] }) {
    return this.userRepo.updateRoles(userId, dto.roles);
  }

  @Post('users/:userId/team')
  @HttpCode(HttpStatus.OK)
  async updateUserTeam(@Param('userId') userId: string, @Body() dto: { team: Team }) {
    return this.userRepo.updateTeam(userId, dto.team);
  }

  @Delete('users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('userId') userId: string, @Req() req: Request) {
    const requesterId = (req.user as JwtPayload).sub;
    if (requesterId === userId) throw new ForbiddenException('Cannot delete your own account.');
    // Delete raider profile first to satisfy the FK constraint, then the user account.
    const profile = await this.raiderRepo.findByUserId(userId);
    if (profile) await this.raiderRepo.delete(profile.id);
    await this.userRepo.delete(userId);
  }

  @Delete('users/:userId/bnet')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkBnet(@Param('userId') userId: string) {
    await this.userRepo.updateBnetAccount(userId, null, null, null);
  }

  @Delete('raiders/:raiderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRaiderProfile(@Param('raiderId') raiderId: string) {
    await this.raiderRepo.delete(raiderId);
  }

  @Get('catalog')
  async getCatalogView(@Req() req: Request, @Query('team') teamQuery?: Team) {
    const team = await this.resolveEffectiveTeam(req, teamQuery);
    return this.getCatalog.getActiveSeasonWithBossesAndItems(team);
  }

  @Get('boss/:bossId/loot/:seasonId')
  async getBossLoot(
    @Req() req: Request,
    @Param('bossId') bossId: string,
    @Param('seasonId') seasonId: string,
    @Query('team') teamQuery?: Team,
  ) {
    const team = await this.resolveEffectiveTeam(req, teamQuery);
    return this.getBossView.execute(bossId, seasonId, team);
  }

  @Post('assignments')
  @HttpCode(HttpStatus.CREATED)
  async assignLootToRaider(@Req() req: Request, @Body() dto: AssignLootDto) {
    const adminId = (req.user as JwtPayload).sub;
    const [admin, raider] = await Promise.all([
      this.userRepo.findById(adminId),
      this.raiderRepo.findById(dto.raiderId),
    ]);
    const actorName = admin?.displayName ?? adminId;
    const raiderUser = raider ? await this.userRepo.findById(raider.userId) : null;
    await this.assignLoot.execute({
      raiderId: dto.raiderId,
      itemId: dto.itemId,
      bossId: dto.bossId,
      raidSeasonId: dto.raidSeasonId,
      status: dto.status,
      assignedByUserId: adminId,
    });
    this.auditLog.log({
      action: 'loot_assigned',
      actorId: adminId,
      actorName,
      team: raiderUser?.team ?? admin?.team ?? Team.CRUSADERS,
      raiderName: dto.raiderName ?? null,
      itemName: dto.itemName ?? null,
      details: { status: dto.status },
    });
    return { message: 'Assignment created' };
  }

  @Post('assignments/:id/status')
  @HttpCode(HttpStatus.OK)
  updateAssignmentStatus(@Param('id') assignmentId: string, @Body() dto: UpdateAssignmentStatusDto) {
    return this.updateStatus.execute(assignmentId, dto.status);
  }

  @Get('reservations')
  async getAllRaiderReservations(@Req() req: Request, @Query('team') teamQuery?: Team) {
    const team = await this.resolveEffectiveTeam(req, teamQuery);
    return this.getAllReservations.execute(team);
  }

  @Delete('reservations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async adminCancelReservation(@Req() req: Request, @Param('id') reservationId: string) {
    const adminId = (req.user as JwtPayload).sub;
    const [admin, reservation] = await Promise.all([
      this.userRepo.findById(adminId),
      this.reservationRepo.findById(reservationId),
    ]);
    const [raider, item] = await Promise.all([
      reservation ? this.raiderRepo.findById(reservation.raiderId) : Promise.resolve(null),
      reservation ? this.catalogRepo.findItemById(reservation.itemId) : Promise.resolve(null),
    ]);
    const raiderUser = raider ? await this.userRepo.findById(raider.userId) : null;
    await this.cancelReservation.execute(reservationId);
    this.auditLog.log({
      action: 'reservation_cancelled',
      actorId: adminId,
      actorName: admin?.displayName ?? adminId,
      team: raiderUser?.team ?? admin?.team ?? Team.CRUSADERS,
      raiderName: raider?.characterName ?? null,
      itemName: item?.mergedDisplayName ?? item?.name ?? null,
    });
  }

  @Delete('raiders/:raiderId/received-items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async adminDeleteReceivedItem(
    @Req() req: Request,
    @Param('raiderId') raiderId: string,
    @Param('itemId') itemId: string,
  ) {
    const adminId = (req.user as JwtPayload).sub;
    const [admin, raider, item] = await Promise.all([
      this.userRepo.findById(adminId),
      this.raiderRepo.findById(raiderId),
      this.catalogRepo.findItemById(itemId),
    ]);
    const raiderUser = raider ? await this.userRepo.findById(raider.userId) : null;
    await this.receivedItemRepo.deleteByRaiderAndItem(raiderId, itemId);
    this.auditLog.log({
      action: 'reservation_cancelled',
      actorId: adminId,
      actorName: admin?.displayName ?? adminId,
      team: raiderUser?.team ?? admin?.team ?? Team.CRUSADERS,
      raiderName: raider?.characterName ?? null,
      itemName: item?.mergedDisplayName ?? item?.name ?? null,
    });
  }

  @Post('reservations/reset-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetAllReservationsEndpoint(@Req() req: Request, @Body() dto: { reason?: string }) {
    const adminId = (req.user as JwtPayload).sub;
    const admin = await this.userRepo.findById(adminId);
    const actorName = admin?.displayName ?? adminId;
    await this.resetAllReservations.execute(dto.reason);
    this.auditLog.log({
      action: 'reservation_reset_all',
      actorId: adminId,
      actorName,
      team: admin?.team ?? Team.CRUSADERS,
      details: dto.reason ? { reason: dto.reason } : null,
    });
  }

  @Get('audit-log')
  async getAuditLog(@Req() req: Request, @Query('team') teamQuery?: Team) {
    const team = await this.resolveEffectiveTeam(req, teamQuery);
    return this.auditLog.getRecent(200, team);
  }

  @Get('season-config')
  async getConfig(@Req() req: Request, @Query('team') teamQuery?: Team) {
    const team = await this.resolveEffectiveTeam(req, teamQuery);
    return this.getSeasonConfig.execute(team);
  }

  @Put('season-config/:seasonId')
  async updateConfig(
    @Req() req: Request,
    @Param('seasonId') seasonId: string,
    @Body() dto: UpdateSeasonConfigDto,
    @Query('team') teamQuery?: Team,
  ) {
    const team = await this.resolveEffectiveTeam(req, teamQuery);
    return this.updateSeasonConfig.execute(seasonId, dto, team);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async triggerSync() {
    await this.syncCatalog.execute();
    return { message: 'Catalogus gesynchroniseerd met Blizzard.' };
  }

  @Post('reset-and-sync')
  @HttpCode(HttpStatus.OK)
  async triggerResetAndSync() {
    await this.resetAndSync.execute();
    return { message: 'Catalogus gereset en opnieuw gesynchroniseerd met Blizzard.' };
  }

  @Put('items/:itemId/super-rare')
  @HttpCode(HttpStatus.OK)
  async updateSuperRare(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body() body: { isSuperRare: boolean },
    @Query('team') teamQuery?: Team,
  ) {
    const team = await this.resolveEffectiveTeam(req, teamQuery);
    return this.updateItemSuperRare.execute(itemId, team, body.isSuperRare);
  }
}
