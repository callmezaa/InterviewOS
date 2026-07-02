import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { InterviewService } from './interview.service';
import { RecurringService } from './recurring.service';
import { TestRunnerService } from './test-runner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { Ownership } from '../common/decorators/ownership.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RescheduleDto } from './dto/reschedule.dto';
import { RunCodeDto } from './dto/run-code.dto';
import { RunTestsDto } from './dto/run-tests.dto';
import { COMPILER_MAP } from '@interviewos/shared';

interface WandboxResponse {
  program_output?: string;
  program_message?: string;
  program_error?: string;
  compiler_error?: string;
  status?: string;
}

@ApiTags('Interviews')
@Controller('interviews')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class InterviewController {
  constructor(
    private readonly interviewService: InterviewService,
    private readonly recurringService: RecurringService,
    private readonly testRunnerService: TestRunnerService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.interviewService.create(
      dto.title,
      dto.description ?? '',
      new Date(dto.scheduledTime),
      user.id,
      dto.candidateEmail,
      dto.templateId,
      dto.recurrence,
    );
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.interviewService.findUserInterviews(user.id);
  }

  @Get(':id')
  @UseGuards(OwnershipGuard)
  @Ownership('interview')
  async findOne(@Param('id') id: string) {
    return this.interviewService.findOne(id);
  }

  @Post(':id/share')
  @UseGuards(OwnershipGuard)
  @Ownership('interview')
  async generateShareToken(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const token = await this.interviewService.generateShareToken(id, user.id);
    return { shareToken: token };
  }

  @Delete(':id/share')
  @UseGuards(OwnershipGuard)
  @Ownership('interview')
  async revokeShareToken(@Param('id') id: string) {
    await this.interviewService.revokeShareToken(id);
    return { shareToken: null };
  }

  @Put(':id/status')
  @UseGuards(OwnershipGuard)
  @Ownership('interview')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.interviewService.updateStatus(id, dto.status);
  }

  @Patch(':id/reschedule')
  @UseGuards(OwnershipGuard)
  @Ownership('interview')
  async reschedule(@Param('id') id: string, @Body() dto: RescheduleDto) {
    return this.interviewService.reschedule(id, new Date(dto.scheduledTime));
  }

  @Delete(':id')
  @UseGuards(OwnershipGuard)
  @Ownership('interview')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const interview = await this.interviewService.findOne(id);
    const isOwner = interview.participants.some(
      (p) => p.userId === user.id && p.role === 'INTERVIEWER',
    );
    if (!isOwner) {
      throw new ForbiddenException(
        'Only the interviewer who scheduled can delete.',
      );
    }
    return this.interviewService.remove(id);
  }

  @Get('series/:patternId')
  async getSeries(@Param('patternId') patternId: string) {
    return this.recurringService.getSeries(patternId);
  }

  @Get(':id/recurrence')
  async getRecurrence(@Param('id') id: string) {
    return this.recurringService.getPatternForInterview(id);
  }

  @Delete('series/:patternId')
  async cancelSeries(
    @CurrentUser() user: AuthenticatedUser,
    @Param('patternId') patternId: string,
  ) {
    await this.recurringService.deactivatePattern(patternId);
    return { message: 'Recurring series cancelled. Future instances will not be created.' };
  }

  @Post(':id/evaluate')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(OwnershipGuard)
  @Ownership('interview')
  async evaluate(@Param('id') id: string) {
    return this.interviewService.generateMockFeedback(id);
  }

  @Post('run-code')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async runCode(@Body() dto: RunCodeDto) {
    const { codeContent, language } = dto;

    const compiler = COMPILER_MAP[language.toLowerCase()] ?? 'nodejs-head';

    try {
      const res = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiler,
          code: codeContent,
          stdin: '',
          'compiler-option-raw': '',
          'runtime-option-raw': '',
        }),
      });

      if (!res.ok) {
        return { error: `Compiler service unavailable (HTTP ${res.status}).` };
      }

      const data: WandboxResponse = (await res.json()) as WandboxResponse;
      return {
        stdout: data.program_output || data.program_message || '',
        stderr: data.program_error || data.compiler_error || '',
        code: parseInt(data.status ?? '0', 10),
      };
    } catch (err: unknown) {
      return {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to execute code in sandbox.',
      };
    }
  }

  @Post('run-tests')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async runTests(@Body() dto: RunTestsDto) {
    return this.testRunnerService.run(
      dto.codeContent,
      dto.testCode,
      dto.language,
    );
  }
}
