import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: jest.Mocked<PrismaService>;
  let mailService: jest.Mocked<MailService>;

  const mockPreferences = {
    id: 'pref-1',
    userId: 'user-1',
    invitations: true,
    reminders: true,
    feedback: true,
    team: false,
    updates: false,
    digest: 'immediate',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    type: 'interview_reminder',
    title: 'Interview Reminder',
    message: 'Your interview starts in 30 minutes',
    link: '/interview/abc',
    read: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notificationPreference: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
            notification: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              count: jest.fn(),
            },
            interview: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: MailService,
          useValue: {
            sendInterviewReminder: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get(PrismaService);
    mailService = module.get(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('returns existing preferences', async () => {
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(
        mockPreferences,
      );

      const result = await service.getPreferences('user-1');

      expect(result).toEqual({
        invitations: true,
        reminders: true,
        feedback: true,
        team: false,
        updates: false,
        digest: 'immediate',
      });
    });

    it('returns default preferences when none exist', async () => {
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await service.getPreferences('user-1');

      expect(result).toEqual({
        invitations: true,
        reminders: true,
        feedback: true,
        team: false,
        updates: false,
        digest: 'immediate',
      });
    });
  });

  describe('updatePreferences', () => {
    it('updates notification preferences', async () => {
      (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue({
        ...mockPreferences,
        team: true,
        digest: 'daily',
      });

      const result = await service.updatePreferences('user-1', {
        team: true,
        digest: 'daily',
      });

      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: { team: true, digest: 'daily' },
        create: expect.any(Object),
      });
      expect(result.team).toBe(true);
      expect(result.digest).toBe('daily');
    });
  });

  describe('getNotifications', () => {
    it('returns latest 20 notifications for user', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        mockNotification,
      ]);

      const result = await service.getNotifications('user-1');

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no notifications', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getNotifications('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getUnreadCount', () => {
    it('returns the count of unread notifications', async () => {
      (prisma.notification.count as jest.Mock).mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toEqual({ count: 5 });
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        read: true,
      });

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
        data: { read: true },
      });
      expect(result.read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read', async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({
        count: 3,
      } as any);

      await service.markAllAsRead('user-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        data: { read: true },
      });
    });
  });

  describe('createNotification', () => {
    it('creates a notification', async () => {
      (prisma.notification.create as jest.Mock).mockResolvedValue(
        mockNotification,
      );

      const result = await service.createNotification(
        'user-1',
        'interview_reminder',
        'Test',
        'Test message',
        '/test',
      );

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'interview_reminder',
          title: 'Test',
          message: 'Test message',
          link: '/test',
        },
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('sendReminderEmails', () => {
    it('sends reminders for interviews starting in 15-30 minutes', async () => {
      const mockInterview = {
        id: 'iv-1',
        title: 'Test Interview',
        scheduledTime: new Date(Date.now() + 20 * 60 * 1000),
        participants: [
          {
            user: {
              id: 'u1',
              email: 'test@test.com',
              name: 'Test User',
              organizationId: null,
            },
          },
        ],
      };

      (prisma.interview.findMany as jest.Mock).mockResolvedValue([
        mockInterview,
      ] as any);
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      await service.sendReminderEmails();

      expect(mailService.sendInterviewReminder).toHaveBeenCalled();
    });

    it('does not send reminders when no interviews in range', async () => {
      (prisma.interview.findMany as jest.Mock).mockResolvedValue([]);

      await service.sendReminderEmails();

      expect(mailService.sendInterviewReminder).not.toHaveBeenCalled();
    });
  });
});
