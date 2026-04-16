import { AssignmentStatus } from '../enums/assignment-status.enum';

export const TIER_LABELS: Record<AssignmentStatus, string> = {
  [AssignmentStatus.CHAMPION_TIER]: 'Champion',
  [AssignmentStatus.HERO_TIER]: 'Hero',
  [AssignmentStatus.MYTH_TIER]: 'Myth',
};
