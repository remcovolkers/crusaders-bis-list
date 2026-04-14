import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRaiderRepository, RaiderProfile, CreateRaiderProfileDto, UpdateRaiderProfileDto } from '@crusaders-bis-list/backend-domain';
import { RaiderProfileOrmEntity } from '../entities/raider-profile.orm-entity';
import { RaiderStatus } from '@crusaders-bis-list/shared-domain';

@Injectable()
export class RaiderRepository implements IRaiderRepository {
  constructor(
    @InjectRepository(RaiderProfileOrmEntity)
    private readonly repo: Repository<RaiderProfileOrmEntity>,
  ) {}

  private toModel(e: RaiderProfileOrmEntity): RaiderProfile {
    const r = new RaiderProfile();
    r.id = e.id;
    r.userId = e.userId;
    r.characterName = e.characterName;
    r.wowClass = e.wowClass;
    r.spec = e.spec;
    r.status = e.status;
    r.createdAt = e.createdAt;
    r.updatedAt = e.updatedAt;
    return r;
  }

  async findAll(activeOnly = false): Promise<RaiderProfile[]> {
    const where = activeOnly
      ? [{ status: RaiderStatus.ACTIVE }, { status: RaiderStatus.TRIAL }]
      : undefined;
    const all = await this.repo.find({ where });
    return all.map((e) => this.toModel(e));
  }

  async findById(id: string): Promise<RaiderProfile | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.toModel(e) : null;
  }

  async findByUserId(userId: string): Promise<RaiderProfile | null> {
    const e = await this.repo.findOne({ where: { userId } });
    return e ? this.toModel(e) : null;
  }

  async save(dto: CreateRaiderProfileDto): Promise<RaiderProfile> {
    const orm = this.repo.create({
      userId: dto.userId,
      characterName: dto.characterName,
      wowClass: dto.wowClass,
      spec: dto.spec,
      status: RaiderStatus.ACTIVE,
    });
    const saved = await this.repo.save(orm);
    return this.toModel(saved);
  }

  async update(id: string, dto: UpdateRaiderProfileDto): Promise<RaiderProfile> {
    await this.repo.update(id, dto);
    const updated = await this.repo.findOne({ where: { id } });
    return this.toModel(updated!);
  }
}
