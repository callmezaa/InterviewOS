import { IsEnum } from 'class-validator';
import { InterviewStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(InterviewStatus)
  status: InterviewStatus;
}
