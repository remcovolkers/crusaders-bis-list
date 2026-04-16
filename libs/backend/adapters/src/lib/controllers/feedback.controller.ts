import { Controller, Post, Get, Patch, Param, Body, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../guards/auth.guard';
import { FeedbackRepository, FeedbackOrmEntity } from '@crusaders-bis-list/backend-infrastructure';
import { Request } from 'express';
import { JwtPayload } from '../auth/jwt.strategy';

const SUPER_EMAIL = 'remco.volkers1@gmail.com';

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
export class FeedbackController {
  constructor(private readonly feedbackRepo: FeedbackRepository) {}

  @Post()
  async submit(@Body() dto: SubmitFeedbackDto, @Req() req: Request): Promise<{ ok: boolean }> {
    const user = req.user as JwtPayload & { displayName?: string };
    await this.feedbackRepo.create({
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
    const user = req.user as JwtPayload;
    if (user.email !== SUPER_EMAIL) throw new ForbiddenException();
    return this.feedbackRepo.findAll();
  }

  @Patch(':id/resolve')
  async resolve(@Param('id') id: string, @Req() req: Request): Promise<{ ok: boolean }> {
    const user = req.user as JwtPayload;
    if (user.email !== SUPER_EMAIL) throw new ForbiddenException();
    await this.feedbackRepo.resolve(id);
    return { ok: true };
  }

  @Patch(':id/unresolve')
  async unresolve(@Param('id') id: string, @Req() req: Request): Promise<{ ok: boolean }> {
    const user = req.user as JwtPayload;
    if (user.email !== SUPER_EMAIL) throw new ForbiddenException();
    await this.feedbackRepo.unresolve(id);
    return { ok: true };
  }
}
