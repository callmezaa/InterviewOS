import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, MaxLength } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://hooks.example.com/events', description: 'Webhook callback URL' })
  @IsUrl({ require_tld: false })
  callbackUrl: string;

  @ApiPropertyOptional({ example: 'My Webhook', description: 'Friendly name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Bearer sk-xxx', description: 'Optional auth header' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  secret?: string;
}
