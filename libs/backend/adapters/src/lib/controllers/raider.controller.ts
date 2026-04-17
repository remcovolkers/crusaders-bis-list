import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../guards/auth.guard';
import {
  ReserveItemUseCase,
  GetRaidCatalogUseCase,
  GetSeasonConfigUseCase,
} from '@crusaders-bis-list/backend-application';
import {
  RAIDER_REPOSITORY,
  IRaiderRepository,
  RESERVATION_REPOSITORY,
  IReservationRepository,
  RECEIVED_ITEM_REPOSITORY,
  IReceivedItemRepository,
  USER_REPOSITORY,
  IUserRepository,
  ASSIGNMENT_REPOSITORY,
  IAssignmentRepository,
} from '@crusaders-bis-list/backend-domain';
import { Inject } from '@nestjs/common';
import { ReserveItemDto, CreateRaiderProfileDto, UpdateRaiderProfileDto, MarkReceivedDto } from './dto/raider.dto';
import { WowClass, WowSpec } from '@crusaders-bis-list/shared-domain';

@Controller('raider')
@UseGuards(JwtAuthGuard)
export class RaiderController {
  constructor(
    private readonly reserveItem: ReserveItemUseCase,
    private readonly getRaidCatalog: GetRaidCatalogUseCase,
    private readonly getSeasonConfig: GetSeasonConfigUseCase,
    @Inject(RAIDER_REPOSITORY) private readonly raiderRepo: IRaiderRepository,
    @Inject(RESERVATION_REPOSITORY) private readonly reservationRepo: IReservationRepository,
    @Inject(RECEIVED_ITEM_REPOSITORY) private readonly receivedItemRepo: IReceivedItemRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(ASSIGNMENT_REPOSITORY) private readonly assignmentRepo: IAssignmentRepository,
  ) {}

  @Get('my-profile')
  async getMyProfile(@Req() req: Request) {
    const userId = (req.user as JwtPayload).sub;
    return this.raiderRepo.findByUserId(userId);
  }

  @Post('profile')
  async createProfile(@Req() req: Request, @Body() dto: CreateRaiderProfileDto) {
    const userId = (req.user as JwtPayload).sub;
    await this.userRepo.updateMembership(userId, dto.isCrusadersMember);
    return this.raiderRepo.save({
      userId,
      characterName: dto.characterName,
      realm: dto.realm,
      wowClass: dto.wowClass as WowClass,
      spec: dto.spec as WowSpec,
    });
  }

  @Put('profile')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateRaiderProfileDto) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found.');
    await this.userRepo.updateMembership(userId, dto.isCrusadersMember);
    return this.raiderRepo.update(raider.id, {
      characterName: dto.characterName,
      realm: dto.realm,
      wowClass: dto.wowClass as WowClass,
      spec: dto.spec as WowSpec,
    });
  }

  @Get('season-config')
  async getActiveSeasonConfig() {
    return this.getSeasonConfig.execute();
  }

  @Get('catalog')
  async getCatalog() {
    return this.getRaidCatalog.getActiveSeasonWithBossesAndItems();
  }

  @Get('reservations')
  async getReservations(@Req() req: Request, @Query('seasonId') seasonId: string) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) return [];
    const [reservations, assignments] = await Promise.all([
      this.reservationRepo.findByRaider(raider.id, seasonId),
      this.assignmentRepo.findByRaider(raider.id, seasonId),
    ]);
    const assignmentByItemId = new Map(assignments.map((a) => [a.itemId, { status: a.status }]));
    return reservations.map((r) => ({ ...r, assignment: assignmentByItemId.get(r.itemId) ?? null }));
  }

  @Post('reservations')
  @HttpCode(HttpStatus.CREATED)
  async reserve(@Req() req: Request, @Body() dto: ReserveItemDto) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found. Please create your profile first.');
    await this.reserveItem.execute(raider.id, dto.itemId, dto.raidSeasonId);
    return { message: 'Reserved successfully' };
  }

  @Delete('reservations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelReservation(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found.');
    await this.reservationRepo.delete(id);
  }

  @Get('received-items')
  async getReceivedItems(@Req() req: Request) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) return [];
    return this.receivedItemRepo.findByRaider(raider.id);
  }

  @Post('received-items')
  @HttpCode(HttpStatus.CREATED)
  async markItemReceived(@Req() req: Request, @Body() dto: MarkReceivedDto) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found.');
    return this.receivedItemRepo.save({ raiderId: raider.id, itemId: dto.itemId, tier: dto.tier });
  }

  @Delete('received-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReceivedItem(@Req() req: Request, @Param('id') receivedId: string) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found.');
    await this.receivedItemRepo.delete(receivedId);
  }
}
