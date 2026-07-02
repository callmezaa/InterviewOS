import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsArray, IsString, IsIn } from 'class-validator';

const VALID_EVENTS = [
  'interview_scheduled',
  'interview_cancelled',
  'interview_rescheduled',
  'feedback_ready',
  'interview_reminder',
] as const;

export class UpdateIntegrationDto {
  @ApiPropertyOptional({ description: 'Enable or disable this integration' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Notification types to forward', isArray: true, example: ['feedback_ready', 'interview_scheduled'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(VALID_EVENTS, { each: true, message: 'Each event must be one of: ' + VALID_EVENTS.join(', ') })
  notificationTypes?: string[];

  @ApiPropertyOptional({ description: 'Channel ID for Slack/Discord' })
  @IsOptional()
  @IsString()
  channelId?: string;

  @ApiPropertyOptional({ description: 'Channel name for display' })
  @IsOptional()
  @IsString()
  channelName?: string;

  @ApiPropertyOptional({ description: 'Webhook URL (for updating webhook integrations)' })
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Friendly name' })
  @IsOptional()
  @IsString()
  name?: string;
}
