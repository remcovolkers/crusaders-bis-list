import { ChaseMethod, RaidDifficulty } from '@crusaders-bis-list/shared-domain';
import { buildGearingPlan, planActionOf, planDifficultyOf, PlanSource } from './gearing-plan';

const { BOSS_DROP, BONUS_ROLL } = ChaseMethod;

const source = (over: Partial<PlanSource> = {}): PlanSource => ({
  name: 'Item',
  bossName: 'Boss A',
  kind: 'chased',
  isBis: false,
  upgradeTo: null,
  methods: [BOSS_DROP],
  ...over,
});

describe('planActionOf', () => {
  it('says what to do for a chase, depending on how the item is chased', () => {
    expect(planActionOf(source({ methods: [BOSS_DROP] }))).toBe('drop');
    expect(planActionOf(source({ methods: [BONUS_ROLL] }))).toBe('bonus_roll');
    expect(planActionOf(source({ methods: [BOSS_DROP, BONUS_ROLL] }))).toBe('drop_bonus');
  });

  it('treats a chase without methods as a boss drop', () => {
    expect(planActionOf(source({ methods: [] }))).toBe('drop');
  });

  it('lists a reserved item that is not best in slot yet as reserved', () => {
    expect(planActionOf(source({ kind: 'reserved', methods: [] }))).toBe('reserved');
  });

  it('has nothing to do for a best-in-slot item, except a bonus roll upgrade the raider plans', () => {
    expect(planActionOf(source({ isBis: true }))).toBeNull();
    expect(planActionOf(source({ kind: 'reserved', isBis: true, methods: [] }))).toBeNull();
    expect(planActionOf(source({ isBis: true, methods: [BONUS_ROLL], upgradeTo: 344 }))).toBe('upgrade');
    expect(planActionOf(source({ kind: 'reserved', isBis: true, methods: [BONUS_ROLL], upgradeTo: 344 }))).toBe('upgrade');
    // a bonus roll chase on a BiS item that cannot be upgraded any more is done
    expect(planActionOf(source({ isBis: true, methods: [BONUS_ROLL], upgradeTo: null }))).toBeNull();
  });
});

describe('buildGearingPlan', () => {
  const order = ['Boss A', 'Boss B', 'Boss C'];

  it('groups per boss in the order the bosses are fought, and per action in a fixed order', () => {
    const plan = buildGearingPlan(
      [
        source({ name: 'Zeta', bossName: 'Boss C', methods: [BONUS_ROLL] }),
        source({ name: 'Beta', bossName: 'Boss A', methods: [BONUS_ROLL] }),
        source({ name: 'Alpha', bossName: 'Boss A', methods: [BONUS_ROLL] }),
        source({ name: 'Gamma', bossName: 'Boss A', methods: [BOSS_DROP] }),
        source({ name: 'Delta', bossName: 'Boss A', kind: 'reserved', methods: [] }),
      ],
      order,
    );
    expect(plan.bosses.map((b) => b.bossName)).toEqual(['Boss A', 'Boss C']);
    expect(plan.bosses[0].groups.map((g) => g.action)).toEqual(['reserved', 'drop', 'bonus_roll']);
    // items inside a group are alphabetical
    expect(plan.bosses[0].groups[2].items.map((i) => i.name)).toEqual(['Alpha', 'Beta']);
    expect(plan.bosses[0].count).toBe(4);
  });

  it('counts the items per action and leaves out items with nothing to do', () => {
    const plan = buildGearingPlan(
      [
        source({ name: 'A', methods: [BONUS_ROLL] }),
        source({ name: 'B', methods: [BOSS_DROP, BONUS_ROLL] }),
        source({ name: 'C', isBis: true }),
        source({ name: 'D', isBis: true, methods: [BONUS_ROLL], upgradeTo: 344 }),
      ],
      order,
    );
    expect(plan.totals).toEqual({ reserved: 0, drop: 0, bonus_roll: 1, drop_bonus: 1, upgrade: 1 });
    expect(plan.itemCount).toBe(3);
    const upgrade = plan.bosses[0].groups.find((g) => g.action === 'upgrade');
    expect(upgrade?.items[0].upgradeTo).toBe(344);
  });

  it('puts bosses that are not in the boss order last and returns an empty plan for no items', () => {
    const plan = buildGearingPlan([source({ bossName: 'Unknown' }), source({ bossName: 'Boss B' })], order);
    expect(plan.bosses.map((b) => b.bossName)).toEqual(['Boss B', 'Unknown']);
    expect(buildGearingPlan([], order)).toEqual({
      bosses: [],
      totals: { reserved: 0, drop: 0, bonus_roll: 0, drop_bonus: 0, upgrade: 0 },
      itemCount: 0,
    });
  });
});

describe('planDifficultyOf', () => {
  const { HEROIC, MYTHIC } = RaidDifficulty;

  it('uses the way of getting the item that belongs to the action', () => {
    const needs = { drop: MYTHIC, bonusRoll: HEROIC };
    expect(planDifficultyOf('drop', needs).difficulty).toBe(MYTHIC);
    expect(planDifficultyOf('reserved', needs).difficulty).toBe(MYTHIC);
    expect(planDifficultyOf('bonus_roll', needs).difficulty).toBe(HEROIC);
    expect(planDifficultyOf('upgrade', { drop: null, bonusRoll: MYTHIC }).difficulty).toBe(MYTHIC);
  });

  it('takes the lowest difficulty that helps when the item is chased both ways, and explains both', () => {
    const result = planDifficultyOf('drop_bonus', { drop: MYTHIC, bonusRoll: HEROIC });
    expect(result.difficulty).toBe(HEROIC);
    expect(result.hint).toBe('Drop: Mythic only · Bonus roll: Heroic or Mythic');
    expect(planDifficultyOf('drop_bonus', { drop: MYTHIC, bonusRoll: null }).difficulty).toBe(MYTHIC);
  });

  it('has no difficulty without needs, and passes it on to the plan items', () => {
    expect(planDifficultyOf('drop', undefined)).toEqual({ difficulty: null, hint: null });
    const plan = buildGearingPlan(
      [source({ name: 'Weapon', methods: [BONUS_ROLL], isBis: true, upgradeTo: 344, needs: { drop: null, bonusRoll: MYTHIC } })],
      ['Boss A'],
    );
    expect(plan.bosses[0].groups[0].items[0]).toMatchObject({ action: 'upgrade', difficulty: MYTHIC, difficultyHint: 'Mythic only' });
  });
});
