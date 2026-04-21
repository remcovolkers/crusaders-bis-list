import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditLogOrmEntity } from '../entities/audit-log.orm-entity';

export interface WriteAuditLogDto {
  action: AuditAction;
  actorId: string;
  actorName: string;
  raiderName?: string | null;
  itemName?: string | null;
  details?: Record<string, unknown> | null;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repo: Repository<AuditLogOrmEntity>,
  ) {}

  /** Fire-and-forget write. Errors are swallowed so audit failures never break requests. */
  log(dto: WriteAuditLogDto): void {
    this.repo
      .save({
        action: dto.action,
        actorId: dto.actorId,
        actorName: dto.actorName,
        raiderName: dto.raiderName ?? null,
        itemName: dto.itemName ?? null,
        details: dto.details ?? null,
      })
      .catch((err) => console.error('[AuditLog] Failed to write entry:', err));
  }

  async getRecent(limit = 200): Promise<AuditLogOrmEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
  }
}
