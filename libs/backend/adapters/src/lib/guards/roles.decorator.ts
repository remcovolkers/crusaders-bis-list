import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@crusaders-bis-list/shared-domain';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
