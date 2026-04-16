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
  readonly labelText = signal('');

  private readonly labels = [
    'Staat al je loot erin?',
    'Ziet het er goed uit?',
    'Mis je iets?',
    'Klopt je spec?',
    'Iets wat beter kan?',
    'Heb je een bug gevonden?',
    'Alles duidelijk?',
    'Kan er iets beter? Let me know!',
  ];
  private labelIndex = 0;

  private nextLabel(): string {
    const text = this.labels[this.labelIndex % this.labels.length];
    this.labelIndex++;
    return text;
  }

  currentPage = '/';
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private pulseInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.currentPage = this.router.url;
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.currentPage = e.urlAfterRedirects;

      if (this.showTimer) clearTimeout(this.showTimer);
      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.showLabel.set(false);

      // Reset the pulse interval so it never fires right after a nav label
      if (this.pulseInterval) clearInterval(this.pulseInterval);
      this.pulseInterval = setInterval(() => {
        if (!this.open()) this.showLabelFor(3500);
      }, 15000);

      this.showTimer = setTimeout(() => {
        this.showLabelFor(4000);
      }, 100);
    });

    // Pulse every 15s (matching CSS), show a new label each time
    this.pulseInterval = setInterval(() => {
      if (!this.open()) this.showLabelFor(3500);
    }, 15000);
  }

  private showLabelFor(duration: number): void {
    this.labelText.set(this.nextLabel());
    this.showLabel.set(true);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.showLabel.set(false), duration);
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
