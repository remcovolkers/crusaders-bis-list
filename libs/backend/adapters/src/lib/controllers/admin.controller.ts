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
} from '@crusaders-bis-list/backend-application';
import {
  RAIDER_REPOSITORY,
  IRaiderRepository,
  USER_REPOSITORY,
  IUserRepository,
} from '@crusaders-bis-list/backend-domain';
import { Request } from 'express';
import { UserRole } from '@crusaders-bis-list/shared-domain';
import { AssignLootDto, UpdateAssignmentStatusDto, UpdateSeasonConfigDto } from './dto/admin.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
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
    @Inject(RAIDER_REPOSITORY) private readonly raiderRepo: IRaiderRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  @Get('raiders')
  getAllRaiders() {
    return this.raiderRepo.findAll();
  }

  @Get('users')
  getAllUsers() {
    return this.userRepo.findAll();
  }

  @Post('users/:userId/roles')
  @HttpCode(HttpStatus.OK)
  async updateUserRoles(@Param('userId') userId: string, @Body() dto: { roles: UserRole[] }) {
    return this.userRepo.updateRoles(userId, dto.roles);
  }

  @Post('users/:userId/membership')
  @HttpCode(HttpStatus.OK)
  async updateUserMembership(@Param('userId') userId: string, @Body() dto: { isCrusadersMember: boolean }) {
    return this.userRepo.updateMembership(userId, dto.isCrusadersMember);
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

  @Delete('raiders/:raiderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRaiderProfile(@Param('raiderId') raiderId: string) {
    await this.raiderRepo.delete(raiderId);
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
    const adminId = (req.user as JwtPayload).sub;
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
  updateAssignmentStatus(@Param('id') assignmentId: string, @Body() dto: UpdateAssignmentStatusDto) {
    return this.updateStatus.execute(assignmentId, dto.status);
  }

  @Get('reservations')
  getAllRaiderReservations() {
    return this.getAllReservations.execute();
  }

  @Delete('reservations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async adminCancelReservation(@Param('id') reservationId: string) {
    await this.cancelReservation.execute(reservationId);
  }

  @Get('season-config')
  getConfig() {
    return this.getSeasonConfig.execute();
  }

  @Put('season-config/:seasonId')
  updateConfig(@Param('seasonId') seasonId: string, @Body() dto: UpdateSeasonConfigDto) {
    return this.updateSeasonConfig.execute(seasonId, dto);
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
  updateSuperRare(@Param('itemId') itemId: string, @Body() body: { isSuperRare: boolean }) {
    return this.updateItemSuperRare.execute(itemId, body.isSuperRare);
  }
}
