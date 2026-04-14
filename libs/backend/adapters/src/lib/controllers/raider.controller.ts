import {
  Controller, Get, Post, Delete, Param, Body, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../guards/auth.guard';
import {
  ReserveItemUseCase,
  CancelReservationUseCase,
  GetRaidCatalogUseCase,
} from '@crusaders-bis-list/backend-application';
import { RAIDER_REPOSITORY, IRaiderRepository } from '@crusaders-bis-list/backend-domain';
import { Inject } from '@nestjs/common';
import { IsString, IsUUID } from 'class-validator';

export class ReserveItemDto {
  @IsUUID()
  itemId: string;

  @IsUUID()
  raidSeasonId: string;
}

export class CreateRaiderProfileDto {
  @IsString()
  characterName: string;

  @IsString()
  wowClass: string;

  @IsString()
  spec: string;
}

@Controller('raider')
@UseGuards(JwtAuthGuard)
export class RaiderController {
  constructor(
    private readonly reserveItem: ReserveItemUseCase,
    private readonly cancelReservation: CancelReservationUseCase,
    private readonly getRaidCatalog: GetRaidCatalogUseCase,
    @Inject(RAIDER_REPOSITORY) private readonly raiderRepo: IRaiderRepository,
  ) {}

  @Get('my-profile')
  async getMyProfile(@Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.raiderRepo.findByUserId(userId);
  }

  @Post('profile')
  async createProfile(@Req() req: Request, @Body() dto: CreateRaiderProfileDto) {
    const userId = (req.user as any).sub;
    return this.raiderRepo.save({
      userId,
      characterName: dto.characterName,
      wowClass: dto.wowClass as any,
      spec: dto.spec as any,
    });
  }

  @Get('catalog')
  async getCatalog() {
    return this.getRaidCatalog.getActiveSeasonWithBossesAndItems();
  }

  @Post('reservations')
  @HttpCode(HttpStatus.CREATED)
  async reserve(@Req() req: Request, @Body() dto: ReserveItemDto) {
    const userId = (req.user as any).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    if (!raider) throw new Error('Raider profile not found. Please create your profile first.');
    await this.reserveItem.execute(raider.id, dto.itemId, dto.raidSeasonId);
    return { message: 'Reserved successfully' };
  }

  @Delete('reservations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReservation(@Req() req: Request, @Param('id') reservationId: string) {
    const userId = (req.user as any).sub;
    const raider = await this.raiderRepo.findByUserId(userId);
    await this.cancelReservation.execute(reservationId, raider?.id ?? '');
  }
}
