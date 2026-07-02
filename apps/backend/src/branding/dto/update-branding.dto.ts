import {
  IsString,
  IsOptional,
  IsHexColor,
  MinLength,
  MaxLength,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class ThemeColorsDto {
  @IsOptional() @IsHexColor() primary?: string;
  @IsOptional() @IsHexColor() primaryHover?: string;
  @IsOptional() @IsHexColor() success?: string;
  @IsOptional() @IsHexColor() warning?: string;
  @IsOptional() @IsHexColor() danger?: string;
  @IsOptional() @IsHexColor() bgDark?: string;
  @IsOptional() @IsHexColor() textDark?: string;
  @IsOptional() @IsHexColor() bgLight?: string;
  @IsOptional() @IsHexColor() textLight?: string;
}

class ThemeConfigDto {
  @IsOptional() @IsString() presetId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeColorsDto)
  colors?: ThemeColorsDto;

  @IsOptional() @IsString() @MaxLength(100) fontDisplay?: string;
  @IsOptional() @IsString() @MaxLength(100) fontBody?: string;
  @IsOptional() @IsNumber() @Min(0.5) @Max(2) radiusScale?: number;
}

export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeConfigDto)
  theme?: ThemeConfigDto;
}
