import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { InterviewStatus, Role, Prisma } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { MailService } from '../mail/mail.service';
import { CalendarService } from '../calendar/calendar.service';
import { JwtService } from '@nestjs/jwt';
import { RecurringService } from './recurring.service';
import { ActivityService } from '../activity/activity.service';
import * as bcrypt from 'bcrypt';
import type { CreateRecurrenceDto } from './dto/create-recurrence.dto';

type InterviewWithParticipants = Prisma.InterviewGetPayload<{
  include: {
    participants: {
      include: {
        user: {
          select: { id: true; email: true; name: true; role: true };
        };
      };
    };
  };
}>;

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly mailService: MailService,
    private readonly calendarService: CalendarService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly recurringService: RecurringService,
    private readonly activityService: ActivityService,
  ) {}

  private mapInterviewResponse(interview: InterviewWithParticipants | null) {
    if (!interview) return null;
    const candidateParticipant = interview.participants?.find(
      (p) => p.role === Role.CANDIDATE,
    );
    const candidateUser = candidateParticipant?.user;

    let candidateToken = null;
    if (candidateUser) {
      const payload = {
        sub: candidateUser.id,
        email: candidateUser.email,
        role: Role.CANDIDATE,
        name: candidateUser.name,
      };
      candidateToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    }

    return {
      ...interview,
      candidateEmail: candidateUser?.email || null,
      candidateToken,
    };
  }

  async create(
    title: string,
    description: string,
    scheduledTime: Date,
    interviewerId: string,
    candidateEmail: string,
    templateId?: string,
    recurrence?: CreateRecurrenceDto,
  ) {
    const interviewer = await this.prisma.user.findUnique({
      where: { id: interviewerId },
    });
    if (!interviewer) {
      throw new NotFoundException('Interviewer not found');
    }

    let candidate = await this.prisma.user.findUnique({
      where: { email: candidateEmail },
    });
    if (!candidate) {
      const tempPassword = `OS-${Math.random().toString(36).substring(2, 10).toUpperCase()}!`;
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      candidate = await this.prisma.user.create({
        data: {
          email: candidateEmail,
          name: candidateEmail.split('@')[0],
          passwordHash,
          role: Role.CANDIDATE,
        },
      });
    }

    let templateData: {
      title?: string;
      description?: string;
      language?: string;
      starterCode?: string;
      questionId?: string | null;
    } = {};

    if (templateId) {
      const template = await this.prisma.interviewTemplate.findUnique({
        where: { id: templateId },
      });
      if (template) {
        templateData = {
          title: template.title,
          description: template.description ?? undefined,
          language: template.language,
          starterCode: template.starterCode ?? undefined,
          questionId: template.questionId,
        };
        await this.prisma.interviewTemplate.update({
          where: { id: templateId },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    const effectiveTitle = templateData.title ?? title;
    const effectiveDescription = templateData.description ?? description;

    const interview = await this.prisma.interview.create({
      data: {
        title: effectiveTitle,
        description: effectiveDescription,
        scheduledTime,
        status: InterviewStatus.SCHEDULED,
        language: templateData.language ?? 'javascript',
        codeContent:
          templateData.starterCode ?? '// Write your collaborative code here\n',
        questionId: templateData.questionId ?? undefined,
        participants: {
          create: [
            { userId: interviewerId, role: Role.INTERVIEWER },
            { userId: candidate.id, role: Role.CANDIDATE },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, email: true, name: true, role: true },
            },
          },
        },
      },
    });

    const candidateToken = this.jwtService.sign(
      {
        sub: candidate.id,
        email: candidate.email,
        role: Role.CANDIDATE,
        name: candidate.name,
      },
      { expiresIn: '7d' },
    );

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const interviewLink = `${frontendUrl}/interview/${interview.id}?token=${candidateToken}`;

    const branding = await this.getBrandingForInterview(interview);

    const calendarEvent = {
      title,
      description: description || `Technical interview: ${title}`,
      startTime: scheduledTime,
      durationMinutes: 60,
      url: interviewLink,
      organizerName: interviewer.name,
      organizerEmail: interviewer.email,
      attendeeName: candidate.name,
      attendeeEmail: candidate.email,
    };
    const calendarLinks =
      this.calendarService.generateCalendarLinks(calendarEvent);

    await this.mailService.sendInterviewInvitation(
      candidate.email,
      candidate.name,
      title,
      scheduledTime,
      interviewLink,
      branding,
      {
        googleUrl: calendarLinks.google,
        outlookUrl: calendarLinks.outlook,
        icsBuffer: calendarLinks.ics,
      },
    ).catch(() => {});

    if (recurrence) {
      await this.recurringService.createPattern(
        interview.id,
        interviewerId,
        recurrence,
        scheduledTime,
      );
    }

    await this.activityService.log({
      userId: interviewerId,
      type: 'interview_scheduled',
      title: effectiveTitle,
      description: effectiveDescription ? `${effectiveDescription.slice(0, 120)}...` : undefined,
      interviewId: interview.id,
      metadata: { candidateEmail, hasRecurrence: !!recurrence },
    });

    const mapped = this.mapInterviewResponse(interview)!;
    return { ...mapped, candidateToken };
  }

  async findUserInterviews(userId: string) {
    const interviews = await this.prisma.interview.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, email: true, name: true, role: true },
            },
          },
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });
    return interviews.map((iv) => this.mapInterviewResponse(iv)!);
  }

  async findOne(id: string): Promise<InterviewWithParticipants> {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, email: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }

    return interview;
  }

  async generateShareToken(interviewId: string, userId?: string): Promise<string> {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
    });
    if (!interview) throw new NotFoundException('Interview not found');

    if (interview.shareToken) return interview.shareToken;

    const { nanoid } = await import('nanoid');
    const token = nanoid(32);

    await this.prisma.interview.update({
      where: { id: interviewId },
      data: { shareToken: token },
    });

    if (userId) {
      await this.activityService.log({
        userId,
        type: 'share_created',
        title: interview.title,
        interviewId,
      }).catch(() => {});
    }

    return token;
  }

  async revokeShareToken(interviewId: string): Promise<void> {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
    });
    if (!interview) throw new NotFoundException('Interview not found');

    await this.prisma.interview.update({
      where: { id: interviewId },
      data: { shareToken: null },
    });
  }

  async findByShareToken(
    interviewId: string,
    token: string,
  ): Promise<InterviewWithParticipants> {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, email: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!interview) throw new NotFoundException('Interview not found');
    if (!interview.shareToken || interview.shareToken !== token) {
      throw new ForbiddenException('Invalid or expired share link');
    }

    return interview;
  }

  async updateStatus(id: string, status: InterviewStatus) {
    const interview = await this.prisma.interview.update({
      where: { id },
      data: { status },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                organizationId: true,
              },
            },
          },
        },
      },
    });

    if (status === InterviewStatus.CANCELLED) {
      const branding = await this.getBrandingForInterview(interview);
      for (const p of interview.participants) {
        try {
          await this.mailService.sendInterviewCancelled(
            p.user.email,
            p.user.name,
            interview.title,
            interview.scheduledTime,
            branding,
          );
        } catch (e) {
          this.logger.warn(
            `Failed to send cancellation email to ${p.user.email}: ${e}`,
          );
        }
      }
    }

    const statusActivityType = status === InterviewStatus.CANCELLED
      ? 'interview_cancelled'
      : status === InterviewStatus.COMPLETED
        ? 'interview_completed'
        : status === InterviewStatus.ACTIVE
          ? 'interview_active'
          : null;

    if (statusActivityType) {
      for (const p of interview.participants) {
        await this.activityService.log({
          userId: p.user.id,
          type: statusActivityType,
          title: interview.title,
          interviewId: interview.id,
        }).catch(() => {});
      }
    }

    return interview;
  }

  async reschedule(id: string, scheduledTime: Date) {
    const existing = await this.prisma.interview.findUnique({
      where: { id },
      select: { scheduledTime: true },
    });

    const interview = await this.prisma.interview.update({
      where: { id },
      data: { scheduledTime },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                organizationId: true,
              },
            },
          },
        },
      },
    });

    if (existing) {
      const branding = await this.getBrandingForInterview(interview);
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );
      const interviewLink = `${frontendUrl}/interview/${id}`;

      for (const p of interview.participants) {
        try {
          await this.mailService.sendInterviewRescheduled(
            p.user.email,
            p.user.name,
            interview.title,
            existing.scheduledTime,
            scheduledTime,
            interviewLink,
            branding,
          );
        } catch (e) {
          this.logger.warn(
            `Failed to send reschedule email to ${p.user.email}: ${e}`,
          );
        }
      }

      for (const p of interview.participants) {
        await this.activityService.log({
          userId: p.user.id,
          type: 'interview_rescheduled',
          title: interview.title,
          interviewId: interview.id,
          metadata: {
            from: existing.scheduledTime.toISOString(),
            to: scheduledTime.toISOString(),
          },
        }).catch(() => {});
      }
    }

    return interview;
  }

  async remove(id: string) {
    return this.prisma.interview.delete({ where: { id } });
  }

  async updateCode(id: string, codeContent: string, language: string) {
    return this.prisma.interview.update({
      where: { id },
      data: { codeContent, language },
    });
  }

  async saveTranscript(id: string, transcript: Prisma.InputJsonValue) {
    return this.prisma.interview.update({
      where: { id },
      data: { transcript },
    });
  }

  async generateMockFeedback(id: string) {
    const interview = await this.findOne(id);
    if (!interview) {
      throw new NotFoundException(`Interview ${id} not found`);
    }

    // Convert DB transcript into clean JSON array format
    let transcriptArray: Record<string, unknown>[] = [];
    if (interview.transcript) {
      if (typeof interview.transcript === 'string') {
        try {
          transcriptArray = JSON.parse(interview.transcript) as Record<
            string,
            unknown
          >[];
        } catch {
          transcriptArray = [];
        }
      } else if (Array.isArray(interview.transcript)) {
        transcriptArray = interview.transcript as Record<string, unknown>[];
      }
    }

    // Call Gemini API to perform live candidate assessment and grading
    const aiFeedback = await this.aiService.evaluateInterview(
      interview.title,
      interview.description || 'General Software Engineering',
      interview.codeContent,
      interview.language,
      transcriptArray,
    );

    const updated = await this.prisma.interview.update({
      where: { id },
      data: {
        feedback: aiFeedback as unknown as Prisma.InputJsonValue,
        status: InterviewStatus.COMPLETED,
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, email: true, name: true, role: true },
            },
          },
        },
      },
    });

    const score = (aiFeedback as unknown as Record<string, unknown>)
      .score as number;
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const reviewLink = `${frontendUrl}/review/${id}`;

    for (const participant of updated.participants) {
      const branding = await this.getBrandingForInterview(updated);
      await this.mailService.sendInterviewFeedbackReady(
        participant.user.email,
        participant.user.name,
        interview.title,
        score,
        reviewLink,
        branding,
      );

      await this.activityService.log({
        userId: participant.user.id,
        type: 'feedback_ready',
        title: interview.title,
        description: `Score: ${score}/100`,
        interviewId: id,
        metadata: { score },
      }).catch(() => {});
    }

    return updated;
  }

  private async getBrandingForInterview(interview: {
    participants: { user: { id?: string; organizationId?: string | null } }[];
  }) {
    const orgId = interview.participants.find((p) => p.user.organizationId)
      ?.user.organizationId;

    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const firstUserId = interview.participants[0]?.user.id;
      if (firstUserId) {
        const user = await this.prisma.user.findUnique({
          where: { id: firstUserId },
          select: { organizationId: true },
        });
        resolvedOrgId = user?.organizationId;
      }
    }

    if (!resolvedOrgId) return undefined;

    const org = await this.prisma.organization.findUnique({
      where: { id: resolvedOrgId },
      select: { name: true, logoUrl: true, primaryColor: true },
    });

    if (!org) return undefined;

    return {
      name: org.name,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
    };
  }
}
