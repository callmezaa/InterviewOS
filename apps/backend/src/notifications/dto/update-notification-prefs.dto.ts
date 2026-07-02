import { IsBoolean, IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateNotificationPrefsDto {
  @IsOptional() @IsBoolean() invitations?: boolean;
  @IsOptional() @IsBoolean() reminders?: boolean;
  @IsOptional() @IsBoolean() feedback?: boolean;
  @IsOptional() @IsBoolean() team?: boolean;
  @IsOptional() @IsBoolean() updates?: boolean;
  @IsOptional()
  @IsString()
  @IsIn(['immediate', 'daily', 'weekly'])
  digest?: string;
}
