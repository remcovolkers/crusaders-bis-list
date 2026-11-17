import { SyncRaiderEquipmentUseCase } from '@crusaders-bis-list/backend-application';
import { AssignmentStatus, ChaseMethod, IItem } from '@crusaders-bis-list/shared-domain';

const RAIDER = { id: 'r1', userId: 'u1', characterName: 'Volky', realm: 'Silvermoon', wowClass: 'Priest' };
const SEASON = { id: 's1' };

const item = (id: string, wowItemId: number, extra: Partial<IItem> = {}): IItem =>
  ({ id, name: `Item ${id}`, wowItemId, iconUrl: `icon-${id}`, ...extra }) as IItem;

interface Setup {
  catalog?: IItem[];
  reservedItemIds?: string[];
  chasedItemIds?: string[];
  /** Methods per chased item (default: boss drop). */
  chaseMethods?: Record<string, ChaseMethod[]>;
  /** Marks the raider has made ("this worn item is best in slot"). */
  bisMarks?: { slot: string; itemId: number }[];
  received?: { itemId: string; tier: AssignmentStatus }[];
  worn?: { slot: string; itemId: number; name: string; itemLevel: number; description: string | null }[] | null;
  lastSyncedAt?: Date | null;
  /** Season config of the raider's team (item level caps); null caps fall back to the season definition. */
  caps?: { mythItemLevelFrom: number | null; ambiguousItemLevelFrom: number | null };
}

function build(setup: Setup) {
  const saved: { raiderId: string; itemId: string; tier: AssignmentStatus }[] = [];
  const deletedChase: string[] = [];
  const stored: unknown[] = [];
  const blizzard = {
    getCharacterEquipment: jest.fn().mockResolvedValue(setup.worn === undefined ? [] : setup.worn),
    getItemMediaUrl: jest.fn().mockResolvedValue('media-icon'),
    getItem: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Crafted',
      inventory_type: { type: 'FEET', name: 'Feet' },
      item_subclass: { id: 1, name: 'Cloth' },
      preview_item: { quality: { type: 'EPIC' }, stats: [] },
    }),
  };
  const equippedRepo = {
    findByRaider: jest.fn().mockResolvedValue(stored),
    replaceForRaider: jest.fn().mockResolvedValue(undefined),
    lastSyncedAt: jest.fn().mockResolvedValue(setup.lastSyncedAt ?? null),
  };
  const bisMarkRepo = {
    findByRaider: jest.fn().mockResolvedValue(setup.bisMarks ?? []),
    deleteStale: jest.fn().mockResolvedValue(undefined),
  };
  const useCase = new SyncRaiderEquipmentUseCase(
    { findById: jest.fn().mockResolvedValue(RAIDER) } as never,
    { findById: jest.fn().mockResolvedValue({ id: 'u1', team: 'crusaders' }) } as never,
    equippedRepo as never,
    bisMarkRepo as never,
    blizzard as never,
    {
      findActiveSeason: jest.fn().mockResolvedValue(SEASON),
      findAllItemsBySeason: jest.fn().mockResolvedValue(setup.catalog ?? []),
      // Ula'tek gives a bonus roll item level of 344 (season default); Sszorak does not
      findBossesBySeason: jest.fn().mockResolvedValue([
        { id: 'b-ulatek', wowEncounterId: 2895 },
        { id: 'b-sszorak', wowEncounterId: 2871 },
      ]),
    } as never,
    {
      findByRaider: jest.fn().mockResolvedValue((setup.reservedItemIds ?? []).map((itemId) => ({ itemId }))),
    } as never,
    {
      findByRaider: jest
        .fn()
        .mockResolvedValue(
          (setup.chasedItemIds ?? []).map((itemId) => ({
            id: `chase-${itemId}`,
            itemId,
            methods: setup.chaseMethods?.[itemId] ?? [ChaseMethod.BOSS_DROP],
          })),
        ),
      delete: jest.fn().mockImplementation(async (id: string) => void deletedChase.push(id)),
    } as never,
    {
      findByRaider: jest.fn().mockResolvedValue(setup.received ?? []),
      save: jest.fn().mockImplementation(async (dto) => void saved.push(dto)),
    } as never,
    {
      findOrCreateDefault: jest.fn().mockResolvedValue({
        mythItemLevelFrom: setup.caps?.mythItemLevelFrom ?? null,
        ambiguousItemLevelFrom: setup.caps?.ambiguousItemLevelFrom ?? null,
        bonusRollEnabled: true,
      }),
    } as never,
    { log: jest.fn() } as never,
  );
  return { useCase, saved, deletedChase, blizzard, equippedRepo, bisMarkRepo };
}

