import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStateService } from '@crusaders-bis-list/frontend-auth';
import { SUPER_USER_EMAIL, Team } from '@crusaders-bis-list/shared-domain';
import { AdminTeamContextService } from '../../services/admin-team-context.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'lib-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss'],
})
export class AdminShellComponent {
  private readonly authState = inject(AuthStateService);
  readonly teamContext = inject(AdminTeamContextService);

  readonly Team = Team;
  readonly isSuperUser = computed(() => this.authState.user()?.email === SUPER_USER_EMAIL);
  readonly viewedTeam = computed(
    () => this.teamContext.selectedTeam() ?? this.authState.user()?.team ?? Team.CRUSADERS,
  );

  readonly navItems: NavItem[] = [
    { path: 'boss-view', label: 'Loot toewijzing', icon: '🎲' },
    { path: 'users', label: 'Gebruikers', icon: '👥' },
    { path: 'season-config', label: 'Seizoen config', icon: '⚙️' },
    { path: 'audit-log', label: 'Audit log', icon: '📜' },
  ];

  selectTeam(team: Team): void {
    this.teamContext.setTeam(team);
  }
}
