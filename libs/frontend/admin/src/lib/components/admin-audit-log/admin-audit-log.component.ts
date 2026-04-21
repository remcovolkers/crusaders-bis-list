import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { AdminService, AuditLogEntry, AuditAction } from '../../services/admin.service';

const ACTION_LABELS: Record<AuditAction, string> = {
  reservation_created: 'Reservering aangemaakt',
  reservation_cancelled: 'Reservering ingetrokken',
  reservation_reset_all: 'Alle reserveringen gereset',
  loot_assigned: 'Loot toegekend',
  assignment_updated: 'Toekenning bijgewerkt',
  received_item_marked: 'Reservering aangepast',
};

const ACTION_CLASSES: Record<AuditAction, string> = {
  reservation_created: 'action-created',
  reservation_cancelled: 'action-cancelled',
  reservation_reset_all: 'action-reset',
  loot_assigned: 'action-assigned',
  assignment_updated: 'action-updated',
  received_item_marked: 'action-modified',
};

@Component({
  selector: 'lib-admin-audit-log',
  imports: [DatePipe, JsonPipe],
  templateUrl: './admin-audit-log.component.html',
  styleUrls: ['./admin-audit-log.component.scss'],
})
export class AdminAuditLogComponent implements OnInit {
  readonly entries = signal<AuditLogEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  private readonly adminService = inject(AdminService);

  readonly actionLabel = (action: AuditAction) => ACTION_LABELS[action] ?? action;
  readonly actionClass = (action: AuditAction) => ACTION_CLASSES[action] ?? '';

  ngOnInit(): void {
    this.adminService.getAuditLog().subscribe({
      next: (data) => {
        this.entries.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
