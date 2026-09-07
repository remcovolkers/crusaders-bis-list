import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISeasonConfigRepository } from '@crusaders-bis-list/backend-domain';
import { ISeasonConfig, Team, UpdateSeasonConfigDto } from '@crusaders-bis-list/shared-domain';
import { SeasonConfigOrmEntity } from '../entities/season-config.orm-entity';

@Injectable()
export class SeasonConfigRepository implements ISeasonConfigRepository {
  constructor(
    @InjectRepository(SeasonConfigOrmEntity)
    private readonly repo: Repository<SeasonConfigOrmEntity>,
  ) {}

  private toModel(e: SeasonConfigOrmEntity): ISeasonConfig {
    return {
      id: e.id,
      raidSeasonId: e.raidSeasonId,
      team: e.team,
      trinketLimit: e.trinketLimit,
      weaponLimit: e.weaponLimit,
      jewelryLimit: e.jewelryLimit,
      armorLimit: e.armorLimit,
      superrareLimit: e.superrareLimit,
    };
  }

  async findBySeasonId(seasonId: string, team: Team): Promise<ISeasonConfig | null> {
    const e = await this.repo.findOne({ where: { raidSeasonId: seasonId, team } });
    return e ? this.toModel(e) : null;
  }

  async findOrCreateDefault(seasonId: string, team: Team): Promise<ISeasonConfig> {
    let e = await this.repo.findOne({ where: { raidSeasonId: seasonId, team } });
    if (!e) {
      e = this.repo.create({
        raidSeasonId: seasonId,
        team,
        trinketLimit: 2,
        weaponLimit: 2,
        jewelryLimit: 1,
        armorLimit: 1,
        superrareLimit: 0,
      });
      e = await this.repo.save(e);
    }
    return this.toModel(e);
  }

  async update(id: string, dto: UpdateSeasonConfigDto): Promise<ISeasonConfig> {
    await this.repo.update(id, dto);
    const e = await this.repo.findOneOrFail({ where: { id } });
    return this.toModel(e);
  }
}
