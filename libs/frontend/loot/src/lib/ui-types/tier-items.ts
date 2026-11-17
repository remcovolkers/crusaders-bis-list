import { IBoss, IItem, WowClass } from '@crusaders-bis-list/shared-domain';

/**
 * A tier token turns into a set piece of the raider's class. The loot screens show that piece (its name and icon)
 * instead of the token, and keep the token's name as a note ("via Venomforged Effigy"). The reservation, the item id
 * and everything else stays on the token: that is what drops and what the loot master assigns.
 */
export function presentTierItem(item: IItem, wowClass: WowClass | string | undefined): IItem {
  const piece = wowClass ? item.tierSetItems?.[wowClass as WowClass] : undefined;
  if (!piece) return item;
  return {
    ...item,
    name: piece.name,
    iconUrl: piece.iconUrl ?? item.iconUrl,
    tierPiece: piece,
    tooltip: piece.tooltip ?? item.tooltip,
    tierTokenName: item.mergedDisplayName ?? item.name,
    mergedDisplayName: undefined,
  };
}

/** The catalog as the raider sees it: tier tokens shown as the set piece of their class. */
export function presentTierCatalog<T extends { bosses: (IBoss & { items: IItem[] })[] }>(
  catalog: T,
  wowClass: WowClass | string | undefined,
): T {
  if (!wowClass) return catalog;
  return { ...catalog, bosses: catalog.bosses.map((b) => ({ ...b, items: b.items.map((i) => presentTierItem(i, wowClass)) })) };
}
