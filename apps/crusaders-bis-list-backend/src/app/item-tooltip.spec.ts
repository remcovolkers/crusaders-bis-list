import { buildItemTooltip } from '@crusaders-bis-list/backend-application';

const item = (over: Record<string, unknown> = {}) =>
  ({
    id: 1,
    name: 'Font of Venomous Rage',
    inventory_type: { type: 'TRINKET', name: 'Trinket' },
    item_subclass: { id: 0, name: 'Miscellaneous' },
    preview_item: {
      quality: { type: 'EPIC' },
      binding: { name: 'Binds when picked up' },
      unique_equipped: 'Unique-Equipped',
      is_subclass_hidden: true,
      stats: [
        { type: { type: 'MASTERY_RATING', name: 'Mastery' }, value: 76 },
        { type: { type: 'STAMINA', name: 'Stamina' }, value: 900 },
        { type: { type: 'STRENGTH', name: 'Strength' }, value: 50, is_negated: true },
      ],
      spells: [{ description: 'Use: Channel a torrent of venomous rage over 2 sec. (4 Min Cooldown)' }],
    },
    ...over,
  }) as never;

describe('buildItemTooltip', () => {
  it('keeps the readable parts of the Blizzard tooltip', () => {
    const tooltip = buildItemTooltip(item());
    expect(tooltip).toEqual({
      quality: 'EPIC',
      typeLine: 'Trinket',
      binding: 'Binds when picked up',
      unique: 'Unique-Equipped',
      stats: ['Mastery'],
      effects: ['Use: Channel a torrent of venomous rage over 2 sec. (4 Min Cooldown)'],
    });
  });

  it('leaves out stat values, stamina and negated stats, and the subclass of misc items', () => {
    const tooltip = buildItemTooltip(item());
    expect(JSON.stringify(tooltip)).not.toContain('76');
    expect(tooltip?.stats).not.toContain('Stamina');
    expect(tooltip?.stats).not.toContain('Strength');
  });

  it('names the type of armor and weapons with their subclass', () => {
    const armor = item({
      inventory_type: { type: 'HEAD', name: 'Head' },
      item_subclass: { id: 1, name: 'Cloth' },
      preview_item: { quality: { type: 'EPIC' }, stats: [] },
    });
    expect(buildItemTooltip(armor)?.typeLine).toBe('Head · Cloth');
  });

  it('adds the set name and the set bonuses of a tier piece', () => {
    const tooltip = buildItemTooltip(item(), {
      name: "Cosmic Penitent's Raiment",
      effects: [
        { display_string: 'Set: Tentacle Slam is stronger.', required_count: 2 },
        { display_string: 'Set: Void Volley is free.', required_count: 4 },
      ],
    });
    expect(tooltip?.setName).toBe("Cosmic Penitent's Raiment");
    expect(tooltip?.setEffects).toEqual(['(2) Set: Tentacle Slam is stronger.', '(4) Set: Void Volley is free.']);
  });

  it('returns nothing for an item without preview data', () => {
    expect(buildItemTooltip({ id: 2, name: 'x' } as never)).toBeUndefined();
  });
});
