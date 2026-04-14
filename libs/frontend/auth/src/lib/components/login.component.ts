import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo">
          <span class="logo-icon">⚔️</span>
          <h1>Crusaders BIS List</h1>
          <p class="subtitle">RoyalTeam Crusaders — Loot Reservations</p>
        </div>
        <button class="google-btn" (click)="loginWithGoogle()">
          <span class="google-icon">G</span>
          Inloggen met Google
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }
    .login-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 48px;
      text-align: center;
      max-width: 360px;
      width: 100%;
      backdrop-filter: blur(10px);
    }
    .logo-icon { font-size: 48px; display: block; margin-bottom: 16px; }
    h1 { color: #f0c040; margin: 0 0 8px; font-size: 1.8rem; }
    .subtitle { color: rgba(255,255,255,0.6); margin: 0 0 32px; }
    .google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 14px 24px;
      border: none;
      border-radius: 8px;
      background: #fff;
      color: #333;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.1s;
    }
    .google-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .google-icon {
      width: 20px; height: 20px;
      background: linear-gradient(45deg, #4285F4, #34A853, #FBBC05, #EA4335);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: bold; color: white; font-size: 12px;
    }
  `],
})
export class LoginComponent {
  constructor(private authService: AuthService) {}

  loginWithGoogle(): void {
    this.authService.redirectToGoogleLogin();
  }
}
