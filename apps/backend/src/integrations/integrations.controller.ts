import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  Redirect,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { IntegrationsService } from './integrations.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';

type AuthRequest = Request & {
  user: { id: string; email: string; role: string; name: string };
};

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.findAll(user.id);
  }

  @Post('slack/install')
  async getSlackInstallUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.getSlackInstallUrl(user.id);
  }

  @Get('slack/callback')
  @Redirect()
  async slackCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: AuthRequest,
  ) {
    if (!code) {
      return { url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?integration=slack&error=no_code` };
    }
    try {
      const result = await this.integrationsService.handleSlackCallback(code, state, state);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return { url: `${frontendUrl}/settings?integration=slack&status=connected&team=${encodeURIComponent(result.teamName || '')}` };
    } catch {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return { url: `${frontendUrl}/settings?integration=slack&error=callback_failed` };
    }
  }

  @Post('discord/install')
  async getDiscordInstallUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.getDiscordInstallUrl(user.id);
  }

  @Get('discord/callback')
  @Redirect()
  async discordCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    if (!code) {
      return { url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?integration=discord&error=no_code` };
    }
    try {
      const result = await this.integrationsService.handleDiscordCallback(code, state, state);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return { url: `${frontendUrl}/settings?integration=discord&status=connected&team=${encodeURIComponent(result.teamName || '')}` };
    } catch {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return { url: `${frontendUrl}/settings?integration=discord&error=callback_failed` };
    }
  }

  @Post('webhook')
  async createWebhook(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.integrationsService.createWebhook(user.id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateIntegrationDto,
  ) {
    return this.integrationsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.integrationsService.remove(user.id, id);
  }

  @Post(':id/test')
  async sendTest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.integrationsService.sendTest(user.id, id);
  }

  @Get(':id/channels')
  async listChannels(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.integrationsService.getSlackChannels(user.id, id);
  }
}
