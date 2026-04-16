import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackOrmEntity } from '../entities/feedback.orm-entity';

export interface CreateFeedbackData {
  userId: string;
  userEmail: string;
  userName: string;
  message: string;
  pageContext: string;
}

@Injectable()
export class FeedbackRepository {
  constructor(
    @InjectRepository(FeedbackOrmEntity)
    private readonly repo: Repository<FeedbackOrmEntity>,
  ) {}

  async create(data: CreateFeedbackData): Promise<void> {
    const entry = this.repo.create(data);
    await this.repo.save(entry);
  }

  async findAll(): Promise<FeedbackOrmEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async resolve(id: string): Promise<void> {
    await this.repo.update(id, { resolved: true, resolvedAt: new Date() });
  }

  async unresolve(id: string): Promise<void> {
    await this.repo.update(id, { resolved: false, resolvedAt: null });
  }
}
