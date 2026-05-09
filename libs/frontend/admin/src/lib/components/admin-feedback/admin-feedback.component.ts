import { Component, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FeedbackService, FeedbackEntry } from '@crusaders-bis-list/frontend-shared-ui';

@Component({
  selector: 'lib-admin-feedback',
  templateUrl: './admin-feedback.component.html',
  styleUrl: './admin-feedback.component.scss',
})
export class AdminFeedbackComponent {
  private readonly feedbackService = inject(FeedbackService);

  private readonly feedbackResource = rxResource({ stream: () => this.feedbackService.getAll() });

  readonly entries = computed(() => this.feedbackResource.value() ?? []);
  readonly loading = this.feedbackResource.isLoading;
  readonly error = computed(() => (this.feedbackResource.error() !== undefined ? 'Kon feedback niet laden.' : ''));

  readonly openEntries = computed(() => this.entries().filter((e) => !e.resolved));
  readonly doneEntries = computed(() => this.entries().filter((e) => e.resolved));

  toggleResolved(entry: FeedbackEntry): void {
    const action$ = entry.resolved ? this.feedbackService.unresolve(entry.id) : this.feedbackService.resolve(entry.id);

    action$.subscribe(() => {
      this.feedbackResource.update((list) =>
        (list ?? []).map((e) =>
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
