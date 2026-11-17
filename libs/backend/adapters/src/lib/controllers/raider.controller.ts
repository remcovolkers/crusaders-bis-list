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
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../guards/auth.guard';
import { AuditLogService } from '@crusaders-bis-list/backend-infrastructure';
import {
  ReserveItemUseCase,
  GetRaidCatalogUseCase,
  GetSeasonConfigUseCase,
  CancelReservationUseCase,
  SetChaseItemUseCase,
  SetBisMarkUseCase,
  RemoveBisMarkUseCase,
  CatalyseChaseItemUseCase,
  RemoveChaseItemUseCase,
  SyncRaiderEquipmentUseCase,
} from '@crusaders-bis-list/backend-application';
import {
  BIS_MARK_REPOSITORY,
  IBisMarkRepository,
  CHASE_ITEM_REPOSITORY,
  IChaseItemRepository,
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
  RAID_CATALOG_REPOSITORY,
  IRaidCatalogRepository,
  BLIZZARD_API_SERVICE,
  IBlizzardApiService,
} from '@crusaders-bis-list/backend-domain';
import { Inject } from '@nestjs/common';
import {
  ReserveItemDto,
  CreateRaiderProfileDto,
  UpdateRaiderProfileDto,
  MarkReceivedDto,
  AddChaseItemDto,
  BisMarkDto,
  CatalyseChaseDto,
} from './dto/raider.dto';
import { WowClass, WowSpec, Team, reservedTiersAboveFloor, EQUIPMENT_SLOTS, EquipmentSlot } from '@crusaders-bis-list/shared-domain';
import { blizzardClassToWowClass } from '../mappers/blizzard-class.mapper';
import { ApiBearerAuth } from '@nestjs/swagger';

interface BlizzardCharacter {
  name: string;
  realm: { name: string; slug: string };
  playable_class: { id: number; name: string };
  level: number;
}

