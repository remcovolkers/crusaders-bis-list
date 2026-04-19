import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  NotFoundException,
  UseGuards,
  MessageEvent,
  Res,
  Sse,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Response } from 'express';
import { JwtAuthGuard, RolesGuard } from '../guards/auth.guard';
import { Roles } from '../guards/roles.decorator';
import { RollSessionService } from '@crusaders-bis-list/backend-application';
import { UserRole } from '@crusaders-bis-list/shared-domain';
import { CreateRollSessionDto } from './dto/roll.dto';

@Controller('roll-sessions')
export class RollController {
  constructor(private readonly rollSessionService: RollSessionService) {}

  /** Admin creates a new session */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRollSessionDto): { sessionId: string } {
    const sessionId = this.rollSessionService.create(
      dto.itemName,
      dto.itemIconUrl,
      dto.secondaryIconUrl,
      dto.difficulty,
      dto.bossId,
      dto.raiders,
    );
    return { sessionId };
  }

  /** Admin starts the roll */
  @Post(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  start(@Param('id') id: string): void {
    const started = this.rollSessionService.startRoll(id);
    if (!started) throw new NotFoundException('Sessie niet gevonden of al gestart');
  }

  /** Anyone with the link can get session info */
  @Get(':id')
  getInfo(@Param('id') id: string) {
    const info = this.rollSessionService.getInfo(id);
    if (!info) throw new NotFoundException('Sessie niet gevonden');
    return info;
  }

  /** SSE stream — no auth, public by design */
  @Sse(':id/stream')
  stream(@Param('id') id: string, @Res() res: Response): Observable<MessageEvent> {
    const obs = this.rollSessionService.getStream(id);
    if (!obs) throw new NotFoundException('Sessie niet gevonden');

    // Keep connection alive on Render (30s keep-alive ping)
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    return obs.pipe(map((event) => ({ data: event }) as MessageEvent));
  }
}
