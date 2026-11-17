import { ISeasonConfig, ItemLevelCaps, TrackItemLevels } from '@crusaders-bis-list/shared-domain';
import { ACTIVE_SEASON } from './active-season';

const asStringKeys = (o: Record<number, number> | undefined): Record<string, number> =>
  Object.fromEntries(Object.entries(o ?? {}).map(([key, value]) => [key, value]));

/**
 * Season rules that live in the season config (per season and team, editable by the officers) with the season
 * definition in code as the starting point: a value that was never set takes the definition's default, so a new
 * season only needs its numbers entered once it is known.
 */
export function withSeasonDefaults(config: ISeasonConfig): ISeasonConfig {
  const defaults = ACTIVE_SEASON.trackItemLevels;
  return {
    ...config,
    mythItemLevelFrom: config.mythItemLevelFrom ?? defaults?.mythFrom ?? null,
    ambiguousItemLevelFrom: config.ambiguousItemLevelFrom ?? defaults?.ambiguousFrom ?? null,
    maxItemLevel: config.maxItemLevel ?? ACTIVE_SEASON.itemLevelCaps?.maxItemLevel ?? null,
    // null = never set (take the season definition); an empty object is a deliberate "no boss gives more"
    bonusRollItemLevels: config.bonusRollItemLevels ?? asStringKeys(ACTIVE_SEASON.itemLevelCaps?.bonusRollItemLevels),
  };
}

/** Item level caps for reading the track of worn gear, or undefined when the season has none (description only). */
export function trackItemLevelsOf(config: ISeasonConfig): TrackItemLevels | undefined {
  const { mythItemLevelFrom, ambiguousItemLevelFrom } = withSeasonDefaults(config);
  if (mythItemLevelFrom == null || ambiguousItemLevelFrom == null) return undefined;
  return { mythFrom: mythItemLevelFrom, ambiguousFrom: ambiguousItemLevelFrom };
}

/** Best item levels (drops and bonus rolls) of the season, or undefined when the season has none (Myth tier = best). */
export function itemLevelCapsOf(config: ISeasonConfig): ItemLevelCaps | undefined {
  const { maxItemLevel, bonusRollItemLevels, bonusRollEnabled } = withSeasonDefaults(config);
  if (maxItemLevel == null) return undefined;
  return { maxItemLevel, bonusRollItemLevels: bonusRollItemLevels ?? {}, bonusRollEnabled };
}
