import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRecurrenceDto } from './create-recurrence.dto';

export class CreateInterviewDto {
  @ApiProperty({
    example: 'System Design — Distributed Cache',
    description: 'Interview title',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'Evaluate caching strategies with Redis',
    description: 'Optional description / notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: '2026-06-20T14:00:00.000Z',
    description: 'ISO 8601 scheduled start time',
  })
  @IsString()
  scheduledTime: string;

  @ApiProperty({
    example: 'candidate@example.com',
    description: 'Candidate email for invitation',
  })
  @IsEmail()
  candidateEmail: string;

  @ApiPropertyOptional({
    example: 'template_abc123',
    description: 'Optional template ID to pre-fill content',
  })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Optional recurrence rule for recurring interviews',
    type: CreateRecurrenceDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRecurrenceDto)
  recurrence?: CreateRecurrenceDto;
}
