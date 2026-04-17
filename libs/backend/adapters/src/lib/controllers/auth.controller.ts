import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Next,
  UseGuards,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Inject,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    linkUserId?: string;
  }
}

import * as passportLib from 'passport';
const passport = (passportLib as { default?: typeof passportLib }).default ?? passportLib;
import { JwtAuthGuard } from '../guards/auth.guard';
import { ManageUserRolesUseCase } from '@crusaders-bis-list/backend-application';
import { Roles } from '../guards/roles.decorator';
import { UserRole } from '@crusaders-bis-list/shared-domain';
import { User, IUserRepository, USER_REPOSITORY } from '@crusaders-bis-list/backend-domain';
import { IsArray, IsEnum } from 'class-validator';

export class UpdateRolesDto {
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles!: UserRole[];
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,

    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(): void {
    // Redirect handled by Passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response): void {
    const user = req.user as User;
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      isCrusadersMember: user.isCrusadersMember,
    });
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:4200';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  @Post('bnet/link/init')
  @UseGuards(JwtAuthGuard)
  bnetLinkInit(@Req() req: Request): { linkToken: string } {
    const user = req.user as { sub: string };
    const linkToken = this.jwtService.sign({ sub: user.sub }, { expiresIn: '5m' });
    return { linkToken };
  }

  @Get('bnet/oauth-start')
  async bnetOauthStart(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
    @Query('lt') linkToken: string,
  ): Promise<void> {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(linkToken);
      req.session.linkUserId = payload.sub;
      await new Promise<void>((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
    } catch {
      res.status(401).json({ message: 'Invalid or expired link token' });
      return;
    }
    (passport.authenticate('bnet') as (req: Request, res: Response, next: NextFunction) => void)(req, res, next);
  }

  @Get('bnet/callback')
  @UseGuards(AuthGuard('bnet'))
  bnetCallback(@Req() req: Request, @Res() res: Response): void {
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:4200';
    delete req.session.linkUserId;
    res.redirect(`${frontendUrl}/onboarding?bnet_linked=1`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request) {
    const payload = req.user as { sub: string };
    const user = await this.userRepo.findById(payload.sub);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      roles: user.roles,
      isCrusadersMember: user.isCrusadersMember,
      bnetLinked: !!user.bnetId,
      battletag: user.battletag ?? null,
    };
  }
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class UserManagementController {
  constructor(private readonly manageRoles: ManageUserRolesUseCase) {}

  @Get()
  getAll() {
    return this.manageRoles.getAllUsers();
  }

  @Post(':id/roles')
  @HttpCode(HttpStatus.OK)
  updateRoles(@Param('id') id: string, @Body() dto: UpdateRolesDto) {
    return this.manageRoles.setRoles(id, dto.roles);
  }
}
