import { Controller, Get, Post, Req, Res, UseGuards, Body, Param, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../guards/auth.guard';
import { FindOrCreateUserUseCase, ManageUserRolesUseCase } from '@crusaders-bis-list/backend-application';
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
    private readonly findOrCreateUser: FindOrCreateUserUseCase,
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
