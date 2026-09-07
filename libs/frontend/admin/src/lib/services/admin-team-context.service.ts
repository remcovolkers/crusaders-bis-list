import { Injectable, signal } from '@angular/core';
import { Team } from '@crusaders-bis-list/shared-domain';

/**
 * Shared team-view state for the admin panel. Only the hardcoded super user can change this;
 * for every other admin the backend ignores this value and enforces their own team server-side.
 */
@Injectable({ providedIn: 'root' })
export class AdminTeamContextService {
  readonly selectedTeam = signal<Team | null>(null);

  setTeam(team: Team): void {
    this.selectedTeam.set(team);
  }
}
