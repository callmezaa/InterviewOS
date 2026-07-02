import { IsString, MinLength, MaxLength } from 'class-validator';

export class RunCodeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  codeContent: string;

  @IsString()
  @MaxLength(50)
  language: string;
}
