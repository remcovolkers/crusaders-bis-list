import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ItemTooltipDirective } from '@crusaders-bis-list/frontend-shared-ui';
import { RaidDifficulty, TIER_LABELS } from '@crusaders-bis-list/shared-domain';
import { RaiderLootStateService } from '../../services/raider-loot-state.service';
import { buildGearingPlan, PLAN_ACTION_ORDER, PlanAction, PlanSource } from '../../ui-types/gearing-plan';

interface ActionMeta {
  label: string;
  icon: string;
  hint: string;
}

/** English, like the character pane it sits next to. */
const ACTION_META: Record<PlanAction, ActionMeta> = {
  reserved: { label: 'Reserved', icon: 'bookmark', hint: 'Reserved: it has to drop and your loot master assigns it' },
  drop: { label: 'Drop', icon: 'flag', hint: 'Chased: hoping for a drop from this boss' },
  drop_bonus: { label: 'Drop + bonus roll', icon: 'casino', hint: 'Chased: a drop or a bonus roll, whichever comes first' },
  bonus_roll: { label: 'Bonus roll', icon: 'casino', hint: 'Chased: planned via a bonus roll on this boss' },
  upgrade: { label: 'Upgrade', icon: 'trending_up', hint: 'Best in slot, but a bonus roll on this boss can still upgrade it' },
};

/**
 * Gearing plan next to the character pane: what to do where. Lists, per boss, the items the raider still has to get
 * (drops, bonus rolls, reserved items) and the upgrades a bonus roll can still give, so a raid night has a clear goal.
 * Each item says from which difficulty it helps: Heroic+ (Heroic or Mythic) or Mythic only.
 */
@Component({
  selector: 'lib-loot-plan',
  imports: [RouterLink, ItemTooltipDirective],
  templateUrl: './loot-plan.component.html',
  styleUrls: ['./loot-plan.component.scss'],
})
export class LootPlanComponent {
  protected readonly state = inject(RaiderLootStateService);
  protected readonly actionMeta = ACTION_META;
  protected readonly actionOrder = PLAN_ACTION_ORDER;
  protected readonly RaidDifficulty = RaidDifficulty;

  protected readonly plan = computed(() => {
    const bossOrder = this.state.catalog()?.bosses.map((b) => b.name) ?? [];
    const sources: PlanSource[] = this.state.trackedItems().map((t) => {
      const worn = t.equippedItem;
      const wornTier = worn ? (worn.tier ? TIER_LABELS[worn.tier] : worn.tierLabel) : null;
      return {
        name: t.item.name,
        iconUrl: t.item.iconUrl,
        tooltip: t.item.tooltip,
        via: t.item.tierTokenName,
        bossName: t.bossName,
        kind: t.kind,
        isBis: t.isBis,
        upgradeTo: t.upgradeTo,
        methods: t.item.chaseMethods ?? [],
        needs: t.needs,
        currently: worn ? [wornTier, worn.itemLevel || null].filter(Boolean).join(' · ') : null,
      };
    });
    return buildGearingPlan(sources, bossOrder);
  });

  protected readonly summary = computed(() => {
    const t = this.plan().totals;
    return (Object.keys(ACTION_META) as PlanAction[])
      .filter((a) => t[a] > 0)
      .map((a) => ({ action: a, count: t[a], ...ACTION_META[a] }));
  });
}
