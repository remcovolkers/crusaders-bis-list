/** Blizzard API response types used by the domain port. */
export interface BlizzardJournalInstance {
  id: number;
  name: string;
  encounters: { id: number; name: string; key: { href: string } }[];
}

export interface BlizzardJournalEncounter {
  id: number;
  name: string;
  items: { id: number; item: { id: number; name: string; key: { href: string } } }[];
}

export interface BlizzardItem {
  id: number;
  name: string;
  item_class: { id: number; name: string };
  item_subclass: { id: number; name: string };
  inventory_type: { type: string; name: string };
  level: number;
  media?: { key: { href: string } };
  preview_item?: { stats?: Array<{ type: { type: string }; value: number; is_negated?: boolean }> };
}

/** Port — implemented by BlizzardApiService in backend-infrastructure. */
export interface IBlizzardApiService {
  readonly isConfigured: boolean;
  getJournalInstance(id: number): Promise<BlizzardJournalInstance>;
  getJournalEncounter(id: number): Promise<BlizzardJournalEncounter>;
  getItem(id: number): Promise<BlizzardItem>;
  getItemMediaUrl(id: number): Promise<string | undefined>;
}

export const BLIZZARD_API_SERVICE = Symbol('IBlizzardApiService');
