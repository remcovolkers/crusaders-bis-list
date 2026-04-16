import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FeedbackService } from '../feedback.service';

@Component({
  selector: 'app-feedback-button',
  templateUrl: './feedback-button.component.html',
  styleUrl: './feedback-button.component.scss',
})
export class FeedbackButtonComponent {
  private readonly feedbackService = inject(FeedbackService);
  private readonly router = inject(Router);

  readonly open = signal(false);
  readonly message = signal('');
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');
  readonly showLabel = signal(false);

  currentPage = '/';

  constructor() {
    this.currentPage = this.router.url;
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.currentPage = e.urlAfterRedirects;
      this.showLabel.set(false);
      setTimeout(() => {
        this.showLabel.set(true);
        setTimeout(() => this.showLabel.set(false), 4000);
      }, 100);
    });
  }

  toggle(): void {
    this.open.update((v) => !v);
    if (!this.open()) this.reset();
  }

  send(): void {
    const msg = this.message().trim();
    if (!msg) return;
    this.sending.set(true);
    this.error.set('');
    this.feedbackService.submit(msg, this.currentPage).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
        setTimeout(() => {
          this.open.set(false);
          this.reset();
        }, 1800);
      },
      error: () => {
        this.sending.set(false);
        this.error.set('Verzenden mislukt. Probeer opnieuw.');
      },
    });
  }

  private reset(): void {
    this.message.set('');
    this.sent.set(false);
    this.error.set('');
    this.sending.set(false);
  }
}
