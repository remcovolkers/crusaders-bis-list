import { Component, input, output, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IRaidPlan,
  IRaidPlanParticipant,
  RaidParticipantRole,
  RaidDifficulty,
} from '@crusaders-bis-list/shared-domain';
import { RaidPlanService } from '../../services/raid-plan.service';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';

export interface DiscordMessage {
  content: string;
}

const DIFFICULTY_EMOJI: Record<RaidDifficulty, string> = {
  [RaidDifficulty.NORMAL]: '🟢',
  [RaidDifficulty.HEROIC]: '🔵',
  [RaidDifficulty.MYTHIC]: '🟣',
};

@Component({
  selector: 'lib-discord-composer',
  imports: [FormsModule],
  templateUrl: './discord-composer.component.html',
  styleUrls: ['./discord-composer.component.scss'],
})
export class DiscordComposerComponent {
  readonly plan = input.required<IRaidPlan>();
  readonly planUpdated = output<IRaidPlan>();

  private readonly service = inject(RaidPlanService);
  private readonly toast = inject(ToastService);

  readonly sending = signal(false);
  readonly scheduling = signal(false);
  readonly scheduleInput = signal('');

  // ── Computed Discord message preview ─────────────────────────────────────────

  readonly previewMessages = computed<DiscordMessage[]>(() => {
    const plan = this.plan();
    const raiders = plan.participants.filter((p) => p.role === RaidParticipantRole.RAIDER);
    const bench = plan.participants.filter((p) => p.role === RaidParticipantRole.BENCH);
    const absent = plan.participants.filter((p) => p.role === RaidParticipantRole.ABSENT);

    const dateStr = this.formatDate(plan.scheduledAt);
    const diffEmoji = DIFFICULTY_EMOJI[plan.difficulty] ?? '⚔️';

    const messages: DiscordMessage[] = [];

    const raiderLines = raiders.length ? raiders.map((p) => `${p.characterName} (${p.wowClass})`).join(', ') : '—';

    messages.push({
      content: [
        `${diffEmoji} **Raidplan: ${plan.raidName} — ${plan.difficulty}** | ${dateStr}`,
        `🗡️ **Mee-raiders (${raiders.length}):** ${raiderLines}`,
        ...(plan.notes ? [`📋 ${plan.notes}`] : []),
      ].join('\n'),
    });

    if (bench.length > 0) {
      const benchLines = bench.map((p) => `${p.characterName} (${p.wowClass})`).join(', ');
      messages.push({ content: `🪑 **Bank (${bench.length}):** ${benchLines}` });
    }

    if (absent.length > 0) {
      const absentLines = absent.map((p) => `${p.characterName} (${p.wowClass})`).join(', ');
      messages.push({ content: `❌ **Afgemeld (${absent.length}):** ${absentLines}` });
    }

    return messages;
  });

  readonly scheduleStatus = computed(() => {
    const plan = this.plan();
    if (plan.discordSentAt) {
      return { type: 'sent' as const, label: `✅ Verstuurd op ${this.formatDate(plan.discordSentAt)}` };
    }
    if (plan.scheduledDiscordAt) {
      return { type: 'scheduled' as const, label: `🕐 Gepland voor ${this.formatDate(plan.scheduledDiscordAt)}` };
    }
    return null;
  });

  // ── Actions ───────────────────────────────────────────────────────────────────

  sendNow(): void {
    const plan = this.plan();
    this.sending.set(true);
    this.service.sendDiscordNotification(plan.id).subscribe({
      next: () => {
        this.toast.show('Discord bericht verstuurd!');
        this.sending.set(false);
        // Mark as sent in local state by refreshing
        this.service.getById(plan.id).subscribe({ next: (updated) => this.planUpdated.emit(updated) });
      },
      error: (err) => {
        this.toast.show(err?.error?.message ?? 'Versturen mislukt.', 'error');
        this.sending.set(false);
      },
    });
  }

  saveSchedule(): void {
    const plan = this.plan();
    const value = this.scheduleInput();
    const scheduledDiscordAt = value ? new Date(value).toISOString() : null;
    this.scheduling.set(true);
    this.service.scheduleDiscordNotification(plan.id, { scheduledDiscordAt }).subscribe({
      next: (updated) => {
        this.toast.show(scheduledDiscordAt ? 'Discord melding ingepland!' : 'Planning verwijderd.');
        this.planUpdated.emit(updated);
        this.scheduling.set(false);
      },
      error: () => {
        this.toast.show('Opslaan mislukt.', 'error');
        this.scheduling.set(false);
      },
    });
  }

  clearSchedule(): void {
    this.scheduleInput.set('');
    this.saveSchedule();
  }

  // ── Markdown renderer (simplified for preview) ────────────────────────────────

  renderMarkdown(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  private formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Amsterdam',
    }).format(new Date(date));
  }
}
