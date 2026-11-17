import { BlizzardItem } from '@crusaders-bis-list/backend-domain';
import { IItemTooltip } from '@crusaders-bis-list/shared-domain';

/** The tier set an item belongs to (name and its bonuses), from the Blizzard item-set endpoint. */
export interface ItemSetInfo {
  name: string;
  effects: { display_string: string; required_count: number }[];
}

const clean = (s: string | undefined | null): string | undefined => {
  const text = (s ?? '').replace(/\s+/g, ' ').trim();
  return text || undefined;
};

/**
 * What the loot screens show when you hover an item: the readable parts of Blizzard's tooltip (binding, type,
 * stat names, "Use:" / "Equip:" effects, set bonuses). Stat values are left out on purpose: the Blizzard item API
 * gives them for the base item level of the drop, not for the Hero / Myth track the item is really received on.
 */
export function buildItemTooltip(item: BlizzardItem, set?: ItemSetInfo): IItemTooltip | undefined {
  const p = item.preview_item;
  if (!p) return undefined;

  const inventory = clean(item.inventory_type?.name);
  const subclass = p.is_subclass_hidden ? undefined : clean(item.item_subclass?.name);
  const typeLine = [inventory, subclass && subclass !== 'Miscellaneous' ? subclass : undefined].filter(Boolean).join(' · ');

  // names of the stats the item gives (a negated stat, like a trinket without Strength, is not a stat of the item)
  const stats = [
    ...new Set(
      (p.stats ?? [])
        .filter((s) => !s.is_negated)
        .map((s) => clean(s.type.name))
        .filter((n): n is string => !!n && n !== 'Stamina'),
    ),
  ];

  const effects = (p.spells ?? []).map((s) => clean(s.description)).filter((d): d is string => !!d);
  const setEffects = (set?.effects ?? []).flatMap((e) => {
    const text = clean(e.display_string);
    return text ? [`(${e.required_count}) ${text}`] : [];
  });

  const tooltip: IItemTooltip = {
    quality: p.quality?.type,
    typeLine: typeLine || undefined,
    binding: clean(p.binding?.name),
    unique: clean(p.unique_equipped),
    stats: stats.length ? stats : undefined,
    effects: effects.length ? effects : undefined,
    description: clean(p.description),
    setName: clean(set?.name),
    setEffects: setEffects.length ? setEffects : undefined,
  };
  // drop empty fields: keeps the stored JSON small
  return Object.fromEntries(Object.entries(tooltip).filter(([, v]) => v !== undefined)) as IItemTooltip;
}
