import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ISeasonConfig } from '@crusaders-bis-list/shared-domain';

@Component({
  selector: 'lib-admin-season-config',
  imports: [FormsModule],
  templateUrl: './admin-season-config.component.html',
  styleUrl: './admin-season-config.component.scss',
})
export class AdminSeasonConfigComponent implements OnInit {
  readonly config = signal<ISeasonConfig | null>(null);
  readonly trinketLimit = signal(2);
  readonly weaponLimit = signal(2);
  readonly jewelryLimit = signal(1);
  readonly otherLimit = signal(1);
  readonly superrareLimit = signal(0);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  private readonly adminService = inject(AdminService);

  ngOnInit(): void {
    this.adminService.getSeasonConfig().subscribe({
      next: (c) => {
        this.config.set(c);
        this.trinketLimit.set(c.trinketLimit);
        this.weaponLimit.set(c.weaponLimit);
        this.jewelryLimit.set(c.jewelryLimit);
        this.otherLimit.set(c.otherLimit);
        this.superrareLimit.set(c.superrareLimit);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Kon configuratie niet laden.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    const config = this.config();
    if (!config) return;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.adminService
      .updateSeasonConfig(config.raidSeasonId, {
        trinketLimit: this.trinketLimit(),
        weaponLimit: this.weaponLimit(),
        jewelryLimit: this.jewelryLimit(),
        otherLimit: this.otherLimit(),
        superrareLimit: this.superrareLimit(),
      })
      .subscribe({
        next: (c) => {
          this.config.set(c);
          this.saving.set(false);
          this.success.set('Configuratie opgeslagen!');
          setTimeout(() => this.success.set(''), 3000);
        },
        error: () => {
          this.error.set('Opslaan mislukt.');
          this.saving.set(false);
        },
      });
  }
}
