import { ReserveItemUseCase } from '@crusaders-bis-list/backend-application';
import { ChaseMethod, ItemCategory, Team } from '@crusaders-bis-list/shared-domain';

const { BOSS_DROP, BONUS_ROLL } = ChaseMethod;

function build(chase: { id: string; methods: ChaseMethod[] } | null) {
  const updated: { id: string; methods: ChaseMethod[] }[] = [];
  const deleted: string[] = [];
  const useCase = new ReserveItemUseCase(
    {
      findExisting: jest.fn().mockResolvedValue(null),
      findByRaiderAndCategory: jest.fn().mockResolvedValue([]),
      findSuperRareByRaider: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
    } as never,
    {
      findItemById: jest.fn().mockResolvedValue({ id: 'i1', category: ItemCategory.TRINKET }),
      getSuperRareOverrides: jest.fn().mockResolvedValue({}),
    } as never,
    { findOrCreateDefault: jest.fn().mockResolvedValue({ trinketLimit: 2, weaponLimit: 2, jewelryLimit: 1, armorLimit: 1, superrareLimit: 1 }) } as never,
    {
      findExisting: jest.fn().mockResolvedValue(chase),
      updateMethods: jest.fn().mockImplementation(async (id, methods) => void updated.push({ id, methods })),
      delete: jest.fn().mockImplementation(async (id) => void deleted.push(id)),
    } as never,
  );
  return { run: () => useCase.execute('r1', 'i1', 's1', Team.CRUSADERS), updated, deleted };
}

describe('ReserveItemUseCase and an existing chase', () => {
  it('removes a boss drop chase: the reservation is that', async () => {
    const { run, deleted, updated } = build({ id: 'c1', methods: [BOSS_DROP] });
    await run();
    expect(deleted).toEqual(['c1']);
    expect(updated).toEqual([]);
  });

  it('keeps a bonus roll chase next to the reservation', async () => {
    const { run, deleted, updated } = build({ id: 'c1', methods: [BONUS_ROLL] });
    await run();
    expect(deleted).toEqual([]);
    expect(updated).toEqual([]);
  });

  it('turns a chase for both into a bonus roll chase only', async () => {
    const { run, deleted, updated } = build({ id: 'c1', methods: [BOSS_DROP, BONUS_ROLL] });
    await run();
    expect(deleted).toEqual([]);
    expect(updated).toEqual([{ id: 'c1', methods: [BONUS_ROLL] }]);
  });

  it('does nothing when there is no chase', async () => {
    const { run, deleted, updated } = build(null);
    await run();
    expect(deleted).toEqual([]);
    expect(updated).toEqual([]);
  });
});
