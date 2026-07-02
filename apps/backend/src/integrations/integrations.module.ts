import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { SlackService } from './providers/slack.service';
import { DiscordService } from './providers/discord.service';
import { WebhookService } from './providers/webhook.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    SlackService,
    DiscordService,
    WebhookService,
    PrismaService,
  ],
  exports: [IntegrationsService, WebhookService],
})
export class IntegrationsModule {}
