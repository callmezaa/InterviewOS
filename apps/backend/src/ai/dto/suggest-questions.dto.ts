import { IsArray, IsString, MaxLength, IsOptional } from 'class-validator';

export class SuggestQuestionsDto {
  @IsArray()
  @IsOptional()
  transcript?: { speakerName: string; text: string }[];

  @IsString()
  @MaxLength(50000)
  code: string;

  @IsString()
  @MaxLength(50)
  language: string;
}
