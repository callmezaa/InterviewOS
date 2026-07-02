import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { SlackService } from './providers/slack.service';
import { DiscordService } from './providers/discord.service';
import { WebhookService } from './providers/webhook.service';
import type { CreateWebhookDto } from './dto/create-webhook.dto';
import type { UpdateIntegrationDto } from './dto/update-integration.dto';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly slackService: SlackService,
    private readonly discordService: DiscordService,
    private readonly webhookService: WebhookService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.integration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        webhookUrl: true,
        channelId: true,
        channelName: true,
        teamId: true,
        teamName: true,
        botUserId: true,
        enabled: true,
        notificationTypes: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getSlackInstallUrl(userId: string) {
    const clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Slack integration is not configured. Set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET.');
    }

    const backendUrl = this.configService.get<string>('BACKEND_URL', 'http://localhost:3001');
    const redirectUri = `${backendUrl}/api/integrations/slack/callback`;

    return {
      url: this.slackService.getOAuthUrl(redirectUri, userId),
      redirectUri,
    };
  }

  async handleSlackCallback(code: string, state: string, userId: string) {
    const backendUrl = this.configService.get<string>('BACKEND_URL', 'http://localhost:3001');
    const redirectUri = `${backendUrl}/api/integrations/slack/callback`;

    const result = await this.slackService.exchangeCode(code, redirectUri);

    const existing = await this.prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'SLACK' } },
    });

    if (existing) {
      await this.slackService.revokeToken(existing.accessToken || '');
      await this.prisma.integration.delete({ where: { id: existing.id } });
    }

    await this.prisma.integration.create({
      data: {
        userId,
        provider: 'SLACK',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        webhookUrl: result.webhookUrl,
        channelId: result.channelId,
        channelName: result.channelName,
        teamId: result.teamId,
        teamName: result.teamName,
        botUserId: result.botUserId,
        scope: result.scope,
        enabled: true,
        notificationTypes: ['interview_scheduled', 'feedback_ready'],
        metadata: { authedUserId: result.authedUserId },
      },
    });

    this.logger.log(`User ${userId} connected Slack workspace: ${result.teamName || result.teamId}`);
    return { teamName: result.teamName, channelName: result.channelName };
  }

  async getDiscordInstallUrl(userId: string) {
    const clientId = this.configService.get<string>('DISCORD_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Discord integration is not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.');
    }

    const backendUrl = this.configService.get<string>('BACKEND_URL', 'http://localhost:3001');
    const redirectUri = `${backendUrl}/api/integrations/discord/callback`;

    return {
      url: this.discordService.getOAuthUrl(redirectUri, userId),
      redirectUri,
    };
  }

  async handleDiscordCallback(code: string, state: string, userId: string) {
    const backendUrl = this.configService.get<string>('BACKEND_URL', 'http://localhost:3001');
    const redirectUri = `${backendUrl}/api/integrations/discord/callback`;

    const result = await this.discordService.exchangeCode(code, redirectUri);

    const existing = await this.prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'DISCORD' } },
    });

    if (existing) {
      await this.prisma.integration.delete({ where: { id: existing.id } });
    }

    await this.prisma.integration.create({
      data: {
        userId,
        provider: 'DISCORD',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        teamId: result.teamId,
        teamName: result.teamName,
        scope: result.scope,
        enabled: true,
        notificationTypes: ['interview_scheduled', 'feedback_ready'],
      },
    });

    this.logger.log(`User ${userId} connected Discord: ${result.teamName || result.teamId}`);
    return { teamName: result.teamName };
  }

  async createWebhook(userId: string, dto: CreateWebhookDto) {
    const existing = await this.prisma.integration.findFirst({
      where: {
        userId,
        provider: 'WEBHOOK',
        webhookUrl: dto.callbackUrl,
      },
    });

    if (existing) {
      throw new ConflictException('A webhook with this URL is already connected');
    }

    const metadata: Record<string, unknown> = {};
    if (dto.name) metadata.name = dto.name;

    const integration = await this.prisma.integration.create({
      data: {
        userId,
        provider: 'WEBHOOK',
        webhookUrl: dto.callbackUrl,
        enabled: true,
        notificationTypes: ['interview_scheduled', 'feedback_ready'],
        metadata: (dto.secret ? { ...metadata, hasSecret: true } : metadata) as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        provider: true,
        webhookUrl: true,
        enabled: true,
        notificationTypes: true,
        metadata: true,
        createdAt: true,
      },
    });

    return integration;
  }

  async update(userId: string, integrationId: string, dto: UpdateIntegrationDto) {
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    const data: Record<string, unknown> = {};
    if (dto.enabled !== undefined) data.enabled = dto.enabled;
    if (dto.notificationTypes !== undefined) data.notificationTypes = dto.notificationTypes;
    if (dto.channelId !== undefined) data.channelId = dto.channelId;
    if (dto.channelName !== undefined) data.channelName = dto.channelName;
    if (dto.webhookUrl !== undefined && integration.provider === 'WEBHOOK') {
      data.webhookUrl = dto.webhookUrl;
    }

    if (dto.name || dto.webhookUrl) {
      const existingMeta = (integration.metadata as Record<string, unknown>) || {};
      data.metadata = {
        ...existingMeta,
        ...(dto.name ? { name: dto.name } : {}),
      };
    }

    return this.prisma.integration.update({
      where: { id: integrationId },
      data: data as any,
      select: {
        id: true,
        provider: true,
        webhookUrl: true,
        channelId: true,
        channelName: true,
        teamName: true,
        enabled: true,
        notificationTypes: true,
        metadata: true,
        updatedAt: true,
      },
    });
  }

  async remove(userId: string, integrationId: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    if (integration.provider === 'SLACK' && integration.accessToken) {
      await this.slackService.revokeToken(integration.accessToken).catch(() => {});
    }

    await this.prisma.integration.delete({ where: { id: integrationId } });
    this.logger.log(`User ${userId} disconnected ${integration.provider} integration`);
  }

  async sendTest(userId: string, integrationId: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    if (!integration.enabled) {
      throw new BadRequestException('Integration is disabled. Enable it first.');
    }

    switch (integration.provider) {
      case 'SLACK': {
        if (!integration.accessToken) throw new BadRequestException('Slack not authenticated');
        const channelId = integration.channelId;
        if (!channelId) throw new BadRequestException('No channel configured');
        await this.slackService.sendMessage(
          integration.accessToken,
          channelId,
          '✅ Test notification from InterviewOS — your Slack integration is working!',
          [
            {
              type: 'section',
              text: { type: 'mrkdwn', text: '*✅ InterviewOS — Test Notification*' },
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: 'Your Slack integration is working correctly. You will now receive interview notifications here.' },
            },
            {
              type: 'context',
              elements: [{ type: 'mrkdwn', text: `Sent at ${new Date().toLocaleString()}` }],
            },
          ],
        );
        break;
      }
      case 'DISCORD': {
        if (!integration.webhookUrl) throw new BadRequestException('Discord webhook URL not available');
        await this.discordService.sendWebhookMessage(
          integration.webhookUrl,
          '✅ **InterviewOS — Test Notification**\nYour Discord integration is working correctly. You will now receive interview notifications here.',
        );
        break;
      }
      case 'WEBHOOK': {
        if (!integration.webhookUrl) throw new BadRequestException('Webhook URL not configured');
        const meta = (integration.metadata as Record<string, unknown>) || {};
        await this.webhookService.send(
          integration.webhookUrl,
          {
            event: 'test',
            timestamp: new Date().toISOString(),
            message: 'Test notification from InterviewOS — your webhook integration is working!',
            data: { integrationId: integration.id },
          },
          (meta.secret as string) || undefined,
        );
        break;
      }
      default:
        throw new BadRequestException('Unknown integration provider');
    }

    return { message: 'Test notification sent successfully' };
  }

  async getSlackChannels(userId: string, integrationId: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, userId, provider: 'SLACK' },
    });

    if (!integration) throw new NotFoundException('Slack integration not found');
    if (!integration.accessToken) throw new BadRequestException('Slack token missing');

    return this.slackService.listChannels(integration.accessToken);
  }
}
