import { ConflictException } from '@nestjs/common';
import { SetChaseItemUseCase } from '@crusaders-bis-list/backend-application';
import { AssignmentStatus, ChaseMethod, Team } from '@crusaders-bis-list/shared-domain';

const { BOSS_DROP, BONUS_ROLL } = ChaseMethod;

function build(
  options: {
    bonusRollEnabled?: boolean;
    existing?: { id: string; methods: ChaseMethod[] } | null;
    reserved?: boolean;
    receivedTier?: AssignmentStatus | null;
  } = {},
) {
  const saved: unknown[] = [];
  const changed: { id: string; methods: ChaseMethod[] }[] = [];
  const deleted: string[] = [];
  const chaseRepo = {
    findExisting: jest.fn().mockResolvedValue(options.existing ? { ...options.existing, itemId: 'i1' } : null),
    save: jest.fn().mockImplementation(async (d) => (saved.push(d), { id: 'new', ...d })),
    updateMethods: jest.fn().mockImplementation(async (id, methods) => (changed.push({ id, methods }), { id, methods })),
    delete: jest.fn().mockImplementation(async (id) => void deleted.push(id)),
  };
  const useCase = new SetChaseItemUseCase(
    chaseRepo as never,
    { findItemById: jest.fn().mockResolvedValue({ id: 'i1', isPrioritizable: true, itemLevel: 300 }) } as never,
    { findExisting: jest.fn().mockResolvedValue(options.reserved ? { id: 'res' } : null) } as never,
    { findOrCreateDefault: jest.fn().mockResolvedValue({ bonusRollEnabled: options.bonusRollEnabled ?? true }) } as never,
    { findByRaiderAndItem: jest.fn().mockResolvedValue(options.receivedTier ? { tier: options.receivedTier } : null) } as never,
  );
  const run = (methods: ChaseMethod[]) => useCase.execute('r1', 'i1', 's1', Team.CRUSADERS, methods);
  return { run, saved, changed, deleted };
}

describe('SetChaseItemUseCase', () => {
  it('chases for a boss drop', async () => {
    const { run, saved } = build();
    await run([BOSS_DROP]);
    expect(saved).toEqual([{ raiderId: 'r1', itemId: 'i1', raidSeasonId: 's1', methods: [BOSS_DROP] }]);
  });

  it('chases with a bonus roll when the season has bonus rolls', async () => {
    const { run, saved } = build({ bonusRollEnabled: true });
    await run([BONUS_ROLL]);
    expect(saved).toEqual([{ raiderId: 'r1', itemId: 'i1', raidSeasonId: 's1', methods: [BONUS_ROLL] }]);
  });

  it('chases for a boss drop AND a bonus roll at the same time', async () => {
    const { run, saved } = build();
    await run([BOSS_DROP, BONUS_ROLL, BOSS_DROP]);
    expect(saved).toEqual([{ raiderId: 'r1', itemId: 'i1', raidSeasonId: 's1', methods: [BOSS_DROP, BONUS_ROLL] }]);
  });

  it('refuses a bonus roll in a season without bonus rolls, but still allows boss drops', async () => {
    const { run } = build({ bonusRollEnabled: false });
    await expect(run([BONUS_ROLL])).rejects.toBeInstanceOf(ConflictException);
    await expect(run([BOSS_DROP, BONUS_ROLL])).rejects.toBeInstanceOf(ConflictException);
    await expect(run([BOSS_DROP])).resolves.toBeDefined();
  });

  it('changes the methods of an item that is already chased instead of adding a second entry', async () => {
    const { run, saved, changed } = build({ existing: { id: 'c1', methods: [BOSS_DROP] } });
    await run([BOSS_DROP, BONUS_ROLL]);
    expect(saved).toEqual([]);
    expect(changed).toEqual([{ id: 'c1', methods: [BOSS_DROP, BONUS_ROLL] }]);
  });

  it('is idempotent for the same methods, whatever their order', async () => {
    const { run, saved, changed } = build({ existing: { id: 'c1', methods: [BOSS_DROP, BONUS_ROLL] } });
    await run([BONUS_ROLL, BOSS_DROP]);
    expect(saved).toEqual([]);
    expect(changed).toEqual([]);
  });

  it('removes the chase when no method is left', async () => {
    const { run, deleted } = build({ existing: { id: 'c1', methods: [BOSS_DROP, BONUS_ROLL] } });
    await expect(run([])).resolves.toBeNull();
    expect(deleted).toEqual(['c1']);
  });

  it('does nothing when asked to remove a chase that is not there', async () => {
    const { run, deleted } = build();
    await expect(run([])).resolves.toBeNull();
    expect(deleted).toEqual([]);
  });

  it('allows a bonus-roll upgrade chase on a reserved item that is already on Myth tier', async () => {
    const { run, saved } = build({ reserved: true, receivedTier: AssignmentStatus.MYTH_TIER });
    await run([BONUS_ROLL]);
    expect(saved).toEqual([{ raiderId: 'r1', itemId: 'i1', raidSeasonId: 's1', methods: [BONUS_ROLL] }]);
  });

  it('still refuses a chase on a reserved item that is not on Myth tier yet, or that includes a boss drop', async () => {
    const hero = build({ reserved: true, receivedTier: AssignmentStatus.HERO_TIER });
    await expect(hero.run([BONUS_ROLL])).rejects.toBeInstanceOf(ConflictException);
    const myth = build({ reserved: true, receivedTier: AssignmentStatus.MYTH_TIER });
    await expect(myth.run([BOSS_DROP])).rejects.toBeInstanceOf(ConflictException);
    await expect(myth.run([BOSS_DROP, BONUS_ROLL])).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not chase an item that is already reserved', async () => {
    const { run } = build({ reserved: true });
    await expect(run([BOSS_DROP])).rejects.toBeInstanceOf(ConflictException);
  });
});
