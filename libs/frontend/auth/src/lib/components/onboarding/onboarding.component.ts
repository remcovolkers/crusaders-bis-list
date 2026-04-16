import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { ClassSpecSelectorComponent, ClassSpecSelection } from '@crusaders-bis-list/frontend-shared-ui';
import { WowClass, WowSpec } from '@crusaders-bis-list/shared-domain';
import { API_URL } from '../../tokens/api-url.token';
import { AuthService } from '../../services/auth.service';
import * as AuthActions from '../../state/auth.actions';
import { selectCurrentUser } from '../../state/auth.selectors';

interface RaiderProfile {
  id: string;
  characterName: string;
  realm?: string;
  wowClass: WowClass;
  spec: WowSpec;
}

@Component({
  selector: 'lib-onboarding',
  imports: [FormsModule, ClassSpecSelectorComponent],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
})
export class OnboardingComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);

  readonly characterName = signal('');
  readonly realm = signal('');
  readonly isCrusadersMember = signal(false);
  readonly selectedClass = signal<WowClass | null>(null);
  readonly selectedSpec = signal<WowSpec | null>(null);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly step = signal<1 | 2>(1);

  /** True when opened via ?edit=true to update an existing profile. */
  readonly editMode = signal(false);
  private existingProfileId = signal<string | null>(null);

  ngOnInit(): void {
    const isEdit = this.route.snapshot.queryParamMap.get('edit') === 'true';

    this.http.get<RaiderProfile | null>(`${this.apiUrl}/raider/my-profile`).subscribe({
      next: (profile) => {
        if (profile) {
          if (isEdit) {
            // Pre-fill form with existing data
            this.editMode.set(true);
            this.existingProfileId.set(profile.id);
            this.characterName.set(profile.characterName);
            this.realm.set(profile.realm ?? '');
            this.selectedClass.set(profile.wowClass);
            this.selectedSpec.set(profile.spec);
            // Pre-fill membership from current auth state
            this.store
              .select(selectCurrentUser)
              .subscribe((u) => {
                if (u) this.isCrusadersMember.set(u.isCrusadersMember);
              })
              .unsubscribe();
          } else {
            // Already has a profile and not editing — go to loot
            this.router.navigate(['/loot']);
          }
        }
        // No profile: stay on onboarding in create mode
      },
      error: () => {
        /* no profile yet */
      },
    });
  }

  onClassSpecChange(sel: ClassSpecSelection): void {
    this.selectedClass.set(sel.wowClass);
    this.selectedSpec.set(sel.spec);
  }

  get canProceedStep1(): boolean {
    return this.characterName().trim().length > 0 && this.realm().trim().length > 0;
  }

  get canSubmit(): boolean {
    return this.canProceedStep1 && !!this.selectedClass() && !!this.selectedSpec();
  }

  goToStep2(): void {
    if (this.canProceedStep1) this.step.set(2);
  }

  cancel(): void {
    this.router.navigate(['/loot']);
  }

  save(): void {
    if (!this.canSubmit) return;
    this.saving.set(true);
    this.error.set('');

    const payload = {
      characterName: this.characterName().trim(),
      realm: this.realm().trim(),
      wowClass: this.selectedClass(),
      spec: this.selectedSpec(),
      isCrusadersMember: this.isCrusadersMember(),
    };

    const request$ = this.editMode()
      ? this.http.put(`${this.apiUrl}/raider/profile`, payload)
      : this.http.post(`${this.apiUrl}/raider/profile`, payload);

    request$.subscribe({
      next: () => {
        // Refresh auth state so isCrusadersMember is up to date in the store
        this.authService.getMe().subscribe({
          next: (freshUser) => {
            this.store.dispatch(
              AuthActions.loginSuccess({
                user: freshUser,
                token: this.authService.getToken() ?? '',
              }),
            );
            this.router.navigate(['/loot']);
          },
          error: () => this.router.navigate(['/loot']),
        });
      },
      error: () => {
        this.error.set('Opslaan mislukt, probeer opnieuw.');
        this.saving.set(false);
      },
    });
  }
}
