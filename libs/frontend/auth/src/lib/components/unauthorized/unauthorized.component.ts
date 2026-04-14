import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-unauthorized',
  imports: [],
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss'],
})
export class UnauthorizedComponent {
  private readonly router = inject(Router);
  goHome(): void { this.router.navigate(['/']); }
}
