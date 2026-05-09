import { Controller, Post, Get, Patch, Param, Body, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../guards/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FeedbackOrmEntity } from '@crusaders-bis-list/backend-infrastructure';
import {
  SubmitFeedbackUseCase,
  GetAllFeedbackUseCase,
  ResolveFeedbackUseCase,
  UnresolveFeedbackUseCase,
} from '@crusaders-bis-list/backend-application';
import { UserRole } from '@crusaders-bis-list/shared-domain';
import { Request } from 'express';
import { JwtPayload } from '../auth/jwt.strategy';

function assertSuperAdmin(req: Request): void {
  const user = req.user as JwtPayload;
  if (!user.roles?.includes(UserRole.SUPER_ADMIN)) throw new ForbiddenException();
}

export class SubmitFeedbackDto {
  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsString()
  @MaxLength(500)
  pageContext!: string;
}

@Controller('feedback')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedbackController {
  constructor(
    private readonly submitFeedback: SubmitFeedbackUseCase,
    private readonly getAllFeedback: GetAllFeedbackUseCase,
    private readonly resolveFeedback: ResolveFeedbackUseCase,
    private readonly unresolveFeedback: UnresolveFeedbackUseCase,
  ) {}

  @Post()
  async submit(@Body() dto: SubmitFeedbackDto, @Req() req: Request): Promise<{ ok: boolean }> {
    const user = req.user as JwtPayload & { displayName?: string };
    await this.submitFeedback.execute({
      userId: user.sub,
      userEmail: user.email,
      userName: user.displayName ?? user.email,
      message: (dto.message ?? '').slice(0, 2000),
      pageContext: (dto.pageContext ?? '').slice(0, 500),
    });
    return { ok: true };
  }

  @Get()
  async getAll(@Req() req: Request): Promise<FeedbackOrmEntity[]> {
    assertSuperAdmin(req);
    return this.getAllFeedback.execute();
  }

  @Patch(':id/resolve')
  async resolve(@Param('id') id: string, @Req() req: Request): Promise<{ ok: boolean }> {
    assertSuperAdmin(req);
    await this.resolveFeedback.execute(id);
    return { ok: true };
  }

  @Patch(':id/unresolve')
  async unresolve(@Param('id') id: string, @Req() req: Request): Promise<{ ok: boolean }> {
    assertSuperAdmin(req);
    await this.unresolveFeedback.execute(id);
    return { ok: true };
  }
}
