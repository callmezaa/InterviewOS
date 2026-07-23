import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DataExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const [
      participants,
      authoredQuestions,
      votes,
      bookmarks,
      notificationPref,
      notifications,
      organization,
    ] = await Promise.all([
      this.prisma.participant.findMany({
        where: { userId },
        include: {
          interview: {
            include: {
              participants: {
                select: {
                  role: true,
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.question.findMany({
        where: { authorId: userId },
        include: { category: { select: { name: true, slug: true } } },
      }),
      this.prisma.questionVote.findMany({
        where: { userId },
        include: {
          question: { select: { id: true, title: true } },
        },
      }),
      this.prisma.questionBookmark.findMany({
        where: { userId },
        include: {
          question: { select: { id: true, title: true } },
        },
      }),
      this.prisma.notificationPreference.findUnique({
        where: { userId },
      }),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      user.organizationId
        ? this.prisma.organization.findUnique({
            where: { id: user.organizationId },
          })
        : Promise.resolve(null),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        provider: user.provider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        organizationId: user.organizationId,
      },
      interviews: participants.map((p) => ({
        participantId: p.id,
        role: p.role,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        interview: {
          id: p.interview.id,
          title: p.interview.title,
          description: p.interview.description,
          status: p.interview.status,
          scheduledTime: p.interview.scheduledTime,
          language: p.interview.language,
          createdAt: p.interview.createdAt,
          updatedAt: p.interview.updatedAt,
          participants: p.interview.participants.map((pp) => ({
            role: pp.role,
            user: pp.user,
          })),
        },
      })),
      questions: authoredQuestions.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        language: q.language,
        difficulty: q.difficulty,
        status: q.status,
        source: q.source,
        tags: q.tags,
        category: q.category,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
      votes: votes.map((v) => ({
        questionId: v.questionId,
        questionTitle: v.question.title,
        value: v.value,
      })),
      bookmarks: bookmarks.map((b) => ({
        questionId: b.questionId,
        questionTitle: b.question.title,
        createdAt: b.createdAt,
      })),
      notificationPreferences: notificationPref
        ? {
            invitations: notificationPref.invitations,
            reminders: notificationPref.reminders,
            feedback: notificationPref.feedback,
            team: notificationPref.team,
            updates: notificationPref.updates,
            digest: notificationPref.digest,
          }
        : null,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt,
      })),
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logoUrl: organization.logoUrl,
            primaryColor: organization.primaryColor,
            createdAt: organization.createdAt,
          }
        : null,
    };
  }
}
