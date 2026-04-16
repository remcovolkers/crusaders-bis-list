import { UserRole } from '../enums/user-role.enum';
import { WowClass } from '../enums/wow-class.enum';
import { WowSpec } from '../enums/wow-spec.enum';
import { RaiderStatus } from '../enums/raider-status.enum';
import { IReservation, IReceivedItem } from './loot.model';

export interface IRaiderProfile {
  id: string;
  userId: string;
  characterName: string;
  realm?: string;
  wowClass: WowClass;
  spec: WowSpec;
  status: RaiderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  id: string;
  email: string;
  googleId: string;
  displayName: string;
  avatarUrl?: string;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
  /** Populated when the user has completed onboarding */
  raiderProfile?: IRaiderProfile | null;
  /** Active loot reservations for the current season */
  reservations?: IReservation[];
  /** Items already received by this user's raider */
  receivedItems?: IReceivedItem[];
}
