import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CatalyseChaseItemUseCase, SetBisMarkUseCase } from '@crusaders-bis-list/backend-application';

const worn = (slot: string, itemId: number) => ({ slot, itemId, name: 'Worn ' + itemId });

function marks() {
  const upserts: unknown[] = [];
  return {
    upserts,
    repo: {
      upsert: jest.fn().mockImplementation(async (_raiderId: string, row: unknown) => void upserts.push(row)),
      findByRaider: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
    },
  };
}

describe('SetBisMarkUseCase', () => {
  it('marks the worn item of a slot as best in slot (crafted boots, a dungeon item, ...)', async () => {
    const { repo, upserts } = marks();
    const useCase = new SetBisMarkUseCase(repo as never, { findByRaider: jest.fn().mockResolvedValue([worn('FEET', 100)]) } as never);
    await useCase.execute('r1', 'FEET', 100);
    expect(upserts).toEqual([{ slot: 'FEET', itemId: 100, reason: 'manual', note: null }]);
  });

  it('refuses to mark an item that is not the one worn in that slot', async () => {
    const { repo } = marks();
    const useCase = new SetBisMarkUseCase(repo as never, { findByRaider: jest.fn().mockResolvedValue([worn('FEET', 100)]) } as never);
    await expect(useCase.execute('r1', 'FEET', 999)).rejects.toBeInstanceOf(ConflictException);
    await expect(useCase.execute('r1', 'HEAD', 100)).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('CatalyseChaseItemUseCase', () => {
  function build(options: { chaseOwner?: string; equipped?: { slot: string; itemId: number; name: string }[] } = {}) {
    const deleted: string[] = [];
    const { repo, upserts } = marks();
    const useCase = new CatalyseChaseItemUseCase(
      { findById: jest.fn().mockResolvedValue({ id: 'c1', raiderId: options.chaseOwner ?? 'r1', itemId: 'shoulders-x' }), delete: jest.fn().mockImplementation(async (id: string) => void deleted.push(id)) } as never,
      repo as never,
      { findByRaider: jest.fn().mockResolvedValue(options.equipped ?? [worn('SHOULDER', 777)]) } as never,
      { findItemById: jest.fn().mockResolvedValue({ id: 'shoulders-x', name: 'Fancy Shoulders' }) } as never,
    );
    return { useCase, deleted, upserts };
  }

  it('marks the tier piece in that slot as best in slot and removes the chase (the chased item itself is consumed, not owned)', async () => {
    const { useCase, deleted, upserts } = build();
    await useCase.execute('r1', 'c1', 'SHOULDER');
    expect(upserts).toEqual([{ slot: 'SHOULDER', itemId: 777, reason: 'catalyst', note: 'Fancy Shoulders' }]);
    expect(deleted).toEqual(['c1']);
  });

  it('only works for tier slots, for an equipped piece, and for your own chase', async () => {
    await expect(build().useCase.execute('r1', 'c1', 'FEET')).rejects.toBeInstanceOf(BadRequestException);
    await expect(build({ equipped: [] }).useCase.execute('r1', 'c1', 'SHOULDER')).rejects.toBeInstanceOf(ConflictException);
    await expect(build({ chaseOwner: 'someone-else' }).useCase.execute('r1', 'c1', 'SHOULDER')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
