import { UserRole } from '@crusaders-bis-list/shared-domain';

export class User {
  id!: string;
  email!: string;
  googleId!: string;
  displayName!: string;
  avatarUrl?: string;
  roles!: UserRole[];
  createdAt!: Date;
  updatedAt!: Date;

  hasRole(role: UserRole): boolean {
    return this.roles.includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }
}
