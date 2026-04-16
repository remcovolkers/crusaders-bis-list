import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FeedbackService, FeedbackEntry } from '../feedback.service';

@Component({
  selector: 'app-admin-feedback',
  templateUrl: './admin-feedback.component.html',
  styleUrl: './admin-feedback.component.scss',
})
export class AdminFeedbackComponent implements OnInit {
  private readonly feedbackService = inject(FeedbackService);

  readonly entries = signal<FeedbackEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly openEntries = computed(() => this.entries().filter((e) => !e.resolved));
  readonly doneEntries = computed(() => this.entries().filter((e) => e.resolved));

  ngOnInit(): void {
    this.feedbackService.getAll().subscribe({
      next: (data) => {
        this.entries.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Kon feedback niet laden.');
        this.loading.set(false);
      },
    });
  }

  toggleResolved(entry: FeedbackEntry): void {
    const action$ = entry.resolved ? this.feedbackService.unresolve(entry.id) : this.feedbackService.resolve(entry.id);

    action$.subscribe(() => {
      this.entries.update((list) =>
        list.map((e) =>
          e.id === entry.id
            ? { ...e, resolved: !e.resolved, resolvedAt: e.resolved ? null : new Date().toISOString() }
            : e,
        ),
      );
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
