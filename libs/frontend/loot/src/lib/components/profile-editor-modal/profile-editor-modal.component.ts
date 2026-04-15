import { Component, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IRaiderProfile, WowClass, WowSpec } from '@crusaders-bis-list/shared-domain';
import { ClassSpecSelectorComponent, ClassSpecSelection } from '@crusaders-bis-list/frontend-shared-ui';
import { ProfileSaveDto } from '../../domain/loot-ui.types';

@Component({
  selector: 'lib-profile-editor-modal',
  imports: [FormsModule, ClassSpecSelectorComponent],
  templateUrl: './profile-editor-modal.component.html',
  styleUrls: ['./profile-editor-modal.component.scss'],
})
export class ProfileEditorModalComponent implements OnInit {
  readonly profile = input<IRaiderProfile | null>(null);

  /** Emits the validated DTO; does NOT call the API itself. */
  readonly saved = output<ProfileSaveDto>();
  readonly cancelled = output<void>();

  // Internal edit state
  readonly editCharName = signal('');
  readonly editRealm = signal('');
  readonly editClass = signal<WowClass | null>(null);
  readonly editSpec = signal<WowSpec | null>(null);

  ngOnInit(): void {
    const p = this.profile();
    this.editCharName.set(p?.characterName ?? '');
    this.editRealm.set(p?.realm ?? '');
    this.editClass.set(p?.wowClass ?? null);
    this.editSpec.set(p?.spec ?? null);
  }

  get canSave(): boolean {
    return !!this.editClass() && !!this.editSpec() && !!this.editCharName().trim();
  }

  onClassSpecChange(sel: ClassSpecSelection): void {
    this.editClass.set(sel.wowClass);
    this.editSpec.set(sel.spec);
  }

  save(): void {
    if (!this.canSave) return;
    this.saved.emit({
      characterName: this.editCharName().trim(),
      realm: this.editRealm().trim(),
      wowClass: this.editClass() as WowClass,
      spec: this.editSpec() as WowSpec,
    });
  }
}
