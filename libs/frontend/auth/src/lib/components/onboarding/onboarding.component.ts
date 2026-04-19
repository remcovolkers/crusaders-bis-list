import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClassSpecSelectorComponent, ClassSpecSelection } from '@crusaders-bis-list/frontend-shared-ui';
import { WowClass, WowSpec, WOW_CLASS_REGISTRY } from '@crusaders-bis-list/shared-domain';
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

export interface WowCharacter {
  name: string;
  realm: string;
  realmSlug: string;
  wowClass: WowClass;
  level: number;
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
  readonly step = signal<0 | 1 | 2>(1);

  // Character picker (step 0)
  readonly wowCharacters = signal<WowCharacter[]>([]);
  readonly wowCharactersLoading = signal(false);
  readonly wowCharactersError = signal('');
  readonly selectedCharacter = signal<WowCharacter | null>(null);

  // Update character mode (after BNET link for existing profile)
  readonly updateCharMode = signal(false);
  readonly updateCharError = signal('');
  private readonly existingProfile = signal<RaiderProfile | null>(null);

  private readonly currentUser = toSignal(this.store.select(selectCurrentUser));
  readonly isBnetLinked = computed(() => this.currentUser()?.bnetLinked ?? false);

  linkBnet(): void {
    this.authService.redirectToBnetLink();
  }

  loadWowCharacters(): void {
    this.wowCharactersLoading.set(true);
    this.wowCharactersError.set('');
    this.http.get<WowCharacter[]>(`${this.apiUrl}/raider/wow-characters`).subscribe({
      next: (chars) => {
        this.wowCharacters.set(chars);
        this.wowCharactersLoading.set(false);
        this.step.set(0);
      },
      error: () => {
        this.wowCharactersError.set('Karakters ophalen mislukt. Vul handmatig in.');
        this.wowCharactersLoading.set(false);
      },
    });
  }

  pickCharacter(char: WowCharacter): void {
    if (this.updateCharMode()) {
      const existingClass = this.existingProfile()?.wowClass;
      if (!char.wowClass || char.wowClass !== existingClass) {
        this.updateCharError.set('Als je je class en spec wilt veranderen neem eerst contact op met Bram | Sapphire');
        return;
      }
      this.updateCharError.set('');
      this.saving.set(true);
      this.http
        .put(`${this.apiUrl}/raider/profile`, {
          characterName: char.name,
          realm: char.realm,
          wowClass: existingClass,
          spec: this.existingProfile()?.spec,
          isCrusadersMember: this.isCrusadersMember(),
        })
        .subscribe({
          next: () => {
            this.authService.getMe().subscribe({
              next: (freshUser) => {
                this.store.dispatch(
                  AuthActions.loginSuccess({ user: freshUser, token: this.authService.getToken() ?? '' }),
                );
                this.router.navigate(['/loot']);
              },
              error: () => this.router.navigate(['/loot']),
            });
          },
          error: () => {
            this.saving.set(false);
            this.updateCharError.set('Opslaan mislukt, probeer opnieuw.');
          },
        });
      return;
    }
    this.selectedCharacter.set(char);
    this.characterName.set(char.name);
    this.realm.set(char.realm);
    this.selectedClass.set(char.wowClass);
    this.step.set(2); // Skip step 1 (name/realm), go straight to spec
  }

  skipCharacterPicker(): void {
    if (this.updateCharMode()) {
      this.router.navigate(['/loot']);
      return;
    }
    this.step.set(1);
  }

  /** True when opened via ?edit=true to update an existing profile. */
  readonly editMode = signal(false);
  private existingProfileId = signal<string | null>(null);

  ngOnInit(): void {
    const isEdit = this.route.snapshot.queryParamMap.get('edit') === 'true';
    const justLinked = this.route.snapshot.queryParamMap.get('bnet_linked') === '1';

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
          } else if (justLinked) {
            // Just linked BNET with existing profile — show character picker to update name/realm
            this.existingProfile.set(profile);
            this.existingProfileId.set(profile.id);
            this.updateCharMode.set(true);
            this.selectedClass.set(profile.wowClass);
            this.selectedSpec.set(profile.spec);
            this.characterName.set(profile.characterName);
            this.realm.set(profile.realm ?? '');
            this.store
              .select(selectCurrentUser)
              .subscribe((u) => {
                if (u) this.isCrusadersMember.set(u.isCrusadersMember);
              })
              .unsubscribe();
            this.loadWowCharacters();
          } else {
            // Already has a profile and not editing — go to loot
            this.router.navigate(['/loot']);
          }
        } else if (justLinked || this.isBnetLinked()) {
          // New user with BNET linked — load characters
          this.loadWowCharacters();
        }
        // No profile and no BNET: stay on onboarding in create mode (step 1)
      },
      error: () => {
        if (justLinked || this.isBnetLinked()) this.loadWowCharacters();
      },
    });
  }

  onClassSpecChange(sel: ClassSpecSelection): void {
    this.selectedClass.set(sel.wowClass);
    this.selectedSpec.set(sel.spec);
  }

  classColor(wowClass: WowClass): string {
    return WOW_CLASS_REGISTRY[wowClass]?.color ?? '#94a3b8';
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
