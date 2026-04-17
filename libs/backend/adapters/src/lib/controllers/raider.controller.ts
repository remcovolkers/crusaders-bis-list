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
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../guards/auth.guard';
import {
  ReserveItemUseCase,
  GetRaidCatalogUseCase,
  GetSeasonConfigUseCase,
  CancelReservationUseCase,
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
import { blizzardClassToWowClass } from '../mappers/blizzard-class.mapper';

interface BlizzardCharacter {
  name: string;
  realm: { name: string; slug: string };
  playable_class: { id: number; name: string };
  level: number;
}

@Controller('raider')
@UseGuards(JwtAuthGuard)
export class RaiderController {
  constructor(
    private readonly reserveItem: ReserveItemUseCase,
    private readonly getRaidCatalog: GetRaidCatalogUseCase,
    private readonly getSeasonConfig: GetSeasonConfigUseCase,
    private readonly cancelReservation: CancelReservationUseCase,
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

  @Get('wow-characters')
  async getWowCharacters(@Req() req: Request) {
    const userId = (req.user as JwtPayload).sub;
    const user = await this.userRepo.findById(userId);
    if (!user?.bnetAccessToken) throw new UnauthorizedException('Geen Battle.net account gekoppeld.');

    const region = process.env['BLIZZARD_REGION'] ?? 'eu';
    const url = `https://${region}.api.blizzard.com/profile/user/wow?namespace=profile-${region}&locale=en_US`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${user.bnetAccessToken}` },
    });

    if (response.status === 401) throw new UnauthorizedException('Battle.net token verlopen. Koppel opnieuw.');
    if (!response.ok) throw new Error(`Blizzard API fout: ${response.status}`);

    const data = (await response.json()) as { wow_accounts?: { characters?: BlizzardCharacter[] }[] };

    const characters = (data.wow_accounts ?? [])
      .flatMap((account) => account.characters ?? [])
      .filter((c) => c.level >= 10)
      .map((c) => ({
        name: c.name,
        realm: c.realm.name,
        realmSlug: c.realm.slug,
        wowClass: blizzardClassToWowClass(c.playable_class.id),
        level: c.level,
      }))
      .filter((c) => c.wowClass !== null)
      .sort((a, b) => b.level - a.level);

    return characters;
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
  async cancelReservationEndpoint(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found.');
    await this.cancelReservation.execute(id);
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
