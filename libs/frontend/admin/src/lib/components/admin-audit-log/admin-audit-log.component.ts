import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { AdminService, AuditLogEntry, AuditAction } from '../../services/admin.service';

const ACTION_LABELS: Record<AuditAction, string> = {
  reservation_created: 'Reservering aangemaakt',
  reservation_cancelled: 'Reservering ingetrokken',
  reservation_reset_all: 'Alle reserveringen gereset',
  loot_assigned: 'Loot toegekend',
  assignment_updated: 'Toekenning bijgewerkt',
  received_item_marked: 'Tier ontvangen gemarkeerd',
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
  imports: [DatePipe, JsonPipe, FormsModule],
  templateUrl: './admin-audit-log.component.html',
  styleUrls: ['./admin-audit-log.component.scss'],
})
export class AdminAuditLogComponent {
  private readonly adminService = inject(AdminService);

  private readonly auditLogResource = rxResource({ stream: () => this.adminService.getAuditLog() });

  readonly entries = computed(() => this.auditLogResource.value() ?? []);
  readonly loading = this.auditLogResource.isLoading;
  readonly error = computed(() => this.auditLogResource.status() === 'error');

  // Filters
  readonly filterAction = signal<AuditAction | ''>('');
  readonly filterActor = signal('');
  readonly filterRaider = signal('');
  readonly filterItem = signal('');

  readonly actionOptions = Object.entries(ACTION_LABELS) as [AuditAction, string][];

  readonly filteredEntries = computed(() => {
    const action = this.filterAction();
    const actor = this.filterActor().toLowerCase().trim();
    const raider = this.filterRaider().toLowerCase().trim();
    const item = this.filterItem().toLowerCase().trim();
    return this.entries().filter((e) => {
      if (action && e.action !== action) return false;
      if (actor && !e.actorName?.toLowerCase().includes(actor)) return false;
      if (raider && !e.raiderName?.toLowerCase().includes(raider)) return false;
      if (item && !e.itemName?.toLowerCase().includes(item)) return false;
      return true;
    });
  });

  readonly hasActiveFilter = computed(
    () => !!this.filterAction() || !!this.filterActor() || !!this.filterRaider() || !!this.filterItem(),
  );

  readonly actionLabel = (action: AuditAction) => ACTION_LABELS[action] ?? action;
  readonly actionClass = (action: AuditAction) => ACTION_CLASSES[action] ?? '';

  clearFilters(): void {
    this.filterAction.set('');
    this.filterActor.set('');
    this.filterRaider.set('');
    this.filterItem.set('');
  }
}