const piece = (slot: string, itemId: number, description: string | null, itemLevel = 334) => ({
  slot,
  itemId,
  name: `Worn ${itemId}`,
  itemLevel,
  description,
});

describe('SyncRaiderEquipmentUseCase', () => {
  it('stores the hover text of worn gear: from the catalog when it is there, else from the Blizzard item API', async () => {
    const tip = { effects: ['Use: catalog tooltip'] };
    const { useCase, blizzard, equippedRepo } = build({
      catalog: [item('boots', 100, { tooltip: tip })],
      worn: [piece('FEET', 100, 'Heroic', 315), piece('HEAD', 200, null, 300)],
    });
    await useCase.execute('r1');
    const rows = equippedRepo.replaceForRaider.mock.calls[0][1] as { itemId: number; tooltip: unknown }[];
    expect(rows.find((r) => r.itemId === 100)?.tooltip).toEqual(tip);
    expect((rows.find((r) => r.itemId === 200)?.tooltip as { typeLine?: string })?.typeLine).toBe('Feet · Cloth');
    expect(blizzard.getItem).toHaveBeenCalledTimes(1); // only the item that is not in the catalog
  });

  it('counts a worn set piece for the reserved tier token it comes from for the class of the raider', async () => {
    const token = item('token', 500, {
      tierSetItems: {
        Priest: { wowItemId: 900, name: 'Priest Helm' },
        Mage: { wowItemId: 901, name: 'Mage Helm' },
      },
    });
    const { useCase, saved } = build({
      catalog: [token],
      reservedItemIds: ['token'],
      worn: [piece('HEAD', 900, 'Mythic', 334)],
    });
    await useCase.execute('r1');
    expect(saved).toEqual([{ raiderId: 'r1', itemId: 'token', tier: AssignmentStatus.MYTH_TIER }]);
  });

  it('does not count the set piece of another class for a tier token', async () => {
    const token = item('token', 500, { tierSetItems: { Mage: { wowItemId: 901, name: 'Mage Helm' } } });
    const { useCase, saved } = build({
      catalog: [token],
      reservedItemIds: ['token'],
      worn: [piece('HEAD', 901, 'Mythic', 334)],
    });
    await useCase.execute('r1');
    expect(saved).toEqual([]);
  });

  it('records the worn tier as "already have" for a reserved item', async () => {
    const { useCase, saved } = build({
      catalog: [item('boots', 100)],
      reservedItemIds: ['boots'],
      worn: [piece('FEET', 100, 'Heroic', 315)],
    });
    const result = await useCase.execute('r1');
    expect(saved).toEqual([{ raiderId: 'r1', itemId: 'boots', tier: AssignmentStatus.HERO_TIER }]);
    expect(result.updates).toEqual([
      expect.objectContaining({ itemId: 'boots', tier: AssignmentStatus.HERO_TIER, kind: 'received' }),
    ]);
    expect(result.refreshed).toBe(true);
  });

  it('reads an item level 334 piece as Myth even when Blizzard calls it Heroic', async () => {
    const { useCase, saved } = build({
      catalog: [item('boots', 100)],
      reservedItemIds: ['boots'],
      worn: [piece('FEET', 100, 'Heroic', 334)],
    });
    await useCase.execute('r1');
    expect(saved).toEqual([{ raiderId: 'r1', itemId: 'boots', tier: AssignmentStatus.MYTH_TIER }]);
  });

  it('uses the item level caps of the season config when the officers changed them', async () => {
    // next season: Myth starts at 400, so a 334 item is no longer Myth
    const { useCase, saved } = build({
      catalog: [item('boots', 100)],
      reservedItemIds: ['boots'],
      caps: { mythItemLevelFrom: 400, ambiguousItemLevelFrom: 399 },
      worn: [piece('FEET', 100, 'Heroic', 334)],
    });
    await useCase.execute('r1');
    expect(saved).toEqual([{ raiderId: 'r1', itemId: 'boots', tier: AssignmentStatus.HERO_TIER }]);
  });

  describe('chase completion with item level caps (bonus rolls on Ulatek give 344)', () => {
    const ulatekRing = item('ring', 200, { bossId: 'b-ulatek' });
    const sszorakRing = item('ring', 200, { bossId: 'b-sszorak' });

    it('completes a boss-drop chase at the drop maximum, also on a boss whose bonus roll gives more', async () => {
      const { useCase, deletedChase } = build({
        catalog: [ulatekRing],
        chasedItemIds: ['ring'],
        worn: [piece('FINGER_1', 200, 'Mythic', 334)],
      });
      await useCase.execute('r1');
      expect(deletedChase).toEqual(['chase-ring']);
    });

    it('keeps a bonus-roll chase on Ulatek until the item is at 344', async () => {
      const at341 = build({
        catalog: [ulatekRing],
        chasedItemIds: ['ring'],
        chaseMethods: { ring: [ChaseMethod.BONUS_ROLL] },
        worn: [piece('FINGER_1', 200, 'Mythic', 341)],
      });
      await at341.useCase.execute('r1');
      expect(at341.deletedChase).toEqual([]);

      const at344 = build({
        catalog: [ulatekRing],
        chasedItemIds: ['ring'],
        chaseMethods: { ring: [ChaseMethod.BONUS_ROLL] },
        worn: [piece('FINGER_1', 200, 'Mythic', 344)],
      });
      await at344.useCase.execute('r1');
      expect(at344.deletedChase).toEqual(['chase-ring']);
    });

    it('completes a bonus-roll chase on a normal boss at 334, since a bonus roll gives no more there', async () => {
      const { useCase, deletedChase } = build({
        catalog: [sszorakRing],
        chasedItemIds: ['ring'],
        chaseMethods: { ring: [ChaseMethod.BONUS_ROLL] },
        worn: [piece('FINGER_1', 200, 'Mythic', 334)],
      });
      await useCase.execute('r1');
      expect(deletedChase).toEqual(['chase-ring']);
    });

    it('completes a chase for both a boss drop and a bonus roll as soon as the item is had either way', async () => {
      // 334 is enough for the boss drop part, so the chase (which is "I want it, however it comes") is done
      const { useCase, deletedChase } = build({
        catalog: [ulatekRing],
        chasedItemIds: ['ring'],
        chaseMethods: { ring: [ChaseMethod.BOSS_DROP, ChaseMethod.BONUS_ROLL] },
        worn: [piece('FINGER_1', 200, 'Mythic', 334)],
      });
      await useCase.execute('r1');
      expect(deletedChase).toEqual(['chase-ring']);
    });

    it('also clears a bonus-roll chase on an item the raider reserved, once it is at its best item level', async () => {
      const { useCase, deletedChase } = build({
        catalog: [ulatekRing],
        reservedItemIds: ['ring'],
        chasedItemIds: ['ring'],
        chaseMethods: { ring: [ChaseMethod.BONUS_ROLL] },
        worn: [piece('FINGER_1', 200, 'Mythic', 344)],
      });
      await useCase.execute('r1');
      expect(deletedChase).toEqual(['chase-ring']);
    });
  });

  it('does not tick off a Champion-level item (Champion is not tracked)', async () => {
    const { useCase, saved } = build({
      catalog: [item('boots', 100)],
      reservedItemIds: ['boots'],
      worn: [piece('FEET', 100, 'Normal', 290)],
    });
    await useCase.execute('r1');
    expect(saved).toEqual([]);
  });

  it('keeps a reservation when a Myth item is worn (it becomes "BiS in bezit") and does not touch chase', async () => {
    const { useCase, saved, deletedChase } = build({
      catalog: [item('boots', 100)],
      reservedItemIds: ['boots'],
      worn: [piece('FEET', 100, 'Mythic')],
    });
    await useCase.execute('r1');
    expect(saved[0].tier).toBe(AssignmentStatus.MYTH_TIER);
    expect(deletedChase).toEqual([]);
  });

  it('takes a chased item off the chase list once it is worn at Myth', async () => {
    const { useCase, saved, deletedChase } = build({
      catalog: [item('ring', 200)],
      chasedItemIds: ['ring'],
      worn: [piece('FINGER_1', 200, 'Mythic')],
    });
    const result = await useCase.execute('r1');
    expect(deletedChase).toEqual(['chase-ring']);
    expect(saved).toEqual([{ raiderId: 'r1', itemId: 'ring', tier: AssignmentStatus.MYTH_TIER }]);
    expect(result.updates.map((u) => u.kind)).toEqual(['received', 'chase_completed']);
  });

  it('keeps a chased item on the list when it is worn below Myth, but records the tier', async () => {
    const { useCase, saved, deletedChase } = build({
      catalog: [item('ring', 200)],
      chasedItemIds: ['ring'],
      worn: [piece('FINGER_1', 200, 'Heroic', 315)],
    });
    await useCase.execute('r1');
    expect(deletedChase).toEqual([]);
    expect(saved[0].tier).toBe(AssignmentStatus.HERO_TIER);
  });

  it('never lowers an already recorded tier', async () => {
    const { useCase, saved } = build({
      catalog: [item('boots', 100)],
      reservedItemIds: ['boots'],
      received: [{ itemId: 'boots', tier: AssignmentStatus.MYTH_TIER }],
      worn: [piece('FEET', 100, 'Heroic', 315)],
    });
    const result = await useCase.execute('r1');
    expect(saved).toEqual([]);
    expect(result.updates).toEqual([]);
  });

  it('ignores worn items that are neither reserved nor chased, and items without a known tier', async () => {
    const { useCase, saved } = build({
      catalog: [item('a', 1), item('b', 2)],
      reservedItemIds: ['b'],
      worn: [piece('HEAD', 1, 'Mythic'), piece('FEET', 2, 'Tidal Crafted')],
    });
    await useCase.execute('r1');
    expect(saved).toEqual([]);
  });

  it('counts the worn secondary form of a merged item for its primary item', async () => {
    const { useCase, saved } = build({
      catalog: [item('primary', 300), item('secondary', 301, { mergedWithItemId: 300 })],
      reservedItemIds: ['primary'],
      worn: [piece('TRINKET_1', 301, 'Mythic')],
    });
    await useCase.execute('r1');
    expect(saved).toEqual([{ raiderId: 'r1', itemId: 'primary', tier: AssignmentStatus.MYTH_TIER }]);
  });

  it('stores shirt/tabard-free gear and falls back to the media icon for items outside the catalog', async () => {
    const { useCase, equippedRepo } = build({
      catalog: [item('boots', 100)],
      worn: [piece('SHIRT', 9, null), piece('FEET', 100, 'Heroic'), piece('HEAD', 555, 'Heroic')],
    });
    await useCase.execute('r1');
    const rows = equippedRepo.replaceForRaider.mock.calls[0][1];
    expect(rows.map((r: { slot: string }) => r.slot)).toEqual(['FEET', 'HEAD']);
    expect(rows[0].iconUrl).toBe('icon-boots');
    expect(rows[1].iconUrl).toBe('media-icon');
  });

  it('reuses recent data instead of calling the armory again', async () => {
    const { useCase, blizzard } = build({ lastSyncedAt: new Date(), worn: [] });
    const result = await useCase.execute('r1');
    expect(result.refreshed).toBe(false);
    expect(blizzard.getCharacterEquipment).not.toHaveBeenCalled();
  });

  it('keeps stored data and changes nothing when the armory cannot be read', async () => {
    const { useCase, saved, equippedRepo } = build({ worn: null });
    const result = await useCase.execute('r1');
    expect(result.refreshed).toBe(false);
    expect(saved).toEqual([]);
    expect(equippedRepo.replaceForRaider).not.toHaveBeenCalled();
  });

  it('forgets best-in-slot marks of items that are no longer worn, and returns the marks that still apply', async () => {
    const { useCase, bisMarkRepo } = build({
      worn: [piece('FEET', 100, 'Heroic', 300), piece('HANDS', 101, 'Heroic', 300)],
      bisMarks: [{ slot: 'FEET', itemId: 100 }],
    });
    const result = await useCase.execute('r1');
    expect(bisMarkRepo.deleteStale).toHaveBeenCalledWith('r1', [
      { slot: 'FEET', itemId: 100 },
      { slot: 'HANDS', itemId: 101 },
    ]);
    expect(result.bisMarks).toEqual([{ slot: 'FEET', itemId: 100 }]);
  });
});
