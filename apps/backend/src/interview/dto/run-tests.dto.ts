import { IsString, MinLength, MaxLength } from 'class-validator';

export class RunTestsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  codeContent: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  testCode: string;

  @IsString()
  @MaxLength(50)
  language: string;
}
