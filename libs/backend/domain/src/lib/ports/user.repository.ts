import { User } from '../entities/user.entity';
import { Team } from '@crusaders-bis-list/shared-domain';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByBnetId(bnetId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
  updateRoles(userId: string, roles: import('@crusaders-bis-list/shared-domain').UserRole[]): Promise<User>;
  updateTeam(userId: string, team: Team): Promise<User>;
  updateBnetAccount(
    userId: string,
    bnetId: string | null,
    battletag: string | null,
    accessToken: string | null,
  ): Promise<User>;
  delete(id: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
