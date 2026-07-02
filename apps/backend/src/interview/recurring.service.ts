import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { Role, RecurrenceFrequency } from '@prisma/client';
import type { CreateRecurrenceDto } from './dto/create-recurrence.dto';

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createPattern(
    interviewId: string,
    userId: string,
    dto: CreateRecurrenceDto,
    scheduledTime: Date,
  ): Promise<void> {
    const hours = scheduledTime.getHours().toString().padStart(2, '0');
    const minutes = scheduledTime.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;

    const nextDate = this.calculateNextDate(scheduledTime, dto);

    await this.prisma.recurringPattern.create({
      data: {
        frequency: dto.frequency,
        dayOfWeek: dto.dayOfWeek ?? scheduledTime.getDay(),
        dayOfMonth: dto.dayOfMonth ?? scheduledTime.getDate(),
        time,
        startDate: scheduledTime,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        maxOccurrences: dto.occurrences ?? null,
        nextOccurrence: nextDate,
        instanceCount: 1,
        userId,
        interviews: { connect: { id: interviewId } },
      },
    });
  }

  calculateNextDate(from: Date, recurrence: CreateRecurrenceDto): Date {
    const next = new Date(from);
    switch (recurrence.frequency) {
      case RecurrenceFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case RecurrenceFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurrenceFrequency.BIWEEKLY:
        next.setDate(next.getDate() + 14);
        break;
      case RecurrenceFrequency.MONTHLY: {
        const targetDay = recurrence.dayOfMonth ?? from.getDate();
        next.setMonth(next.getMonth() + 1);
        const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(targetDay, lastDay));
        break;
      }
    }
    return next;
  }

  async generateNextInstance(patternId: string) {
    const pattern = await this.prisma.recurringPattern.findUnique({
      where: { id: patternId },
      include: {
        interviews: {
          orderBy: { scheduledTime: 'asc' },
          take: 1,
        },
      },
    });

    if (!pattern || !pattern.isActive) return null;

    if (pattern.endDate && pattern.nextOccurrence > pattern.endDate) {
      await this.prisma.recurringPattern.update({
        where: { id: patternId }, data: { isActive: false },
      });
      return null;
    }

    if (pattern.maxOccurrences && pattern.instanceCount >= pattern.maxOccurrences) {
      await this.prisma.recurringPattern.update({
        where: { id: patternId }, data: { isActive: false },
      });
      return null;
    }

    const firstInterview = pattern.interviews[0];
    if (!firstInterview) return null;

    const candidateParticipant = await this.prisma.participant.findFirst({
      where: { interviewId: firstInterview.id, role: Role.CANDIDATE },
      include: { user: true },
    });
    if (!candidateParticipant) return null;

    const interviewerParticipant = await this.prisma.participant.findFirst({
      where: { interviewId: firstInterview.id, role: Role.INTERVIEWER },
    });
    if (!interviewerParticipant) return null;

    const newInstanceNumber = pattern.instanceCount + 1;
    const scheduledTime = new Date(pattern.nextOccurrence);
    const [hours, minutes] = pattern.time.split(':').map(Number);
    scheduledTime.setHours(hours, minutes, 0, 0);

    const interview = await this.prisma.interview.create({
      data: {
        title: firstInterview.title,
        description: firstInterview.description,
        scheduledTime,
        status: 'SCHEDULED',
        language: firstInterview.language,
        codeContent: firstInterview.codeContent,
        questionId: firstInterview.questionId,
        recurringPatternId: patternId,
        instanceNumber: newInstanceNumber,
        participants: {
          create: [
            { userId: interviewerParticipant.userId, role: Role.INTERVIEWER },
            { userId: candidateParticipant.userId, role: Role.CANDIDATE },
          ],
        },
      },
      include: {
        participants: { include: { user: true } },
      },
    });

    const candidateToken = this.jwtService.sign(
      { sub: candidateParticipant.user.id, email: candidateParticipant.user.email, role: Role.CANDIDATE, name: candidateParticipant.user.name },
      { expiresIn: '7d' },
    );

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const joinUrl = `${frontendUrl}/interview/${interview.id}?token=${candidateToken}`;

    try {
      await this.mailService.sendInterviewInvitation(
        candidateParticipant.user.email,
        candidateParticipant.user.name,
        interview.title,
        interview.scheduledTime,
        joinUrl,
      );
    } catch (err) {
      this.logger.warn(`Failed to send recurrence email: ${err instanceof Error ? err.message : err}`);
    }

    const nextDate = this.calculateNextDateFromPattern(pattern, scheduledTime);
    await this.prisma.recurringPattern.update({
      where: { id: patternId },
      data: { instanceCount: newInstanceNumber, nextOccurrence: nextDate },
    });

    return interview;
  }

  private calculateNextDateFromPattern(pattern: {
    frequency: RecurrenceFrequency;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
  }, from: Date): Date {
    const next = new Date(from);
    switch (pattern.frequency) {
      case RecurrenceFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case RecurrenceFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurrenceFrequency.BIWEEKLY:
        next.setDate(next.getDate() + 14);
        break;
      case RecurrenceFrequency.MONTHLY: {
        const targetDay = pattern.dayOfMonth ?? from.getDate();
        next.setMonth(next.getMonth() + 1);
        const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(targetDay, lastDay));
        break;
      }
    }
    return next;
  }

  async deactivatePattern(patternId: string): Promise<void> {
    const pattern = await this.prisma.recurringPattern.findUnique({ where: { id: patternId } });
    if (!pattern) throw new NotFoundException('Recurring pattern not found');
    await this.prisma.recurringPattern.update({
      where: { id: patternId },
      data: { isActive: false },
    });
  }

  async getSeries(patternId: string) {
    return this.prisma.interview.findMany({
      where: { recurringPatternId: patternId },
      orderBy: { scheduledTime: 'asc' },
      include: {
        participants: {
          include: { user: { select: { id: true, email: true, name: true, role: true } } },
        },
      },
    });
  }

  async getPatternForInterview(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      select: { recurringPatternId: true },
    });
    if (!interview?.recurringPatternId) return null;
    return this.prisma.recurringPattern.findUnique({
      where: { id: interview.recurringPatternId },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoGenerateOccurrences() {
    const now = new Date();
    const patterns = await this.prisma.recurringPattern.findMany({
      where: {
        isActive: true,
        nextOccurrence: { lte: now },
      },
    });

    for (const pattern of patterns) {
      try {
        await this.generateNextInstance(pattern.id);
        this.logger.log(`Auto-generated next instance for pattern ${pattern.id}`);
      } catch (err) {
        this.logger.error(
          `Failed to auto-generate instance for pattern ${pattern.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}
