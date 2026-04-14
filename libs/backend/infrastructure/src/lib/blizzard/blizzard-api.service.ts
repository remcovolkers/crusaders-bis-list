import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  IBlizzardApiService,
  BlizzardJournalInstance,
  BlizzardJournalEncounter,
  BlizzardItem,
} from '@crusaders-bis-list/backend-domain';

interface BlizzardToken {
  access_token: string;
  expiresAt: number;
}

@Injectable()
export class BlizzardApiService implements IBlizzardApiService {
  private readonly logger = new Logger(BlizzardApiService.name);
  private token: BlizzardToken | null = null;
  private readonly client: AxiosInstance;
  private readonly region: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly config: ConfigService) {
    this.region = config.get<string>('BLIZZARD_REGION', 'eu');
    this.clientId = config.get<string>('BLIZZARD_CLIENT_ID', '');
    this.clientSecret = config.get<string>('BLIZZARD_CLIENT_SECRET', '');
    this.client = axios.create({
      baseURL: `https://${this.region}.api.blizzard.com`,
      timeout: 10000,
    });
  }

  get isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  private async getAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) {
      return this.token.access_token;
    }

    const response = await axios.post<{ access_token: string; expires_in: number }>(
      'https://oauth.battle.net/token',
      new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
      {
        auth: { username: this.clientId, password: this.clientSecret },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    this.token = {
      access_token: response.data.access_token,
      expiresAt: Date.now() + (response.data.expires_in - 60) * 1000,
    };

    return this.token.access_token;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
    let lastError!: Error;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        const isRetryable = status === 429 || (status !== undefined && status >= 500);
        if (!isRetryable || attempt === maxAttempts) throw err;

        let delay: number;
        if (status === 429) {
          const retryAfter = axios.isAxiosError(err) ? Number(err.response?.headers['retry-after']) : NaN;
          delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 10_000;
        } else {
          delay = 1_000 * 2 ** (attempt - 1); // 1 s, 2 s, …
        }
        this.logger.warn(`Attempt ${attempt}/${maxAttempts} failed (HTTP ${status}), retrying in ${delay}ms…`);
        await this.sleep(delay);
      }
    }
    throw lastError;
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    return this.withRetry(async () => {
      const token = await this.getAccessToken();
      const namespace = `static-${this.region}`;
      const response = await this.client.get<T>(path, {
        headers: { Authorization: `Bearer ${token}` },
        params: { namespace, locale: 'en_US', ...params },
      });
      return response.data;
    });
  }

  async getJournalInstance(id: number): Promise<BlizzardJournalInstance> {
    try {
      return await this.get<BlizzardJournalInstance>(`/data/wow/journal-instance/${id}`);
    } catch (err) {
      this.logger.warn(
        `static namespace failed for instance ${id} (${(err as Error).message}), retrying with static-preview…`,
      );
      return this.get<BlizzardJournalInstance>(`/data/wow/journal-instance/${id}`, {
        namespace: `static-preview-${this.region}`,
      });
    }
  }

  async getJournalEncounter(id: number): Promise<BlizzardJournalEncounter> {
    return this.get<BlizzardJournalEncounter>(`/data/wow/journal-encounter/${id}`);
  }

  async getItem(id: number): Promise<BlizzardItem> {
    return this.get<BlizzardItem>(`/data/wow/item/${id}`);
  }

  async getItemMediaUrl(id: number): Promise<string | undefined> {
    try {
      const media = await this.get<{ assets: { key: string; value: string }[] }>(`/data/wow/media/item/${id}`);
      return media.assets.find((a) => a.key === 'icon')?.value;
    } catch {
      return undefined;
    }
  }
}
