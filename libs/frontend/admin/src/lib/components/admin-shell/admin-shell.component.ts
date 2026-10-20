import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStateService } from '@crusaders-bis-list/frontend-auth';
import { SUPER_USER_EMAIL, Team } from '@crusaders-bis-list/shared-domain';
import { AdminTeamContextService } from '../../services/admin-team-context.service';
import { AdminService } from '../../services/admin.service';

interface NavItem {
  path: string;
  label: string;
  /** Material Symbols icon name */
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
  private readonly adminService = inject(AdminService);
  readonly teamContext = inject(AdminTeamContextService);

  readonly Team = Team;
  readonly isSuperUser = computed(() => this.authState.user()?.email === SUPER_USER_EMAIL);
  readonly viewedTeam = computed(
    () => this.teamContext.selectedTeam() ?? this.authState.user()?.team ?? Team.CRUSADERS,
  );

  /** Active season for the sidebar chip (taken from the catalog the admin pages load anyway). */
  private readonly seasonResource = rxResource({
    params: () => this.viewedTeam(),
    stream: ({ params: team }) => this.adminService.getCatalog(team),
  });
  readonly season = computed(() => this.seasonResource.value()?.season ?? null);

  readonly navItems: NavItem[] = [
    { path: 'boss-view', label: 'Loot toewijzing', icon: 'casino' },
    { path: 'users', label: 'Gebruikers', icon: 'group' },
    { path: 'season-config', label: 'Seizoen config', icon: 'tune' },
    { path: 'audit-log', label: 'Audit log', icon: 'balance' },
  ];

  selectTeam(team: Team): void {
    this.teamContext.setTeam(team);
  }
}
