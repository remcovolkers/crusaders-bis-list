import { Component, computed, inject, output } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { AssignmentStatus, CATALYST_SLOTS, ChaseMethod, EquipmentSlot, IEquippedItem, TIER_LABELS } from '@crusaders-bis-list/shared-domain';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';
import { RaiderLootStateService } from '../../services/raider-loot-state.service';
import { ItemWithReservation, TrackedItem } from '../../ui-types/loot-ui.types';
import {
  buildPaperdoll,
  paperdollSlotOf,
  PAPERDOLL_BOTTOM,
  PAPERDOLL_LEFT,
  PAPERDOLL_RIGHT,
  PaperdollCell,
  PaperdollSlotDef,
  PaperdollSlotKey,
} from '../../ui-types/paperdoll';

/**
 * World of Warcraft style character pane: what the character wears, plus the items the raider reserved or chased,
 * drawn on the gear slots around the character (armory render in the middle when Blizzard has one). Gear only.
 * Texts are English on purpose (familiar from the game).
 */
@Component({
  selector: 'lib-loot-paperdoll',
  imports: [NgClass, NgTemplateOutlet],
  templateUrl: './loot-paperdoll.component.html',
  styleUrls: ['./loot-paperdoll.component.scss'],
})
export class LootPaperdollComponent {
  protected readonly state = inject(RaiderLootStateService);
  private readonly toast = inject(ToastService);

  /** A reserved item was clicked: let the page open its "Reservering aanpassen" modal. */
  readonly editReservation = output<ItemWithReservation>();

  protected readonly ChaseMethod = ChaseMethod;
  protected readonly left = PAPERDOLL_LEFT;
  protected readonly right = PAPERDOLL_RIGHT;
  protected readonly bottom = PAPERDOLL_BOTTOM;

  protected readonly layout = computed(() => buildPaperdoll(this.state.trackedItems(), this.state.equipment()));
  protected readonly reservedCount = computed(() => this.state.trackedItems().filter((t) => t.kind === 'reserved').length);
  protected readonly chasedCount = computed(() => this.state.trackedItems().filter((t) => t.kind === 'chased').length);
  protected readonly equippedCount = computed(() => this.state.equipment().length);
  protected readonly hasAnything = computed(() => this.state.trackedItems().length + this.state.equipment().length > 0);

  protected readonly classSlug = computed(() => {
    const wowClass = this.state.profile()?.wowClass;
    return wowClass ? 'class-' + wowClass.toLowerCase().replace(/\s+/g, '-') : '';
  });

  protected tierLabel(tier: AssignmentStatus): string {
    return TIER_LABELS[tier];
  }

  protected cell(def: PaperdollSlotDef): PaperdollCell<TrackedItem> | undefined {
    return def.placeholder ? undefined : this.layout().slots[def.key as PaperdollSlotKey];
  }

  /** "Myth · 334" style summary of a worn item (the raw Blizzard description when it has no raid tier). */
  protected equippedMeta(piece: IEquippedItem): string {
    const tier = piece.tier ? TIER_LABELS[piece.tier] : piece.tierLabel;
    return [tier, piece.itemLevel ? String(piece.itemLevel) : null].filter(Boolean).join(' · ');
  }

  protected hasMethod(entry: TrackedItem, method: ChaseMethod): boolean {
    return (entry.item.chaseMethods ?? []).includes(method);
  }

  protected bisInfo(piece: IEquippedItem) {
    return this.state.bisInfoFor(piece);
  }

  protected async toggleBis(piece: IEquippedItem): Promise<void> {
    try {
      await this.state.toggleBisMark(piece);
    } catch (e) {
      this.toast.show((e as { error?: { message?: string } }).error?.message ?? 'Markeren mislukt', 'error');
    }
  }

  /**
   * The tier slot a chased item can be catalysed into, when the raider wears something there: the tier piece that the
   * item was (or will be) converted into.
   */
  protected catalystSlot(entry: TrackedItem): EquipmentSlot | null {
    const names: Record<string, EquipmentSlot> = {
      head: 'HEAD',
      shoulder: 'SHOULDER',
      chest: 'CHEST',
      hands: 'HANDS',
      legs: 'LEGS',
    };
    const slot = names[paperdollSlotOf(entry.item) ?? ''];
    if (!slot || !CATALYST_SLOTS.includes(slot)) return null;
    return this.state.equipment().some((w) => w.slot === slot) ? slot : null;
  }

  protected async catalyse(entry: TrackedItem, slot: EquipmentSlot): Promise<void> {
    if (!entry.item.chaseItemId) return;
    try {
      await this.state.catalyse(entry.item.chaseItemId, slot);
      this.toast.show(`${entry.item.name} gemarkeerd als gecatalyseerd: het tier-item in dit slot is nu BiS.`);
    } catch (e) {
      this.toast.show((e as { error?: { message?: string } }).error?.message ?? 'Catalyseren mislukt', 'error');
    }
  }

  protected async removeChase(entry: TrackedItem): Promise<void> {
    try {
      await this.state.unchase(entry.item.id);
    } catch (e) {
      const msg = (e as { error?: { message?: string } }).error?.message ?? 'Chase-lijst bijwerken mislukt';
      this.toast.show(msg, 'error');
    }
  }
}
