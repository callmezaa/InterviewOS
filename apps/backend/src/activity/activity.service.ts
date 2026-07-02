import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { Prisma } from '@prisma/client';

export type ActivityType =
  | 'interview_scheduled'
  | 'interview_active'
  | 'interview_completed'
  | 'interview_cancelled'
  | 'interview_rescheduled'
  | 'feedback_ready'
  | 'account_created'
  | 'guest_converted'
  | 'share_created';

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  interview_scheduled: 'Interview scheduled',
  interview_active: 'Interview started',
  interview_completed: 'Interview completed',
  interview_cancelled: 'Interview cancelled',
  interview_rescheduled: 'Interview rescheduled',
  feedback_ready: 'AI feedback generated',
  account_created: 'Account created',
  guest_converted: 'Guest converted to account',
  share_created: 'Review link created',
};

export interface ActivityLogInput {
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  interviewId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: ActivityLogInput) {
    return this.prisma.activity.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        description: input.description,
        interviewId: input.interviewId ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async findAll(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      type?: ActivityType;
      before?: string;
    } = {},
  ) {
    const { page = 1, limit = 20, type, before } = query;

    const where: Prisma.ActivityWhereInput = { userId };
    if (type) where.type = type;
    if (before) where.createdAt = { lt: new Date(before) };

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          interview: {
            select: { id: true, title: true, status: true },
          },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  async getRecentCount(userId: string, since: Date): Promise<number> {
    return this.prisma.activity.count({
      where: {
        userId,
        createdAt: { gte: since },
      },
    });
  }
}
