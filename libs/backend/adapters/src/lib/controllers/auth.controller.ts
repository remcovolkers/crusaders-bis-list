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
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import * as passportLib from 'passport';
const passport = (passportLib as { default?: typeof passportLib }).default ?? passportLib;
import { JwtAuthGuard } from '../guards/auth.guard';
import { ManageUserRolesUseCase } from '@crusaders-bis-list/backend-application';
import { Roles } from '../guards/roles.decorator';
import { UserRole } from '@crusaders-bis-list/shared-domain';
import { User, IUserRepository, USER_REPOSITORY } from '@crusaders-bis-list/backend-domain';
import { IsArray, IsEnum, IsString } from 'class-validator';

export class UpdateRolesDto {
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles!: UserRole[];
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
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
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, roles: user.roles, isCrusadersMember: user.isCrusadersMember },
      { expiresIn: '1h' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '365d' },
    );
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:4200';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&rt=${encodeURIComponent(refreshToken)}`);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshDto): Promise<{ token: string }> {
    try {
      const payload = this.jwtService.verify<{ sub: string; type?: string }>(dto.refreshToken);
      if (payload.type !== 'refresh') throw new Error('Invalid token type');
      const user = await this.userRepo.findById(payload.sub);
      if (!user) throw new Error('User not found');
      const token = this.jwtService.sign(
        { sub: user.id, email: user.email, roles: user.roles, isCrusadersMember: user.isCrusadersMember },
        { expiresIn: '1h' },
      );
      return { token };
    } catch {
      throw new UnauthorizedException('Ongeldige of verlopen refresh token');
    }
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
      this.jwtService.verify<{ sub: string }>(linkToken);
    } catch {
      res.status(401).json({ message: 'Invalid or expired link token' });
      return;
    }
    // Pass the linkToken as the OAuth state — Blizzard will return it in the callback
    (passport.authenticate('bnet', { state: linkToken }) as (req: Request, res: Response, next: NextFunction) => void)(
      req,
      res,
      next,
    );
  }

  @Get('bnet/callback')
  @UseGuards(AuthGuard('bnet'))
  bnetCallback(@Res() res: Response): void {
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:4200';
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
