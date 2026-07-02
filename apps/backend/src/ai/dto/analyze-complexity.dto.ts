import { IsString, MaxLength } from 'class-validator';

export class AnalyzeComplexityDto {
  @IsString()
  @MaxLength(50000)
  code: string;

  @IsString()
  @MaxLength(50)
  language: string;
}
