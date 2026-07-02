import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BrandingService } from './branding.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Branding')
@Controller('branding')
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getBranding(@CurrentUser() user: AuthenticatedUser) {
    return this.brandingService.getBranding(user.id);
  }

  @Get('by-slug/:slug')
  async getBrandingBySlug(@Param('slug') slug: string) {
    return this.brandingService.getBrandingBySlug(slug);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async updateBranding(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBrandingDto,
  ) {
    return this.brandingService.updateBranding(user.id, dto);
  }
}
