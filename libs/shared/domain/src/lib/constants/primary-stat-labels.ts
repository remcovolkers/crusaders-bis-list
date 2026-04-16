import { PrimaryStat } from '../enums/primary-stat.enum';

export const PRIMARY_STAT_LABELS: Record<PrimaryStat, string> = {
  [PrimaryStat.STRENGTH]: 'Str',
  [PrimaryStat.AGILITY]: 'Agi',
  [PrimaryStat.INTELLECT]: 'Int',
};
