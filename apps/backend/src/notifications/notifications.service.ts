import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { MailService, BrandConfig } from '../mail/mail.service';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async getPreferences(userId: string) {
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      return {
        invitations: true,
        reminders: true,
        feedback: true,
        team: false,
        updates: false,
        digest: 'immediate',
      };
    }

    return {
      invitations: prefs.invitations,
      reminders: prefs.reminders,
      feedback: prefs.feedback,
      team: prefs.team,
      updates: prefs.updates,
      digest: prefs.digest,
    };
  }

  async updatePreferences(userId: string, dto: UpdateNotificationPrefsDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        invitations: dto.invitations ?? true,
        reminders: dto.reminders ?? true,
        feedback: dto.feedback ?? true,
        team: dto.team ?? false,
        updates: dto.updates ?? false,
        digest: dto.digest ?? 'immediate',
      },
      update: {
        ...(dto.invitations !== undefined && { invitations: dto.invitations }),
        ...(dto.reminders !== undefined && { reminders: dto.reminders }),
        ...(dto.feedback !== undefined && { feedback: dto.feedback }),
        ...(dto.team !== undefined && { team: dto.team }),
        ...(dto.updates !== undefined && { updates: dto.updates }),
        ...(dto.digest !== undefined && { digest: dto.digest }),
      },
    });
  }

  async getNotifications(userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string,
  ) {
    return this.prisma.notification.create({
      data: { userId, type, title, message, link },
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendReminderEmails() {
    const now = new Date();
    const in15Min = new Date(now.getTime() + 15 * 60 * 1000);
    const in30Min = new Date(now.getTime() + 30 * 60 * 1000);

    const upcomingInterviews = await this.prisma.interview.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledTime: {
          gte: in15Min,
          lte: in30Min,
        },
      },
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

    let sent = 0;

    for (const interview of upcomingInterviews) {
      const branding = await this.getBrandingForInterview(interview);

      for (const participant of interview.participants) {
        const user = participant.user;
        const prefs = await this.getPreferences(user.id);

        if (!prefs.reminders) continue;

        const existingNotif = await this.prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: 'interview_reminder',
            link: `/interview/${interview.id}`,
            createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
          },
        });

        if (existingNotif) continue;

        try {
          await this.mailService.sendInterviewReminder(
            user.email,
            user.name,
            interview.title,
            interview.scheduledTime,
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/interview/${interview.id}`,
            branding,
          );

          await this.createNotification(
            user.id,
            'interview_reminder',
            'Interview Starting Soon',
            `"${interview.title}" starts in approximately 15 minutes.`,
            `/interview/${interview.id}`,
          );

          sent++;
        } catch (e) {
          this.logger.warn(`Failed to send reminder to ${user.email}: ${e}`);
        }
      }
    }

    if (sent > 0) {
      this.logger.log(`Sent ${sent} interview reminder(s)`);
    }

    return { sent };
  }

  private async getBrandingForInterview(interview: {
    participants: { user: { organizationId: string | null } }[];
  }): Promise<BrandConfig | undefined> {
    const orgId = interview.participants.find((p) => p.user.organizationId)
      ?.user.organizationId;
    if (!orgId) return undefined;

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
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
