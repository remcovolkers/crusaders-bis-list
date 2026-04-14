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

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const token = await this.getAccessToken();
    const namespace = `static-${this.region}`;
    const response = await this.client.get<T>(path, {
      headers: { Authorization: `Bearer ${token}` },
      params: { namespace, locale: 'en_US', ...params },
    });
    return response.data;
  }

  async getJournalInstance(id: number): Promise<BlizzardJournalInstance> {
    return this.get<BlizzardJournalInstance>(`/data/wow/journal-instance/${id}`);
  }

  async getJournalEncounter(id: number): Promise<BlizzardJournalEncounter> {
    return this.get<BlizzardJournalEncounter>(`/data/wow/journal-encounter/${id}`);
  }

  async getItem(id: number): Promise<BlizzardItem> {
    return this.get<BlizzardItem>(`/data/wow/item/${id}`);
  }

  async getItemMediaUrl(id: number): Promise<string | undefined> {
    try {
      const media = await this.get<{ assets: { key: string; value: string }[] }>(
        `/data/wow/media/item/${id}`,
      );
      return media.assets.find((a) => a.key === 'icon')?.value;
    } catch {
      return undefined;
    }
  }
}
