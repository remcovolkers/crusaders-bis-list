import { Team } from '../enums/team.enum';

export interface ISeasonConfig {
  id: string;
  raidSeasonId: string;
  team: Team;
  trinketLimit: number;
  weaponLimit: number;
  jewelryLimit: number;
  armorLimit: number;
  superrareLimit: number;
  /**
   * Item level from which gear is certainly Myth (see TrackItemLevels). Null = not set (no item level rules).
   * The values the API returns are filled in from the season definition when nothing is stored yet.
   */
  mythItemLevelFrom: number | null;
  /** Item level from which a piece can be Hero 6/6 or Myth 2/6 (the item description decides). Null = not set. */
  ambiguousItemLevelFrom: number | null;
  /** Whether this season has bonus rolls: raiders can then chase an item "met bonusrol". */
  bonusRollEnabled: boolean;
  /** Highest item level a boss drop gives (e.g. 334). Null = not set (best in slot = Myth tier). */
  maxItemLevel: number | null;
  /**
   * Per boss (Blizzard encounter id): the item level a bonus roll can give when that is higher than `maxItemLevel`
   * (e.g. 344 on the last two bosses). Null = never set; the API then returns the season defaults. An empty object
   * means "no boss gives more".
   */
  bonusRollItemLevels: Record<string, number> | null;
}

export interface UpdateSeasonConfigDto {
  trinketLimit: number;
  weaponLimit: number;
  jewelryLimit: number;
  armorLimit: number;
  superrareLimit: number;
  mythItemLevelFrom?: number | null;
  ambiguousItemLevelFrom?: number | null;
  bonusRollEnabled?: boolean;
  maxItemLevel?: number | null;
  bonusRollItemLevels?: Record<string, number>;
}