@Controller('raider')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RaiderController {
  constructor(
    private readonly reserveItem: ReserveItemUseCase,
    private readonly getRaidCatalog: GetRaidCatalogUseCase,
    private readonly getSeasonConfig: GetSeasonConfigUseCase,
    private readonly cancelReservation: CancelReservationUseCase,
    private readonly setChaseItem: SetChaseItemUseCase,
    private readonly setBisMark: SetBisMarkUseCase,
    private readonly removeBisMark: RemoveBisMarkUseCase,
    private readonly catalyseChase: CatalyseChaseItemUseCase,
    private readonly removeChaseItem: RemoveChaseItemUseCase,
    private readonly syncEquipment: SyncRaiderEquipmentUseCase,
    private readonly auditLog: AuditLogService,
    @Inject(CHASE_ITEM_REPOSITORY) private readonly chaseItemRepo: IChaseItemRepository,
    @Inject(BIS_MARK_REPOSITORY) private readonly bisMarkRepo: IBisMarkRepository,
    @Inject(RAIDER_REPOSITORY) private readonly raiderRepo: IRaiderRepository,
    @Inject(RESERVATION_REPOSITORY) private readonly reservationRepo: IReservationRepository,
    @Inject(RECEIVED_ITEM_REPOSITORY) private readonly receivedItemRepo: IReceivedItemRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(ASSIGNMENT_REPOSITORY) private readonly assignmentRepo: IAssignmentRepository,
    @Inject(RAID_CATALOG_REPOSITORY) private readonly catalogRepo: IRaidCatalogRepository,
    @Inject(BLIZZARD_API_SERVICE) private readonly blizzard: IBlizzardApiService,
  ) {}

  @Get('my-profile')
  async getMyProfile(@Req() req: Request) {
    const userId = (req.user as JwtPayload).sub;
    return this.raiderRepo.findByUserId(userId);
  }

  /**
   * Syncs the raider's worn gear from the Blizzard armory (skipped when synced in the last 10 minutes) and ticks
   * off reserved / chased items that are worn. Returns the gear plus what changed, so the page can refresh.
   */
  @Post('equipment/sync')
  @HttpCode(HttpStatus.OK)
  async syncMyEquipment(@Req() req: Request) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) return { equipment: [], refreshed: false, updates: [] };
    return this.syncEquipment.execute(raider.id);
  }

  /** Armory render of the raider's own character, shown in the middle of the character pane. `url: null` = none. */
  @Get('character-media')
  async getCharacterMedia(@Req() req: Request): Promise<{ url: string | null }> {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider?.realm) return { url: null };
    return { url: await this.blizzard.getCharacterRenderUrl(raider.realm, raider.characterName) };
  }

  @Get('wow-characters')
  async getWowCharacters(@Req() req: Request) {
    const userId = (req.user as JwtPayload).sub;
    const user = await this.userRepo.findById(userId);
    // 403, not 401: the user's own session is fine, only the Battle.net link is missing/expired.
    // A 401 here makes the frontend interceptor treat it as an expired session and log the user out.
    if (!user?.bnetAccessToken) throw new ForbiddenException('Geen Battle.net account gekoppeld.');

    const region = process.env['BLIZZARD_REGION'] ?? 'eu';
    const url = `https://${region}.api.blizzard.com/profile/user/wow?namespace=profile-${region}&locale=en_US`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${user.bnetAccessToken}` },
    });

    if (response.status === 401) throw new ForbiddenException('Battle.net token verlopen. Koppel opnieuw.');
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
    await this.userRepo.updateTeam(userId, dto.team);
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
    await this.userRepo.updateTeam(userId, dto.team);
    return this.raiderRepo.update(raider.id, {
      characterName: dto.characterName,
      realm: dto.realm,
      wowClass: dto.wowClass as WowClass,
      spec: dto.spec as WowSpec,
    });
  }

  @Get('season-config')
  async getActiveSeasonConfig(@Req() req: Request) {
    const userId = (req.user as JwtPayload).sub;
    const user = await this.userRepo.findById(userId);
    return this.getSeasonConfig.execute(user?.team ?? Team.CRUSADERS);
  }

  @Get('catalog')
  async getCatalog(@Req() req: Request) {
    const userId = (req.user as JwtPayload).sub;
    const user = await this.userRepo.findById(userId);
    return this.getRaidCatalog.getActiveSeasonWithBossesAndItems(user?.team ?? Team.CRUSADERS);
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
    const user = await this.userRepo.findById(userId);
    const actorName = user?.displayName ?? userId;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found. Please create your profile first.');
    await this.reserveItem.execute(raider.id, dto.itemId, dto.raidSeasonId, user?.team ?? Team.CRUSADERS);
    this.auditLog.log({
      action: 'reservation_created',
      actorId: userId,
      actorName,
      team: user?.team ?? Team.CRUSADERS,
      raiderName: raider.characterName,
      itemName: dto.itemName ?? null,
      // receivedTier is the "already have" floor; what gets reserved is every tier above it
      details: { reservedTiers: reservedTiersAboveFloor(dto.receivedTier) },
    });
    return { message: 'Reserved successfully' };
  }

  @Delete('reservations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelReservationEndpoint(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as JwtPayload).sub;
    const [user, raider, reservation] = await Promise.all([
      this.userRepo.findById(userId),
      this.raiderRepo.findByUserId(userId),
      this.reservationRepo.findById(id),
    ]);
    const item = reservation ? await this.catalogRepo.findItemById(reservation.itemId) : null;
    if (!raider) throw new NotFoundException('Raider profile not found.');
    await this.cancelReservation.execute(id);
    this.auditLog.log({
      action: 'reservation_cancelled',
      actorId: userId,
      actorName: user?.displayName ?? userId,
      team: user?.team ?? Team.CRUSADERS,
      raiderName: raider.characterName,
      itemName: item?.mergedDisplayName ?? item?.name ?? null,
    });
  }

  // ── Chase items: "I want this" list, separate from (limited) reservations ──

  @Get('chase-items')
  async getChaseItems(@Req() req: Request, @Query('seasonId') seasonId: string) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider || !seasonId) return [];
    return this.chaseItemRepo.findByRaider(raider.id, seasonId);
  }

  @Post('chase-items')
  @HttpCode(HttpStatus.CREATED)
  async addChase(@Req() req: Request, @Body() dto: AddChaseItemDto) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found. Please create your profile first.');
    const user = await this.userRepo.findById(userId);
    // null = the chase was removed (an empty list of methods)
    return this.setChaseItem.execute(raider.id, dto.itemId, dto.raidSeasonId, user?.team ?? Team.CRUSADERS, dto.methods);
  }

  /**
   * Catalyst: the chased item was catalysed into the tier piece worn in the given slot. Marks that piece as best in
   * slot, records the chased item as obtained and removes the chase. Returns the raider's best-in-slot marks.
   */
  @Post('chase-items/:id/catalyse')
  @HttpCode(HttpStatus.OK)
  async catalyse(@Req() req: Request, @Param('id') id: string, @Body() dto: CatalyseChaseDto) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found.');
    return this.catalyseChase.execute(raider.id, id, dto.slot);
  }

  // ── Best in slot marks: the raider's own "this worn item is BiS for me" (crafted, dungeon items, catalysed tier) ──

  @Get('bis-marks')
  async getBisMarks(@Req() req: Request) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) return [];
    return this.bisMarkRepo.findByRaider(raider.id);
  }

  @Put('bis-marks/:slot')
  @HttpCode(HttpStatus.OK)
  async markBis(@Req() req: Request, @Param('slot') slot: string, @Body() dto: BisMarkDto) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found.');
    if (!EQUIPMENT_SLOTS.includes(slot as EquipmentSlot)) throw new BadRequestException('Unknown slot.');
    return this.setBisMark.execute(raider.id, slot as EquipmentSlot, dto.itemId);
  }

  @Delete('bis-marks/:slot')
  @HttpCode(HttpStatus.OK)
  async unmarkBis(@Req() req: Request, @Param('slot') slot: string) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found.');
    if (!EQUIPMENT_SLOTS.includes(slot as EquipmentSlot)) throw new BadRequestException('Unknown slot.');
    return this.removeBisMark.execute(raider.id, slot as EquipmentSlot);
  }

  @Delete('chase-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeChase(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found.');
    await this.removeChaseItem.execute(raider.id, id);
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
    const user = await this.userRepo.findById(userId);
    const actorName = user?.displayName ?? userId;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found.');
    const result = await this.receivedItemRepo.save({ raiderId: raider.id, itemId: dto.itemId, tier: dto.tier });
    this.auditLog.log({
      action: 'received_item_marked',
      actorId: userId,
      actorName,
      team: user?.team ?? Team.CRUSADERS,
      raiderName: raider.characterName,
      itemName: dto.itemName ?? null,
      details: { tier: dto.tier },
    });
    return result;
  }

  @Delete('received-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReceivedItem(@Req() req: Request, @Param('id') receivedId: string) {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new NotFoundException('Raider profile not found.');
    await this.receivedItemRepo.delete(receivedId);
  }

  /** Raider IDs belonging to the same team as the given user — used to keep peer data team-scoped. */
  private async getSameTeamRaiderIds(userId: string): Promise<Set<string>> {
    const user = await this.userRepo.findById(userId);
    if (!user) return new Set();
    const [raiders, users] = await Promise.all([this.raiderRepo.findAll(), this.userRepo.findAll()]);
    const teamUserIds = new Set(users.filter((u) => u.team === user.team).map((u) => u.id));
    return new Set(raiders.filter((r) => teamUserIds.has(r.userId)).map((r) => r.id));
  }

  @Get('item-peers/:itemId')
  async getItemPeers(
    @Req() req: Request,
    @Param('itemId') itemId: string,
  ): Promise<{ characterName: string; receivedTier: string | null }[]> {
    const userId = (req.user as JwtPayload).sub;
    const season = await this.catalogRepo.findActiveSeason();
    if (!season) return [];
    const teamRaiderIds = await this.getSameTeamRaiderIds(userId);
    const reservations = await this.reservationRepo.findByItem(itemId, season.id);
    if (reservations.length === 0) return [];
    const raiderIds = [...new Set(reservations.map((r) => r.raiderId))].filter((id) => teamRaiderIds.has(id));
    const [raiders, receivedPerRaider] = await Promise.all([
      Promise.all(raiderIds.map((id) => this.raiderRepo.findById(id))),
      Promise.all(raiderIds.map((id) => this.receivedItemRepo.findByRaider(id))),
    ]);
    return raiderIds
      .map((id, i) => {
        const raider = raiders[i];
        if (!raider) return null;
        const received = receivedPerRaider[i].find((r) => r.itemId === itemId);
        return { characterName: raider.characterName, receivedTier: received?.tier ?? null };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }

  /**
   * Returns per-tier competition counts for all items the current user has reserved.
   * One batch call instead of N individual item-peers calls.
   */
  @Get('item-peer-counts')
  async getItemPeerCounts(@Req() req: Request): Promise<Record<string, Record<string, number>>> {
    const userId = (req.user as JwtPayload).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) return {};
    const season = await this.catalogRepo.findActiveSeason();
    if (!season) return {};
    const teamRaiderIds = await this.getSameTeamRaiderIds(userId);

    const [myReservations, allReservations] = await Promise.all([
      this.reservationRepo.findByRaider(raider.id, season.id),
      this.reservationRepo.findAllBySeason(season.id),
    ]);
    if (myReservations.length === 0) return {};

    const myItemIds = new Set(myReservations.map((r) => r.itemId));

    // Group other raiders' reservations by itemId — only peers within the same team count
    const itemRaiderMap = new Map<string, Set<string>>();
    for (const res of allReservations) {
      if (!myItemIds.has(res.itemId)) continue;
      if (res.raiderId === raider.id) continue;
      if (!teamRaiderIds.has(res.raiderId)) continue;
      if (!itemRaiderMap.has(res.itemId)) itemRaiderMap.set(res.itemId, new Set());
      itemRaiderMap.get(res.itemId)?.add(res.raiderId);
    }

    const uniqueRaiderIds = [...new Set([...itemRaiderMap.values()].flatMap((s) => [...s]))];
    const receivedResults = await Promise.all(uniqueRaiderIds.map((id) => this.receivedItemRepo.findByRaider(id)));
    const receivedByRaider = new Map<string, (typeof receivedResults)[0]>();
    uniqueRaiderIds.forEach((id, i) => receivedByRaider.set(id, receivedResults[i]));

    const TIER_ORDER: Record<string, number> = {
      champion_tier: 0,
      hero_tier: 1,
      myth_tier: 2,
    };
    const tiers = ['champion_tier', 'hero_tier', 'myth_tier'];

    const output: Record<string, Record<string, number>> = {};
    for (const [itemId, raiderIds] of itemRaiderMap) {
      const counts: Record<string, number> = { champion_tier: 0, hero_tier: 0, myth_tier: 0 };
      for (const raiderId of raiderIds) {
        const received = (receivedByRaider.get(raiderId) ?? []).find((r) => r.itemId === itemId);
        const receivedIdx = received ? (TIER_ORDER[received.tier] ?? -1) : -1;
        for (const tier of tiers) {
          if (receivedIdx < TIER_ORDER[tier]) counts[tier]++;
        }
      }
      output[itemId] = counts;
    }
    return output;
  }
}
