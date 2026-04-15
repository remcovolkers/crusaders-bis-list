import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository, User } from '@crusaders-bis-list/backend-domain';
import { UserRole } from '@crusaders-bis-list/shared-domain';
import { UserOrmEntity } from '../entities/user.orm-entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  private toModel(orm: UserOrmEntity): User {
    const user = new User();
    user.id = orm.id;
    user.email = orm.email;
    user.googleId = orm.googleId;
    user.displayName = orm.displayName;
    user.avatarUrl = orm.avatarUrl;
    user.roles = orm.roles;
    user.createdAt = orm.createdAt;
    user.updatedAt = orm.updatedAt;
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.toModel(e) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const e = await this.repo.findOne({ where: { googleId } });
    return e ? this.toModel(e) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const e = await this.repo.findOne({ where: { email } });
    return e ? this.toModel(e) : null;
  }

  async findAll(): Promise<User[]> {
    const all = await this.repo.find();
    return all.map((e) => this.toModel(e));
  }

  async save(user: User): Promise<User> {
    const orm = this.repo.create({
      googleId: user.googleId,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      roles: user.roles,
    });
    const saved = await this.repo.save(orm);
    return this.toModel(saved);
  }

  async updateRoles(userId: string, roles: UserRole[]): Promise<User> {
    await this.repo.update(userId, { roles });
    const updated = await this.repo.findOneOrFail({ where: { id: userId } });
    return this.toModel(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
