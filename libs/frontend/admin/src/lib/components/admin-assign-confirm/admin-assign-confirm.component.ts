import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  AssignmentStatus,
  ITEM_CATEGORY_LABELS,
  WEAPON_TYPE_LABELS,
  PRIMARY_STAT_LABELS,
  TIER_LABELS,
  ItemCategory,
  IItem,
} from '@crusaders-bis-list/shared-domain';

export interface PendingAssignment {
  raiderId: string;
  itemId: string;
  bossId: string;
  raiderName: string;
  item: IItem;
}

@Component({
  selector: 'lib-admin-assign-confirm',
  imports: [NgClass],
  templateUrl: './admin-assign-confirm.component.html',
  styleUrls: ['./admin-assign-confirm.component.scss'],
})
export class AdminAssignConfirmComponent {
  readonly pending = input.required<PendingAssignment>();
  readonly selectedDifficulty = input.required<AssignmentStatus>();

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  readonly tierLabels = TIER_LABELS;
  readonly categoryLabels = ITEM_CATEGORY_LABELS;
  readonly weaponTypeLabels = WEAPON_TYPE_LABELS;
  readonly primaryStatLabels = PRIMARY_STAT_LABELS;
  readonly ItemCategory = ItemCategory;
}
