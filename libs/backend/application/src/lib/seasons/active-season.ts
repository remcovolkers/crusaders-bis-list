import { SeasonDefinition } from './season-definition.types';
import { MIDNIGHT_T35_SEASON } from './midnight-t35.season';

/**
 * The season that will be synced when the admin triggers a Blizzard sync.
 *
 * ── Updating for a new season ──────────────────────────────────────────────
 *  1. Create `<expansion>-t<tier>.season.ts` in this folder.
 *  2. Change the import and the export below to point at the new season.
 *  3. Decide whether to keep old seasons active in the DB or set isActive=false
 *     for them (the sync always sets the synced season to isActive: true).
 */
export const ACTIVE_SEASON: SeasonDefinition = MIDNIGHT_T35_SEASON;
