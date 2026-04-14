import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository, User } from '@crusaders-bis-list/backend-domain';
import { RAIDER_REPOSITORY, IRaiderRepository } from '@crusaders-bis-list/backend-domain';
import { UserRole, WowClass, WowSpec } from '@crusaders-bis-list/shared-domain';
import { ConfigService } from '@nestjs/config';

export interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

@Injectable()
export class FindOrCreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(RAIDER_REPOSITORY)
    private readonly raiderRepo: IRaiderRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(profile: GoogleProfile): Promise<User> {
    const existing = await this.userRepo.findByGoogleId(profile.googleId);
    if (existing) return existing;

    const adminEmails = (this.config.get<string>('ADMIN_EMAILS') ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin = adminEmails.includes(profile.email.toLowerCase());
    const roles = isAdmin ? [UserRole.RAIDER, UserRole.ADMIN] : [UserRole.RAIDER];

    const newUser = new User();
    newUser.googleId = profile.googleId;
    newUser.email = profile.email;
    newUser.displayName = profile.displayName;
    newUser.avatarUrl = profile.avatarUrl;
    newUser.roles = roles;
    newUser.createdAt = new Date();
    newUser.updatedAt = new Date();

    const savedUser = await this.userRepo.save(newUser);

    // Auto-create raider profile with display name as placeholder
    await this.raiderRepo.save({
      userId: savedUser.id,
      characterName: profile.displayName,
      wowClass: WowClass.WARRIOR,
      spec: WowSpec.ARMS,
    });

    return savedUser;
  }
}

@Injectable()
export class ManageUserRolesUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async setRoles(targetUserId: string, roles: UserRole[]): Promise<User> {
    const user = await this.userRepo.findById(targetUserId);
    if (!user) throw new NotFoundException('User not found');
    return this.userRepo.updateRoles(targetUserId, roles);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepo.findAll();
  }
}
