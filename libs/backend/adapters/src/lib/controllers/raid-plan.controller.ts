import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
} from '@crusaders-bis-list/backend-application';
import { RAID_CATALOG_REPOSITORY, IRaidCatalogRepository } from '@crusaders-bis-list/backend-domain';
import { Request } from 'express';
import { JwtPayload } from '../auth/jwt.strategy';
import { CreateRaidPlanDto, UpdateRaidPlanDto } from './dto/raid-plan.dto';

const SUPER_EMAIL = 'remco.volkers1@gmail.com';

function assertSuperUser(req: Request): void {
  const user = req.user as JwtPayload;
  if (user.email !== SUPER_EMAIL) throw new ForbiddenException();
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
    @Inject(RAID_CATALOG_REPOSITORY)
    private readonly catalogRepo: IRaidCatalogRepository,
  ) {}

  @Get('seasons')
  async getSeasons(@Req() req: Request) {
    assertSuperUser(req);
    return this.catalogRepo.findAllSeasons();
  }

  @Get()
  list(@Req() req: Request) {
    assertSuperUser(req);
    return this.getPlans.execute();
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    assertSuperUser(req);
    return this.getPlan.execute(id);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateRaidPlanDto) {
    assertSuperUser(req);
    return this.createPlan.execute(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateRaidPlanDto) {
    assertSuperUser(req);
    return this.updatePlan.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string) {
    assertSuperUser(req);
    await this.deletePlan.execute(id);
  }

  @Post(':id/notify')
  @HttpCode(HttpStatus.OK)
  async notify(@Req() req: Request, @Param('id') id: string) {
    assertSuperUser(req);
    await this.notifyDiscord.execute(id);
    return { ok: true };
  }
}
