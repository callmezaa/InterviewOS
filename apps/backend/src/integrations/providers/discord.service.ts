import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(private readonly configService: ConfigService) {}

  getOAuthUrl(redirectUri: string, state: string): string {
    const clientId = this.configService.get<string>('DISCORD_CLIENT_ID');
    if (!clientId) throw new Error('Discord client ID not configured');

    const scopes = ['webhook', 'bot'].join(' ');
    const botPermissions = '536870912'; // Send Messages + Read Message History

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state,
      permissions: botPermissions,
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string) {
    const clientId = this.configService.get<string>('DISCORD_CLIENT_ID');
    const clientSecret = this.configService.get<string>('DISCORD_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Discord OAuth credentials not configured');
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const res = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      this.logger.error(`Discord OAuth error: ${JSON.stringify(data)}`);
      throw new Error(`Discord OAuth failed: ${String(data.error_description || data.error || 'unknown')}`);
    }

    const guild = data.guild as Record<string, unknown> | undefined;

    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string,
      webhookUrl: null as string | null,
      channelId: null as string | null,
      channelName: null as string | null,
      teamId: guild?.id as string || null,
      teamName: guild?.name as string || null,
      botUserId: null as string | null,
      scope: (data.scope as string) || null,
      authedUserId: null as string | null,
    };
  }

  async sendWebhookMessage(webhookUrl: string, content: string): Promise<void> {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!res.ok && res.status !== 204) {
      const text = await res.text().catch(() => '');
      throw new Error(`Discord webhook failed (${res.status}): ${text}`);
    }
  }
}
