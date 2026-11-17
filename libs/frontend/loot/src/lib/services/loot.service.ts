import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '@crusaders-bis-list/frontend-auth';
import {
  IBisMark,
  IBoss,
  ChaseMethod,
  EquipmentSlot,
  IChaseItem,
  IEquippedItem,
  IItem,
  IRaidSeason,
  IReservation,
  ISeasonConfig,
  IRaiderProfile,
  IReceivedItem,
  AssignmentStatus,
} from '@crusaders-bis-list/shared-domain';

export interface EquipmentSyncUpdate {
  itemId: string;
  itemName: string;
  tier: AssignmentStatus;
  /** received: "already have" tier recorded. chase_completed: Myth item came off the chase list. */
  kind: 'received' | 'chase_completed';
}

export interface EquipmentSyncResponse {
  equipment: IEquippedItem[];
  /** The raider's own "best in slot" marks that still apply. */
  bisMarks: IBisMark[];
  refreshed: boolean;
  updates: EquipmentSyncUpdate[];
}

export interface CatalogResponse {
  season: IRaidSeason;
  bosses: (IBoss & { items: IItem[] })[];
}

@Injectable({ providedIn: 'root' })
export class LootService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);

  getCatalog() {
    return this.http.get<CatalogResponse>(`${this.base}/raider/catalog`);
  }

  getMyReservations(seasonId: string) {
    return this.http.get<IReservation[]>(`${this.base}/raider/reservations?seasonId=${seasonId}`);
  }

  getMyProfile() {
    return this.http.get<IRaiderProfile | null>(`${this.base}/raider/my-profile`);
  }

  saveProfile(dto: { characterName: string; realm?: string; wowClass: string; spec: string }) {
    return this.http.post<IRaiderProfile>(`${this.base}/raider/profile`, dto);
  }

  updateProfile(dto: { characterName: string; realm?: string; wowClass: string; spec: string }) {
    return this.http.put<IRaiderProfile>(`${this.base}/raider/profile`, dto);
  }

  getSeasonConfig() {
    return this.http.get<ISeasonConfig>(`${this.base}/raider/season-config`);
  }

  reserve(itemId: string, raidSeasonId: string, itemName?: string, receivedTier?: AssignmentStatus) {
    return this.http.post<{ message: string }>(`${this.base}/raider/reservations`, {
      itemId,
      raidSeasonId,
      itemName,
      ...(receivedTier ? { receivedTier } : {}),
    });
  }

  cancelReservation(reservationId: string) {
    return this.http.delete<void>(`${this.base}/raider/reservations/${reservationId}`);
  }

  getMyReceivedItems() {
    return this.http.get<IReceivedItem[]>(`${this.base}/raider/received-items`);
  }

  markItemReceived(itemId: string, tier: AssignmentStatus, itemName?: string) {
    return this.http.post<IReceivedItem>(`${this.base}/raider/received-items`, { itemId, tier, itemName });
  }

  removeReceivedItem(id: string) {
    return this.http.delete<void>(`${this.base}/raider/received-items/${id}`);
  }

  /**
   * Syncs the raider's worn gear from the Blizzard armory (the server skips it when it was synced recently) and
   * returns the gear plus what changed in the raider's lists.
   */
  syncEquipment() {
    return this.http.post<EquipmentSyncResponse>(`${this.base}/raider/equipment/sync`, {});
  }

  /** Armory render of the raider's character (`url: null` when Blizzard has no public profile for it). */
  getCharacterMedia() {
    return this.http.get<{ url: string | null }>(`${this.base}/raider/character-media`);
  }

  getMyChaseItems(seasonId: string) {
    return this.http.get<IChaseItem[]>(`${this.base}/raider/chase-items?seasonId=${seasonId}`);
  }

  /**
   * Sets how the raider chases an item: from the boss, with a bonus roll, or both. An empty list removes the chase
   * (the response is then empty).
   */
  setChaseItem(itemId: string, raidSeasonId: string, methods: ChaseMethod[]) {
    return this.http.post<IChaseItem | null>(`${this.base}/raider/chase-items`, { itemId, raidSeasonId, methods });
  }

  /** The chased item was catalysed into the tier piece worn in `slot`: mark that piece best in slot. */
  catalyseChase(chaseItemId: string, slot: EquipmentSlot) {
    return this.http.post<IBisMark[]>(`${this.base}/raider/chase-items/${chaseItemId}/catalyse`, { slot });
  }

  /** Marks the worn item in a slot as best in slot (the raider's own override). Returns all marks. */
  markBis(slot: EquipmentSlot, itemId: number) {
    return this.http.put<IBisMark[]>(`${this.base}/raider/bis-marks/${slot}`, { itemId });
  }

  unmarkBis(slot: EquipmentSlot) {
    return this.http.delete<IBisMark[]>(`${this.base}/raider/bis-marks/${slot}`);
  }

  removeChaseItem(id: string) {
    return this.http.delete<void>(`${this.base}/raider/chase-items/${id}`);
  }

  getItemPeers(itemId: string) {
    return this.http.get<{ characterName: string; receivedTier: AssignmentStatus | null }[]>(
      `${this.base}/raider/item-peers/${itemId}`,
    );
  }

  getItemPeerCounts() {
    return this.http.get<Record<string, Record<AssignmentStatus, number>>>(`${this.base}/raider/item-peer-counts`);
  }
}
