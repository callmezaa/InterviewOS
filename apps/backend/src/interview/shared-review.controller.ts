import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InterviewService } from './interview.service';

@ApiTags('Shared Reviews')
@Controller('shared/review')
export class SharedReviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Get(':id/:token')
  async getSharedReview(
    @Param('id') id: string,
    @Param('token') token: string,
  ) {
    return this.interviewService.findByShareToken(id, token);
  }
}
