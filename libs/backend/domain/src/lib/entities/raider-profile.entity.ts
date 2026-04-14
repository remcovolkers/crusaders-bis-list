import { WowClass, WowSpec, RaiderStatus } from '@crusaders-bis-list/shared-domain';

export class RaiderProfile {
  id!: string;
  userId!: string;
  characterName!: string;
  wowClass!: WowClass;
  spec!: WowSpec;
  status!: RaiderStatus;
  createdAt!: Date;
  updatedAt!: Date;

  isActive(): boolean {
    return this.status === RaiderStatus.ACTIVE || this.status === RaiderStatus.TRIAL;
  }
}
