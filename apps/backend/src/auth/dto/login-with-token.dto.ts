import { IsString, MinLength } from 'class-validator';

export class LoginWithTokenDto {
  @IsString()
  @MinLength(1)
  token: string;
}
