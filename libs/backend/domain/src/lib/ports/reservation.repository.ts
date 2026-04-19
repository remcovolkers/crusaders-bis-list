import { Reservation } from '../entities/loot.entity';
import { ItemCategory } from '@crusaders-bis-list/shared-domain';

export interface CreateReservationData {
  raiderId: string;
  itemId: string;
  itemCategory: ItemCategory;
  raidSeasonId: string;
  isSuperRare?: boolean;
}

export interface IReservationRepository {
  findById(id: string): Promise<Reservation | null>;
  findByRaider(raiderId: string, raidSeasonId: string): Promise<Reservation[]>;
  findByRaiderAndCategory(raiderId: string, raidSeasonId: string, category: ItemCategory): Promise<Reservation[]>;
  findSuperRareByRaider(raiderId: string, raidSeasonId: string): Promise<Reservation[]>;
  findByItem(itemId: string, raidSeasonId: string): Promise<Reservation[]>;
  findAllBySeason(raidSeasonId: string): Promise<Reservation[]>;
  findExisting(raiderId: string, itemId: string, raidSeasonId: string): Promise<Reservation | null>;
  save(reservation: CreateReservationData): Promise<Reservation>;
  delete(id: string): Promise<void>;
  deleteByRaider(raiderId: string): Promise<void>;
  deleteAll(): Promise<void>;
}

export const RESERVATION_REPOSITORY = Symbol('IReservationRepository');
