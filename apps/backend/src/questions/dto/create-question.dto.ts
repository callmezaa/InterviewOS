import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  MinLength,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  starterCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  solutionCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  testCode?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsEnum(['EASY', 'MEDIUM', 'HARD'])
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  conceptQuestions?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  systemDesign?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  hints?: string[];
}
