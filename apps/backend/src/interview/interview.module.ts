import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { RecurringService } from './recurring.service';
import { TestRunnerService } from './test-runner.service';
import { InterviewController } from './interview.controller';
import { SharedReviewController } from './shared-review.controller';
import { PrismaService } from '../prisma.service';
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  imports: [AiModule, AuthModule, MailModule, CalendarModule],
  controllers: [InterviewController, SharedReviewController],
  providers: [
    InterviewService,
    RecurringService,
    TestRunnerService,
    PrismaService,
    OwnershipGuard,
  ],
  exports: [InterviewService, RecurringService],
})
export class InterviewModule {}
