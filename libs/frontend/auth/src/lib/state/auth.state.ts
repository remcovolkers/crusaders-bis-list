import { UserRole, Team } from '@crusaders-bis-list/shared-domain';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  roles: UserRole[];
  team: Team;
  bnetLinked?: boolean;
  battletag?: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};
