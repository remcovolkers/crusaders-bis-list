import { Component, computed, input } from '@angular/core';
import { IRaidPlanParticipant, WowSpec } from '@crusaders-bis-list/shared-domain';

// ── Spec role classification ─────────────────────────────────────────────────

const TANK_SPECS = new Set<WowSpec>([
  WowSpec.PROTECTION_WARRIOR,
  WowSpec.PROTECTION_PALADIN,
  WowSpec.BLOOD,
  WowSpec.VENGEANCE,
  WowSpec.DEVOURER,
  WowSpec.GUARDIAN,
  WowSpec.BREWMASTER,
]);

const HEALER_SPECS = new Set<WowSpec>([
  WowSpec.HOLY_PALADIN,
  WowSpec.DISCIPLINE,
  WowSpec.HOLY_PRIEST,
  WowSpec.RESTORATION_SHAMAN,
  WowSpec.RESTORATION_DRUID,
  WowSpec.MISTWEAVER,
  WowSpec.PRESERVATION,
]);

const RANGED_DPS_SPECS = new Set<WowSpec>([
  WowSpec.BALANCE,
  WowSpec.SHADOW,
  WowSpec.ELEMENTAL,
  WowSpec.ARCANE,
  WowSpec.FIRE,
  WowSpec.FROST_MAGE,
  WowSpec.AFFLICTION,
  WowSpec.DEMONOLOGY,
  WowSpec.DESTRUCTION,
  WowSpec.MARKSMANSHIP,
  WowSpec.BEAST_MASTERY,
  WowSpec.DEVASTATION,
  WowSpec.AUGMENTATION,
  WowSpec.DEVOURER,
]);

// ── Key buff providers ────────────────────────────────────────────────────────

const BLOODLUST_SPECS = new Set<WowSpec>([
  WowSpec.ELEMENTAL,
  WowSpec.ENHANCEMENT,
  WowSpec.RESTORATION_SHAMAN,
  WowSpec.ARCANE,
  WowSpec.FIRE,
  WowSpec.FROST_MAGE,
  WowSpec.BEAST_MASTERY,
]);

const BATTLE_REZ_SPECS = new Set<WowSpec>([
  WowSpec.BALANCE,
  WowSpec.FERAL,
  WowSpec.GUARDIAN,
  WowSpec.RESTORATION_DRUID,
  WowSpec.BLOOD,
  WowSpec.FROST_DK,
  WowSpec.UNHOLY,
  WowSpec.AFFLICTION,
  WowSpec.DEMONOLOGY,
  WowSpec.DESTRUCTION,
]);

const POWER_INFUSION_SPECS = new Set<WowSpec>([WowSpec.DISCIPLINE]);
const AUG_EVOKER_SPECS = new Set<WowSpec>([WowSpec.AUGMENTATION]);

interface BuffRow {
  label: string;
  icon: string;
  present: boolean;
  providers: string[];
}

@Component({
  selector: 'lib-composition-analysis',
  imports: [],
  templateUrl: './composition-analysis.component.html',
  styleUrl: './composition-analysis.component.scss',
})
export class CompositionAnalysisComponent {
  readonly raiders = input.required<IRaidPlanParticipant[]>();

  readonly tanks = computed(() => this.raiders().filter((p) => TANK_SPECS.has(p.spec)));
  readonly healers = computed(() => this.raiders().filter((p) => HEALER_SPECS.has(p.spec)));
  readonly ranged = computed(() =>
    this.raiders().filter((p) => !TANK_SPECS.has(p.spec) && !HEALER_SPECS.has(p.spec) && RANGED_DPS_SPECS.has(p.spec)),
  );
  readonly melee = computed(() =>
    this.raiders().filter((p) => !TANK_SPECS.has(p.spec) && !HEALER_SPECS.has(p.spec) && !RANGED_DPS_SPECS.has(p.spec)),
  );

  readonly buffs = computed<BuffRow[]>(() => {
    const raiders = this.raiders();
    return [
      this.buildBuff(raiders, 'Bloodlust / Hero', '🔥', BLOODLUST_SPECS),
      this.buildBuff(raiders, 'Battle Rez', '⚕️', BATTLE_REZ_SPECS),
      this.buildBuff(raiders, 'Power Infusion', '✨', POWER_INFUSION_SPECS),
      this.buildBuff(raiders, 'Aug Evoker', '🐉', AUG_EVOKER_SPECS),
    ];
  });

  private buildBuff(raiders: IRaidPlanParticipant[], label: string, icon: string, specs: Set<WowSpec>): BuffRow {
    const providers = raiders.filter((p) => specs.has(p.spec)).map((p) => p.characterName);
    return { label, icon, present: providers.length > 0, providers };
  }
}
