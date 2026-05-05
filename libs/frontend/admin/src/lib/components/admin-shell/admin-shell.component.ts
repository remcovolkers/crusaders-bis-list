import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
  readonly navItems: NavItem[] = [
    { path: 'boss-view', label: 'Loot toewijzing', icon: '🎲' },
    { path: 'users', label: 'Gebruikers', icon: '👥' },
    { path: 'season-config', label: 'Seizoen config', icon: '⚙️' },
    { path: 'audit-log', label: 'Audit log', icon: '📜' },
  ];
}
