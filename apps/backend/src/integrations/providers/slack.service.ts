import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  constructor(private readonly configService: ConfigService) {}

  getOAuthUrl(redirectUri: string, state: string): string {
    const clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    if (!clientId) throw new Error('Slack client ID not configured');

    const scopes = [
      'incoming-webhook',
      'chat:write',
      'channels:read',
      'groups:read',
      'users:read',
    ].join(',');

    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state,
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string) {
    const clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SLACK_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Slack OAuth credentials not configured');
    }

    const res = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!data.ok) {
      this.logger.error(`Slack OAuth error: ${String(data.error || 'unknown')}`);
      throw new Error(`Slack OAuth failed: ${String(data.error || 'unknown')}`);
    }

    const authedUser = data.authed_user as Record<string, unknown> | undefined;
    const incomingWebhook = data.incoming_webhook as Record<string, unknown> | undefined;

    return {
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string) || null,
      webhookUrl: (incomingWebhook?.url as string) || null,
      channelId: (incomingWebhook?.channel_id as string) || (data.incoming_webhook as Record<string, unknown> | undefined)?.channel_id as string || null,
      channelName: (incomingWebhook?.channel as string) || null,
      teamId: ((data.team as Record<string, unknown> | undefined)?.id as string) || null,
      teamName: ((data.team as Record<string, unknown> | undefined)?.name as string) || null,
      botUserId: (data.bot_user_id as string) || null,
      scope: data.scope as string || null,
      authedUserId: (authedUser?.id as string) || null,
    };
  }

  async revokeToken(accessToken: string): Promise<void> {
    try {
      const res = await fetch('https://slack.com/api/auth.revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const data = await res.json() as Record<string, unknown>;
      if (!data.ok) {
        this.logger.warn(`Slack token revocation warning: ${String(data.error || 'unknown')}`);
      }
    } catch (err) {
      this.logger.warn(`Slack token revocation failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  async sendMessage(accessToken: string, channelId: string, text: string, blocks?: unknown[]): Promise<void> {
    const body: Record<string, unknown> = {
      channel: channelId,
      text,
    };
    if (blocks) body.blocks = blocks;

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as Record<string, unknown>;
    if (!data.ok) {
      throw new Error(`Slack message failed: ${String(data.error || 'unknown')}`);
    }
  }

  async listChannels(accessToken: string): Promise<{ id: string; name: string }[]> {
    const res = await fetch('https://slack.com/api/conversations.list', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const data = await res.json() as Record<string, unknown>;

    if (!data.ok) {
      const channels: { id: string; name: string }[] = [];
      return channels;
    }

    return ((data.channels as Record<string, unknown>[]) || []).map((ch) => ({
      id: ch.id as string,
      name: ch.name as string,
    }));
  }
}
