import { Component, computed, input } from '@angular/core';
import { IRaidPlanParticipant, WowClass, WowSpec } from '@crusaders-bis-list/shared-domain';

// ── Spec role classification ─────────────────────────────────────────────────

const TANK_SPECS = new Set<WowSpec>([
  WowSpec.PROTECTION_WARRIOR,
  WowSpec.PROTECTION_PALADIN,
  WowSpec.BLOOD,
  WowSpec.VENGEANCE,
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

export type SpecRole = 'tank' | 'healer' | 'dps';

/** Role of a spec (tank / healer / dps), shared with the raid plan list. */
export function specRole(spec: WowSpec): SpecRole {
  if (TANK_SPECS.has(spec)) return 'tank';
  if (HEALER_SPECS.has(spec)) return 'healer';
  return 'dps';
}

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
  /** Material Symbols icon name */
  icon: string;
  /** CSS colour (token) for the icon */
  color: string;
  present: boolean;
  providers: string[];
}

interface RaidBuffRow {
  label: string;
  effect: string;
  icon: string;
  wowClass: WowClass;
  present: boolean;
  /** CSS class colour token */
  color: string;
}

interface TierTokenGroup {
  label: string;
  classes: string;
  count: number;
}

// ── Mandatory raid buffs (one class provides each) ───────────────────────────

const RAID_BUFFS: { label: string; effect: string; icon: string; wowClass: WowClass; color: string }[] = [
  {
    label: 'Arcane Intellect',
    effect: '5% INT',
    icon: 'auto_stories',
    wowClass: WowClass.MAGE,
    color: 'var(--class-mage)',
  },
  {
    label: 'Battle Shout',
    effect: '5% AP',
    icon: 'campaign',
    wowClass: WowClass.WARRIOR,
    color: 'var(--class-warrior)',
  },
  {
    label: 'Mark of the Wild',
    effect: '3% VERS',
    icon: 'nature_people',
    wowClass: WowClass.DRUID,
    color: 'var(--class-druid)',
  },
  {
    label: 'PW: Fortitude',
    effect: '5% STAM',
    icon: 'shield_with_heart',
    wowClass: WowClass.PRIEST,
    color: 'var(--class-priest)',
  },
  {
    label: 'Chaos Brand',
    effect: '5% MAG',
    icon: 'token',
    wowClass: WowClass.DEMON_HUNTER,
    color: 'var(--class-demon-hunter)',
  },
  { label: 'Mystic Touch', effect: '5% PHYS', icon: 'pan_tool', wowClass: WowClass.MONK, color: 'var(--class-monk)' },
];

// ── Armor tier token groups (class -> token), same grouping as the season definition ──

const TIER_TOKEN_GROUPS: { label: string; classes: string; members: WowClass[] }[] = [
  {
    label: 'Dreadful',
    classes: 'DK/DH/Lock',
    members: [WowClass.DEATH_KNIGHT, WowClass.DEMON_HUNTER, WowClass.WARLOCK],
  },
  { label: 'Mystic', classes: 'Dru/Hun/Mag', members: [WowClass.DRUID, WowClass.HUNTER, WowClass.MAGE] },
  { label: 'Venerated', classes: 'Pal/Pri/Shm', members: [WowClass.PALADIN, WowClass.PRIEST, WowClass.SHAMAN] },
  {
    label: 'Zenith',
    classes: 'Mnk/Rog/War/Evk',
    members: [WowClass.MONK, WowClass.ROGUE, WowClass.WARRIOR, WowClass.EVOKER],
  },
];

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

  readonly dpsCount = computed(() => this.ranged().length + this.melee().length);

  /** Width (%) of each role segment in the ratio bar. */
  readonly ratio = computed(() => {
    const total = this.raiders().length || 1;
    const pct = (n: number) => (n / total) * 100;
    return {
      tanks: pct(this.tanks().length),
      healers: pct(this.healers().length),
      melee: pct(this.melee().length),
      ranged: pct(this.ranged().length),
    };
  });

  readonly buffs = computed<BuffRow[]>(() => {
    const raiders = this.raiders();
    return [
      this.buildBuff(raiders, 'Bloodlust / Hero', 'electric_bolt', 'var(--tier-super-rare)', BLOODLUST_SPECS),
      this.buildBuff(raiders, 'Battle Rez', 'replay', 'var(--danger-text)', BATTLE_REZ_SPECS),
      this.buildBuff(raiders, 'Power Infusion', 'auto_awesome', 'var(--class-priest)', POWER_INFUSION_SPECS),
      this.buildBuff(raiders, 'Aug Evoker', 'stars', 'var(--class-evoker)', AUG_EVOKER_SPECS),
    ];
  });

  readonly raidBuffs = computed<RaidBuffRow[]>(() => {
    const classes = new Set(this.raiders().map((p) => p.wowClass));
    return RAID_BUFFS.map((b) => ({ ...b, present: classes.has(b.wowClass) }));
  });

  readonly tierTokens = computed<TierTokenGroup[]>(() =>
    TIER_TOKEN_GROUPS.map((g) => ({
      label: g.label,
      classes: g.classes,
      count: this.raiders().filter((p) => g.members.includes(p.wowClass)).length,
    })),
  );

  readonly maxTierCount = computed(() => Math.max(0, ...this.tierTokens().map((t) => t.count)));

  /** Key buffs + raid buffs that are covered, out of the total. */
  readonly coverage = computed(() => {
    const all = [...this.buffs(), ...this.raidBuffs()];
    const present = all.filter((b) => b.present).length;
    return { present, total: all.length, full: present === all.length };
  });

  private buildBuff(
    raiders: IRaidPlanParticipant[],
    label: string,
    icon: string,
    color: string,
    specs: Set<WowSpec>,
  ): BuffRow {
    const providers = raiders.filter((p) => specs.has(p.spec)).map((p) => p.characterName);
    return { label, icon, color, present: providers.length > 0, providers };
  }
}
