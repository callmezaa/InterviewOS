import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../prisma.service';
import {
  QuestionDifficulty,
  QuestionSource,
  QuestionStatus,
} from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockCategory = {
    id: 'cat-1',
    name: 'Algorithms',
    slug: 'algorithms',
    description: 'Algorithm questions',
    icon: 'code',
    order: 1,
  };

  const mockQuestion = {
    id: 'q-1',
    title: 'Two Sum',
    description: 'Find two numbers that add up to target',
    starterCode: null,
    solutionCode: null,
    testCode: null,
    language: 'javascript',
    difficulty: QuestionDifficulty.EASY,
    status: QuestionStatus.PUBLISHED,
    source: QuestionSource.CURATED,
    authorId: null,
    categoryId: 'cat-1',
    category: mockCategory,
    tags: ['array', 'hash-map'],
    conceptQuestions: null,
    systemDesign: null,
    hints: null,
    upvotes: 10,
    downvotes: 2,
    viewCount: 150,
    usageCount: 25,
    author: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: PrismaService,
          useValue: {
            question: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            questionCategory: {
              findMany: jest.fn(),
            },
            questionVote: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            questionBookmark: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a question with provided data', async () => {
      const dto = {
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: QuestionDifficulty.EASY,
        categoryId: 'cat-1',
        tags: ['array', 'hash-map'],
      };

      (prisma.question.create as jest.Mock).mockResolvedValue(mockQuestion);

      const result = await service.create('user-1', dto);

      expect(prisma.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Two Sum',
          difficulty: QuestionDifficulty.EASY,
          authorId: 'user-1',
        }),
        include: expect.any(Object),
      });
      expect(result.title).toBe('Two Sum');
    });

    it('creates question with default values', async () => {
      const dto = {
        title: 'Test Question',
        description: 'Description',
        difficulty: QuestionDifficulty.MEDIUM,
      };

      (prisma.question.create as jest.Mock).mockResolvedValue({
        ...mockQuestion,
        title: 'Test Question',
        status: QuestionStatus.DRAFT,
        source: QuestionSource.COMMUNITY,
      });

      const result = await service.create('user-1', dto);

      expect(result.source).toBe(QuestionSource.COMMUNITY);
      expect(result.status).toBe(QuestionStatus.DRAFT);
    });
  });

  describe('findAll', () => {
    it('returns paginated questions with default params', async () => {
      (prisma.question.findMany as jest.Mock).mockResolvedValue([mockQuestion]);
      (prisma.question.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('filters by difficulty', async () => {
      (prisma.question.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.question.count as jest.Mock).mockResolvedValue(0);

      await service.findAll({ difficulty: QuestionDifficulty.EASY });

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            difficulty: QuestionDifficulty.EASY,
          }),
        }),
      );
    });

    it('filters by search term', async () => {
      (prisma.question.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.question.count as jest.Mock).mockResolvedValue(0);

      await service.findAll({ search: 'two sum' });

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: expect.objectContaining({ contains: 'two sum' }),
              }),
            ]),
          }),
        }),
      );
    });

    it('handles pagination correctly', async () => {
      (prisma.question.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.question.count as jest.Mock).mockResolvedValue(50);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns question by id and increments viewCount', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);
      (prisma.question.update as jest.Mock).mockResolvedValue({
        ...mockQuestion,
        viewCount: 151,
      });

      const result = await service.findOne('q-1');

      expect(prisma.question.update).toHaveBeenCalledWith({
        where: { id: 'q-1' },
        data: { viewCount: { increment: 1 } },
      });
      expect(result.id).toBe('q-1');
    });

    it('throws NotFoundException when question not found', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Question not found',
      );
    });
  });

  describe('update', () => {
    it('updates existing question', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({
        ...mockQuestion,
        authorId: 'user-1',
      });
      (prisma.question.update as jest.Mock).mockResolvedValue({
        ...mockQuestion,
        title: 'Updated Title',
      });

      const result = await service.update('q-1', 'user-1', {
        title: 'Updated Title',
      });

      expect(prisma.question.update).toHaveBeenCalledWith({
        where: { id: 'q-1' },
        data: { title: 'Updated Title' },
        include: expect.any(Object),
      });
      expect(result.title).toBe('Updated Title');
    });

    it('throws when non-author tries to update', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({
        ...mockQuestion,
        authorId: 'other-user',
      });

      await expect(
        service.update('q-1', 'user-1', { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('deletes own question', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({
        ...mockQuestion,
        authorId: 'user-1',
      });
      (prisma.question.delete as jest.Mock).mockResolvedValue(mockQuestion);

      const result = await service.remove('q-1', 'user-1');

      expect(prisma.question.delete).toHaveBeenCalledWith({
        where: { id: 'q-1' },
      });
      expect(result).toBeUndefined();
    });

    it('throws when non-author tries to delete', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({
        ...mockQuestion,
        authorId: 'other-user',
      });

      await expect(service.remove('q-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('vote', () => {
    it('creates upvote when no existing vote', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);
      (prisma.questionVote.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.questionVote.create as jest.Mock).mockResolvedValue({
        id: 'v-1',
        userId: 'user-1',
        questionId: 'q-1',
        value: 1,
      });

      await service.vote('q-1', 'user-1', { value: 1 });

      expect(prisma.questionVote.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', questionId: 'q-1', value: 1 },
      });
    });

    it('removes vote when same value is toggled', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);
      (prisma.questionVote.findUnique as jest.Mock).mockResolvedValue({
        id: 'v-1',
        userId: 'user-1',
        questionId: 'q-1',
        value: 1,
      });
      (prisma.questionVote.delete as jest.Mock).mockResolvedValue({} as any);

      await service.vote('q-1', 'user-1', { value: 1 });

      expect(prisma.questionVote.delete).toHaveBeenCalledWith({
        where: { id: 'v-1' },
      });
    });
  });

  describe('getCategories', () => {
    it('returns categories sorted by order', async () => {
      (prisma.questionCategory.findMany as jest.Mock).mockResolvedValue([
        mockCategory,
      ]);

      const result = await service.getCategories();

      expect(prisma.questionCategory.findMany).toHaveBeenCalledWith({
        orderBy: { order: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });
});
