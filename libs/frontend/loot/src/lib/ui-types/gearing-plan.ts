import { ChaseMethod, IItemTooltip, RaidDifficulty } from '@crusaders-bis-list/shared-domain';

/**
 * The raider's gearing plan, grouped by boss: what to do where. Built from the items they reserved or chased (and from
 * best-in-slot items that a bonus roll can still upgrade). Pure functions only, so they are fully unit-testable.
 */

/** What the raider has to do for an item. */
export type PlanAction = 'reserved' | 'drop' | 'bonus_roll' | 'drop_bonus' | 'upgrade';

/** Order in which the actions are listed within a boss. */
export const PLAN_ACTION_ORDER: readonly PlanAction[] = ['reserved', 'drop', 'drop_bonus', 'bonus_roll', 'upgrade'];

/** What the plan needs to know about a reserved or chased item. */
export interface PlanSource {
  name: string;
  iconUrl?: string;
  /** Hover text and the tier token the item comes from (see the item tooltip). */
  tooltip?: IItemTooltip;
  via?: string;
  bossName: string;
  kind: 'reserved' | 'chased';
  /** Best in slot already (nothing left to do, apart from a possible bonus roll upgrade). */
  isBis: boolean;
  /** Item level a bonus roll could still upgrade the item to, else null. */
  upgradeTo: number | null;
  /** How the raider hopes to get a chased item. */
  methods: ChaseMethod[];
  /** What the raider wears in that slot now, e.g. "Hero · 321". */
  currently?: string | null;
  /** From which difficulty a drop / bonus roll still improves what the raider has (null = unknown or nothing). */
  needs?: { drop: RaidDifficulty | null; bonusRoll: RaidDifficulty | null };
}

export interface PlanItem {
  name: string;
  iconUrl?: string;
  tooltip?: IItemTooltip;
  via?: string;
  action: PlanAction;
  upgradeTo: number | null;
  currently: string | null;
  /**
   * From which difficulty the action helps: HEROIC = Heroic or Mythic, MYTHIC = only Mythic, null = not known.
   * E.g. with a 341 piece only a Mythic bonus roll (344) helps; with a Hero piece a Heroic bonus roll already helps.
   */
  difficulty: RaidDifficulty | null;
  /** Longer explanation of the difficulty (for a tooltip). */
  difficultyHint: string | null;
}

export interface PlanGroup {
  action: PlanAction;
  items: PlanItem[];
}

export interface PlanBoss {
  bossName: string;
  groups: PlanGroup[];
  count: number;
}

export interface GearingPlan {
  bosses: PlanBoss[];
  /** Number of items per action. */
  totals: Record<PlanAction, number>;
  itemCount: number;
}

const needText = (d: RaidDifficulty | null): string =>
  d === RaidDifficulty.MYTHIC ? 'Mythic only' : d === RaidDifficulty.HEROIC ? 'Heroic or Mythic' : 'nothing better';

/** The difficulty an action needs: the lowest one that helps (Heroic before Mythic), plus a tooltip text. */
export function planDifficultyOf(
  action: PlanAction,
  needs: PlanSource['needs'],
): { difficulty: RaidDifficulty | null; hint: string | null } {
  if (!needs) return { difficulty: null, hint: null };
  const way = action === 'bonus_roll' || action === 'upgrade' ? needs.bonusRoll : needs.drop;
  if (action !== 'drop_bonus') return { difficulty: way, hint: way ? needText(way) : null };
  const both = [needs.drop, needs.bonusRoll].filter((d): d is RaidDifficulty => d !== null);
  const difficulty = both.includes(RaidDifficulty.HEROIC) ? RaidDifficulty.HEROIC : (both[0] ?? null);
  return { difficulty, hint: `Drop: ${needText(needs.drop)} · Bonus roll: ${needText(needs.bonusRoll)}` };
}

/** The action for an item, or null when there is nothing left to do for it. */
export function planActionOf(source: PlanSource): PlanAction | null {
  const wantsBonusRoll = source.methods.includes(ChaseMethod.BONUS_ROLL);
  const wantsDrop = source.methods.includes(ChaseMethod.BOSS_DROP) || source.methods.length === 0;
  // Best in slot: only a bonus roll upgrade can be left to do
  if (source.isBis) return wantsBonusRoll && source.upgradeTo ? 'upgrade' : null;
  if (source.kind === 'reserved') return 'reserved';
  if (wantsDrop && wantsBonusRoll) return 'drop_bonus';
  return wantsBonusRoll ? 'bonus_roll' : 'drop';
}

/**
 * Groups the open items per boss, in the order the bosses are fought, and the actions per boss in a fixed order.
 * Items without anything left to do are left out.
 */
export function buildGearingPlan(sources: PlanSource[], bossOrder: string[]): GearingPlan {
  const totals: Record<PlanAction, number> = { reserved: 0, drop: 0, bonus_roll: 0, drop_bonus: 0, upgrade: 0 };
  const byBoss = new Map<string, Map<PlanAction, PlanItem[]>>();

  for (const source of sources) {
    const action = planActionOf(source);
    if (!action) continue;
    totals[action]++;
    const actions = byBoss.get(source.bossName) ?? new Map<PlanAction, PlanItem[]>();
    const items = actions.get(action) ?? [];
    const { difficulty, hint } = planDifficultyOf(action, source.needs);
    items.push({
      name: source.name,
      iconUrl: source.iconUrl,
      tooltip: source.tooltip,
      via: source.via,
      action,
      upgradeTo: action === 'upgrade' ? source.upgradeTo : null,
      currently: source.currently ?? null,
      difficulty,
      difficultyHint: hint,
    });
    actions.set(action, items);
    byBoss.set(source.bossName, actions);
  }

  const rank = (boss: string): number => {
    const i = bossOrder.indexOf(boss);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  const bosses: PlanBoss[] = [...byBoss.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([bossName, actions]) => {
      const groups = PLAN_ACTION_ORDER.filter((a) => actions.has(a)).map((action) => ({
        action,
        items: (actions.get(action) ?? []).sort((x, y) => x.name.localeCompare(y.name)),
      }));
      return { bossName, groups, count: groups.reduce((n, g) => n + g.items.length, 0) };
    });

  return { bosses, totals, itemCount: Object.values(totals).reduce((a, b) => a + b, 0) };
}
