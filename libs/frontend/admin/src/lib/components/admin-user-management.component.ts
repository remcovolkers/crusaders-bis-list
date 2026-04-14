import { Component, OnInit } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { IUser, UserRole } from '@crusaders-bis-list/shared-domain';

@Component({
  selector: 'app-admin-user-management',
  template: `
    <div class="user-mgmt">
      <h2>Gebruikersbeheer</h2>
      <table *ngIf="users.length">
        <thead>
          <tr>
            <th>Naam</th>
            <th>E-mail</th>
            <th>Rollen</th>
            <th>Acties</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users">
            <td>{{ user.displayName }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.roles.join(', ') }}</td>
            <td>
              <button *ngIf="!user.roles.includes(adminRole)" (click)="makeAdmin(user)">
                Maak Admin
              </button>
              <button *ngIf="user.roles.includes(adminRole)" (click)="removeAdmin(user)" class="danger">
                Verwijder Admin
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="message" class="message">{{ message }}</div>
    </div>
  `,
  styles: [`
    .user-mgmt { padding: 24px; color: #e8e8e8; }
    h2 { color: #f0c040; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #21262d; }
    th { color: #888; font-size: 0.8rem; text-transform: uppercase; }
    button { padding: 5px 12px; border: none; border-radius: 6px; cursor: pointer; background: #a78bfa; color: white; }
    button.danger { background: #c0392b; }
    .message { margin-top: 16px; color: #4ade80; }
  `],
})
export class AdminUserManagementComponent implements OnInit {
  users: IUser[] = [];
  message = '';
  readonly adminRole = UserRole.ADMIN;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getAllUsers().subscribe((users) => (this.users = users));
  }

  makeAdmin(user: IUser): void {
    const roles = [...new Set([...user.roles, UserRole.ADMIN])];
    this.adminService.updateUserRoles(user.id, roles).subscribe({
      next: () => {
        user.roles = roles;
        this.message = `${user.displayName} is nu admin.`;
        setTimeout(() => (this.message = ''), 3000);
      },
    });
  }

  removeAdmin(user: IUser): void {
    const roles = user.roles.filter((r) => r !== UserRole.ADMIN);
    this.adminService.updateUserRoles(user.id, roles).subscribe({
      next: () => {
        user.roles = roles;
        this.message = `${user.displayName} is geen admin meer.`;
        setTimeout(() => (this.message = ''), 3000);
      },
    });
  }
}
