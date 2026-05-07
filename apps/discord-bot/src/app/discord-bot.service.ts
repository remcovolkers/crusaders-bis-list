import { Injectable, OnApplicationBootstrap, OnApplicationShutdown, Logger } from '@nestjs/common';
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import { GetRaidPlansUseCase } from '@crusaders-bis-list/backend-application';
import {
  IRaidPlan,
  IRaidPlanParticipant,
  RaidParticipantRole,
  RaidDifficulty,
} from '@crusaders-bis-list/shared-domain';

const DIFFICULTY_COLOR: Record<RaidDifficulty, number> = {
  [RaidDifficulty.NORMAL]: Colors.Green,
  [RaidDifficulty.HEROIC]: Colors.Blue,
  [RaidDifficulty.MYTHIC]: Colors.Purple,
};

@Injectable()
export class DiscordBotService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(DiscordBotService.name);
  private readonly client: Client;

  constructor(private readonly getPlans: GetRaidPlansUseCase) {
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
  }

  async onApplicationBootstrap(): Promise<void> {
    const token = process.env['DISCORD_BOT_TOKEN'];
    const clientId = process.env['DISCORD_CLIENT_ID'];
    const guildId = process.env['DISCORD_GUILD_ID'];

    if (!token || !clientId || !guildId) {
      this.logger.warn('DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID or DISCORD_GUILD_ID not set — bot disabled.');
      return;
    }

    await this.registerCommands(token, clientId, guildId);

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      if (interaction.commandName === 'raidplan') {
        await this.handleRaidplan(interaction);
      }
    });

    await this.client.login(token);
    this.logger.log('Discord bot connected.');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.destroy();
  }

  private async registerCommands(token: string, clientId: string, guildId: string): Promise<void> {
    const commands = [
      new SlashCommandBuilder().setName('raidplan').setDescription('Bekijk het volgende aankomende raidplan').toJSON(),
    ];

    const rest = new REST().setToken(token);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    this.logger.log('Slash commands registered.');
  }

  private async handleRaidplan(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const plans = await this.getPlans.execute();
    const now = new Date();
    const upcoming = plans
      .filter((p) => new Date(p.scheduledAt) >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    if (upcoming.length === 0) {
      await interaction.editReply('Geen aankomende raidplannen gevonden. 😴');
      return;
    }

    const plan = upcoming[0];
    const embed = this.buildEmbed(plan);
    await interaction.editReply({ embeds: [embed] });
  }

  private buildEmbed(plan: IRaidPlan): EmbedBuilder {
    const raiders = plan.participants.filter((p) => p.role === RaidParticipantRole.RAIDER);
    const bench = plan.participants.filter((p) => p.role === RaidParticipantRole.BENCH);
    const absent = plan.participants.filter((p) => p.role === RaidParticipantRole.ABSENT);

    const formatter = new Intl.DateTimeFormat('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Amsterdam',
    });

    const formatList = (members: IRaidPlanParticipant[]) =>
      members.length > 0 ? members.map((p) => `• ${p.characterName}`).join('\n') : '*Niemand*';

    return new EmbedBuilder()
      .setTitle(`⚔️ ${plan.raidName} — ${plan.difficulty}`)
      .setColor(DIFFICULTY_COLOR[plan.difficulty] ?? Colors.Gold)
      .setDescription(plan.notes ?? null)
      .addFields(
        { name: `🗡️ Raiders (${raiders.length})`, value: formatList(raiders), inline: true },
        { name: `🪑 Bank (${bench.length})`, value: formatList(bench), inline: true },
        { name: `❌ Afgemeld (${absent.length})`, value: formatList(absent), inline: true },
      )
      .setFooter({ text: `📅 ${formatter.format(new Date(plan.scheduledAt))}` });
  }
}
