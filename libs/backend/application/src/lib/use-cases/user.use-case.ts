import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository, User } from '@crusaders-bis-list/backend-domain';
import { UserRole } from '@crusaders-bis-list/shared-domain';
import { ConfigService } from '@nestjs/config';

export interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface BnetProfile {
  bnetId: string;
  battletag: string;
}

@Injectable()
export class FindOrCreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
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

    return this.userRepo.save(newUser);
  }

  async executeWithBnet(profile: BnetProfile): Promise<User> {
    const existing = await this.userRepo.findByBnetId(profile.bnetId);
    if (existing) return existing;

    const newUser = new User();
    newUser.bnetId = profile.bnetId;
    newUser.email = `${profile.battletag.replace('#', '-')}@bnet.local`;
    newUser.displayName = profile.battletag;
    newUser.roles = [UserRole.RAIDER];
    newUser.createdAt = new Date();
    newUser.updatedAt = new Date();

    return this.userRepo.save(newUser);
  }
}

@Injectable()
export class LinkBnetUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(userId: string, bnetId: string, battletag: string, accessToken: string): Promise<User> {
    const existing = await this.userRepo.findByBnetId(bnetId);
    if (existing && existing.id !== userId) {
      throw new ConflictException('Dit Battle.net account is al gekoppeld aan een ander account.');
    }
    return this.userRepo.updateBnetAccount(userId, bnetId, battletag, accessToken);
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
