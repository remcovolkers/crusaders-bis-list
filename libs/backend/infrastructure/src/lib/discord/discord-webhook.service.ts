import { Injectable, Logger } from '@nestjs/common';
import { IRaidPlan, RaidParticipantRole } from '@crusaders-bis-list/shared-domain';

@Injectable()
export class DiscordWebhookService {
  private readonly logger = new Logger(DiscordWebhookService.name);

  async sendRaidPlanNotification(plan: IRaidPlan, webhookUrl: string): Promise<void> {
    const raiders = plan.participants.filter((p) => p.role === RaidParticipantRole.RAIDER);
    const bench = plan.participants.filter((p) => p.role === RaidParticipantRole.BENCH);
    const absent = plan.participants.filter((p) => p.role === RaidParticipantRole.ABSENT);

    const dateStr = new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Amsterdam',
    }).format(new Date(plan.scheduledAt));

    const messages: object[] = [];

    // Message 1: raid summary + raiders
    const raiderLines = raiders.map((p) => `${p.characterName} (${p.wowClass})`).join(', ');
    messages.push({
      content: [
        `⚔️ **Raidplan: ${plan.raidName} — ${plan.difficulty}** | ${dateStr}`,
        `🗡️ **Mee-raiders (${raiders.length}):** ${raiderLines || '—'}`,
        ...(plan.notes ? [`📋 ${plan.notes}`] : []),
      ].join('\n'),
    });

    // Message 2: bench (only if any)
    if (bench.length > 0) {
      const benchLines = bench.map((p) => `${p.characterName} (${p.wowClass})`).join(', ');
      messages.push({
        content: `🪑 **Bank (${bench.length}):** ${benchLines}`,
      });
    }

    // Message 3: absent (only if any)
    if (absent.length > 0) {
      const absentLines = absent.map((p) => `${p.characterName} (${p.wowClass})`).join(', ');
      messages.push({
        content: `❌ **Afgemeld (${absent.length}):** ${absentLines}`,
      });
    }

    for (const message of messages) {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(`Discord webhook failed: ${response.status} ${text}`);
        throw new Error(`Discord webhook returned ${response.status}`);
      }

      // Discord rate-limit: wait 500ms between messages
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}
