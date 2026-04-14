import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  template: `
    <div class="unauth-container">
      <h2>Geen toegang</h2>
      <p>Je hebt geen rechten voor deze pagina.</p>
      <button (click)="goHome()">Terug naar Home</button>
    </div>
  `,
  styles: [`
    .unauth-container {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100vh; color: white;
      background: #1a1a2e;
    }
    h2 { color: #f0c040; }
    button { padding: 10px 24px; margin-top: 16px; cursor: pointer; }
  `],
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}
  goHome(): void { this.router.navigate(['/']); }
}
