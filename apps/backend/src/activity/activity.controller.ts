import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivityService, type ActivityType } from './activity.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Activity')
@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @SkipThrottle()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: ActivityType,
    @Query('before') before?: string,
  ) {
    return this.activityService.findAll(user.id, {
      page: page ? Math.max(1, page) : undefined,
      limit: limit ? Math.min(50, Math.max(1, limit)) : undefined,
      type,
      before,
    });
  }
}
