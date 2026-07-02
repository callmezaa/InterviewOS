import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { RecurrenceFrequency } from '@prisma/client';

export class CreateRecurrenceDto {
  @ApiPropertyOptional({ enum: RecurrenceFrequency, description: 'How often the interview repeats' })
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @ApiPropertyOptional({ example: 1, description: 'Day of week (0=Sun..6=Sat) for WEEKLY/BIWEEKLY' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ example: 15, description: 'Day of month (1-31) for MONTHLY' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiPropertyOptional({ example: '2027-06-15', description: 'Optional end date for the series' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 12, description: 'Maximum number of occurrences' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  occurrences?: number;
}
