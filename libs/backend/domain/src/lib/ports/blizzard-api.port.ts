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
  preview_item?: {
    stats?: Array<{ type: { type: string; name?: string }; value: number; is_negated?: boolean }>;
    quality?: { type: string };
    binding?: { name: string };
    unique_equipped?: string;
    spells?: Array<{ description?: string }>;
    description?: string;
    is_subclass_hidden?: boolean;
    requirements?: { playable_classes?: { links?: Array<{ id: number; name: string }> } };
  };
}

/** An item set (e.g. the tier set of one class). */
export interface BlizzardItemSet {
  id: number;
  name: string;
  items: Array<{ id: number; name: string }>;
  effects?: Array<{ display_string: string; required_count: number }>;
}

/** One worn item of a character, as reported by the Blizzard armory. */
export interface BlizzardEquippedItem {
  /** Blizzard slot type, e.g. HEAD, FINGER_1, MAIN_HAND (also SHIRT / TABARD, which callers ignore). */
  slot: string;
  itemId: number;
  name: string;
  itemLevel: number;
  /** `name_description.display_string`, e.g. "Mythic" or "Heroic Ascendant Venomforged: Myth". */
  description: string | null;
}

/** Port — implemented by BlizzardApiService in backend-infrastructure. */
export interface IBlizzardApiService {
  readonly isConfigured: boolean;
  getJournalInstance(id: number): Promise<BlizzardJournalInstance>;
  getJournalEncounter(id: number): Promise<BlizzardJournalEncounter>;
  getItem(id: number): Promise<BlizzardItem>;
  getItemSet(id: number): Promise<BlizzardItemSet>;
  getItemMediaUrl(id: number): Promise<string | undefined>;
  /**
   * URL of the character's armory render (transparent full-body image), or null when Blizzard has no public
   * profile for it (unknown name/realm, never logged in, privacy) or the API is unreachable. Never throws.
   */
  getCharacterRenderUrl(realm: string, characterName: string): Promise<string | null>;
  /**
   * The gear a character currently wears, or null when it could not be read (no public profile, unknown
   * name/realm, API unreachable). An empty array means the character is known but wears nothing. Never throws.
   */
  getCharacterEquipment(realm: string, characterName: string): Promise<BlizzardEquippedItem[] | null>;
}

export const BLIZZARD_API_SERVICE = Symbol('IBlizzardApiService');
