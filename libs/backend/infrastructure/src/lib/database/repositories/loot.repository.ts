import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IReservationRepository,
  IAssignmentRepository,
  Reservation,
  Assignment,
  CreateReservationData,
  CreateAssignmentData,
} from '@crusaders-bis-list/backend-domain';
import { AssignmentStatus, ItemCategory } from '@crusaders-bis-list/shared-domain';
import { ReservationOrmEntity } from '../entities/loot.orm-entity';
import { AssignmentOrmEntity } from '../entities/loot.orm-entity';

@Injectable()
export class ReservationRepository implements IReservationRepository {
  constructor(
    @InjectRepository(ReservationOrmEntity)
    private readonly repo: Repository<ReservationOrmEntity>,
  ) {}

  private toModel(e: ReservationOrmEntity): Reservation {
    const r = new Reservation();
    r.id = e.id;
    r.raiderId = e.raiderId;
    r.itemId = e.itemId;
    r.itemCategory = e.itemCategory as ItemCategory;
    r.isSuperRare = e.isSuperRare;
    r.raidSeasonId = e.raidSeasonId;
    r.createdAt = e.createdAt;
    return r;
  }

  async findByRaider(raiderId: string, raidSeasonId: string): Promise<Reservation[]> {
    const where: Record<string, string> = { raiderId };
    if (raidSeasonId) where['raidSeasonId'] = raidSeasonId;
    const all = await this.repo.find({ where });
    return all.map((e) => this.toModel(e));
  }

  async findByRaiderAndCategory(
    raiderId: string,
    raidSeasonId: string,
    category: ItemCategory,
  ): Promise<Reservation[]> {
    const all = await this.repo.find({
      where: { raiderId, raidSeasonId, itemCategory: category },
    });
    return all.map((e) => this.toModel(e));
  }

  async findSuperRareByRaider(raiderId: string, raidSeasonId: string): Promise<Reservation[]> {
    const all = await this.repo.find({ where: { raiderId, raidSeasonId, isSuperRare: true } });
    return all.map((e) => this.toModel(e));
  }

  async findByItem(itemId: string, raidSeasonId: string): Promise<Reservation[]> {
    const all = await this.repo.find({ where: { itemId, raidSeasonId } });
    return all.map((e) => this.toModel(e));
  }

  async findExisting(raiderId: string, itemId: string, raidSeasonId: string): Promise<Reservation | null> {
    const e = await this.repo.findOne({ where: { raiderId, itemId, raidSeasonId } });
    return e ? this.toModel(e) : null;
  }

  async findById(id: string): Promise<Reservation | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.toModel(e) : null;
  }

  async findAllBySeason(raidSeasonId: string): Promise<Reservation[]> {
    const all = await this.repo.find({ where: { raidSeasonId }, order: { createdAt: 'ASC' } });
    return all.map((e) => this.toModel(e));
  }

  async save(reservation: CreateReservationData): Promise<Reservation> {
    const orm = this.repo.create(reservation);
    const saved = await this.repo.save(orm);
    return this.toModel(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

@Injectable()
export class AssignmentRepository implements IAssignmentRepository {
  constructor(
    @InjectRepository(AssignmentOrmEntity)
    private readonly repo: Repository<AssignmentOrmEntity>,
  ) {}

  private toModel(e: AssignmentOrmEntity): Assignment {
    const a = new Assignment();
    a.id = e.id;
    a.raiderId = e.raiderId;
    a.itemId = e.itemId;
    a.bossId = e.bossId;
    a.raidSeasonId = e.raidSeasonId;
    a.status = e.status;
    a.assignedByUserId = e.assignedByUserId;
    a.assignedAt = e.assignedAt;
    return a;
  }

  async findByRaider(raiderId: string, raidSeasonId: string): Promise<Assignment[]> {
    const all = await this.repo.find({ where: { raiderId, raidSeasonId } });
    return all.map((e) => this.toModel(e));
  }

  async findByRaiderAndItem(raiderId: string, itemId: string): Promise<Assignment | null> {
    const e = await this.repo.findOne({ where: { raiderId, itemId } });
    return e ? this.toModel(e) : null;
  }

  async findByBossAndSeason(bossId: string, raidSeasonId: string): Promise<Assignment[]> {
    const all = await this.repo.find({ where: { bossId, raidSeasonId } });
    return all.map((e) => this.toModel(e));
  }

  async findAllBySeason(raidSeasonId: string): Promise<Assignment[]> {
    const all = await this.repo.find({ where: { raidSeasonId } });
    return all.map((e) => this.toModel(e));
  }

  async save(assignment: CreateAssignmentData): Promise<Assignment> {
    const orm = this.repo.create(assignment);
    const saved = await this.repo.save(orm);
    return this.toModel(saved);
  }

  async updateStatus(id: string, status: AssignmentStatus): Promise<Assignment> {
    await this.repo.update(id, { status });
    const updated = await this.repo.findOneOrFail({ where: { id } });
    return this.toModel(updated);
  }

  async deleteByRaiderAndItem(raiderId: string, itemId: string): Promise<void> {
    await this.repo.delete({ raiderId, itemId });
  }
}
