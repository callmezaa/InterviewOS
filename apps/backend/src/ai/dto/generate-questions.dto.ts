import { IsString, IsOptional, IsIn, IsArray, MaxLength, ArrayMaxSize } from 'class-validator';

export class GenerateQuestionsDto {
  @IsString()
  @MaxLength(50)
  jobRole: string;

  @IsString()
  @MaxLength(50)
  experienceLevel: string;

  @IsOptional()
  @IsString()
  @IsIn(['javascript', 'typescript', 'python', 'go', 'rust', 'cpp'])
  language?: string;

  @IsOptional()
  @IsString()
  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  topic?: string;

  @IsOptional()
  @IsString()
  @IsIn(['1', '3'])
  count?: string;
}
