import { MigrationInterface } from 'typeorm';
import { BeastMasterySpecFix1744761600000 } from './1744761600000-BeastMasterySpecFix';
import { PrimaryStatToArray1744848000000 } from './1744848000000-PrimaryStatToArray';
import { CreateFeedbackTable1745000000000 } from './1745000000000-CreateFeedbackTable';
import { AddFeedbackResolved1745100000000 } from './1745100000000-AddFeedbackResolved';
import { AddUserMembership1745200000000 } from './1745200000000-AddUserMembership';
import { AddBnetId1745300000000 } from './1745300000000-AddBnetId';
import { AddMergedItemsAndCleanReservations1745400000000 } from './1745400000000-AddMergedItemsAndCleanReservations';

export const MIGRATIONS: (new () => MigrationInterface)[] = [
  BeastMasterySpecFix1744761600000,
  PrimaryStatToArray1744848000000,
  CreateFeedbackTable1745000000000,
  AddFeedbackResolved1745100000000,
  AddUserMembership1745200000000,
  AddBnetId1745300000000,
  AddMergedItemsAndCleanReservations1745400000000,
];
