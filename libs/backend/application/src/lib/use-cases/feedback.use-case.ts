import { Injectable } from '@nestjs/common';
import { FeedbackRepository, FeedbackOrmEntity, CreateFeedbackData } from '@crusaders-bis-list/backend-infrastructure';

@Injectable()
export class SubmitFeedbackUseCase {
  constructor(private readonly feedbackRepo: FeedbackRepository) {}

  async execute(data: CreateFeedbackData): Promise<void> {
    await this.feedbackRepo.create(data);
  }
}

@Injectable()
export class GetAllFeedbackUseCase {
  constructor(private readonly feedbackRepo: FeedbackRepository) {}

  async execute(): Promise<FeedbackOrmEntity[]> {
    return this.feedbackRepo.findAll();
  }
}

@Injectable()
export class ResolveFeedbackUseCase {
  constructor(private readonly feedbackRepo: FeedbackRepository) {}

  async execute(id: string): Promise<void> {
    await this.feedbackRepo.resolve(id);
  }
}

@Injectable()
export class UnresolveFeedbackUseCase {
  constructor(private readonly feedbackRepo: FeedbackRepository) {}

  async execute(id: string): Promise<void> {
    await this.feedbackRepo.unresolve(id);
  }
}
