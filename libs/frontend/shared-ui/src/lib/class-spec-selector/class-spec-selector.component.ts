import { Component, computed, input, OnInit, output, signal } from '@angular/core';
import { WowClass, WowSpec, WOW_CLASS_COLOR, SPECS_BY_CLASS } from '@crusaders-bis-list/shared-domain';

export interface ClassSpecSelection {
  wowClass: WowClass;
  spec: WowSpec;
}

interface ClassOption {
  label: string;
  value: WowClass;
  color: string;
}

interface SpecOption {
  label: string;
  value: WowSpec;
}

@Component({
  selector: 'lib-class-spec-selector',
  imports: [],
  templateUrl: './class-spec-selector.component.html',
  styleUrl: './class-spec-selector.component.scss',
})
export class ClassSpecSelectorComponent implements OnInit {
  readonly selectedClass = input<WowClass | null>(null);
  readonly selectedSpec = input<WowSpec | null>(null);
  readonly selectionChange = output<ClassSpecSelection>();

  readonly classes: ClassOption[] = Object.values(WowClass).map((cls) => ({
    label: cls,
    value: cls,
    color: WOW_CLASS_COLOR[cls],
  }));

  readonly currentClass = signal<WowClass | null>(null);
  readonly currentSpec = signal<WowSpec | null>(null);
  readonly specs = computed<SpecOption[]>(() => (this.currentClass() ? this.getSpecsFor(this.currentClass()!) : []));

  ngOnInit(): void {
    this.currentClass.set(this.selectedClass());
    this.currentSpec.set(this.selectedSpec());
  }

  selectClass(cls: WowClass): void {
    this.currentClass.set(cls);
    this.currentSpec.set(null);
  }

  selectSpec(spec: WowSpec): void {
    this.currentSpec.set(spec);
    const cls = this.currentClass();
    if (cls) {
      this.selectionChange.emit({ wowClass: cls, spec });
    }
  }

  private getSpecsFor(cls: WowClass): SpecOption[] {
    return (SPECS_BY_CLASS[cls] ?? []).map((s) => ({ label: s, value: s }));
  }

  getClassColor(cls: WowClass): string {
    return WOW_CLASS_COLOR[cls] ?? '#94a3b8';
  }
}
