import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
  updateRoles(userId: string, roles: import('@crusaders-bis-list/shared-domain').UserRole[]): Promise<User>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
