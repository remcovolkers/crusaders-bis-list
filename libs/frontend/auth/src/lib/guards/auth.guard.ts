import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStateService } from '../state/auth-state.service';
import { RaiderProfileService } from '../services/raider-profile.service';

export function guestGuard(): boolean {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  if (authState.isAuthenticated()) {
    router.navigate(['/loot']);
    return false;
  }
  return true;
}

export function authGuard(): boolean {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  if (!authState.isAuthenticated()) {
    router.navigate(['/auth']);
    return false;
  }
  return true;
}

export function adminGuard(): boolean {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  if (!authState.isAdmin()) {
    router.navigate(['/unauthorized']);
    return false;
  }
  return true;
}

export function superUserGuard(): boolean {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  if (!authState.isSuperAdmin()) {
    router.navigate(['/loot']);
    return false;
  }
  return true;
}

export async function profileGuard(): Promise<boolean> {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const raiderProfileService = inject(RaiderProfileService);
  if (!authState.isAuthenticated()) {
    router.navigate(['/auth']);
    return false;
  }
  const has = await raiderProfileService.hasProfile();
  if (!has) {
    router.navigate(['/onboarding']);
    return false;
  }
  return true;
}
