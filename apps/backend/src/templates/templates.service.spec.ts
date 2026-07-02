import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma.service';
import { QuestionDifficulty } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prisma: jest.Mocked<PrismaService>;

  const mockTemplate = {
    id: 't-1',
    title: 'Frontend Coding Interview',
    description: 'A standard frontend interview template',
    category: 'FRONTEND',
    language: 'javascript',
    difficulty: QuestionDifficulty.MEDIUM,
    starterCode: null,
    questionId: null,
    source: 'COMMUNITY',
    status: 'PUBLISHED',
    authorId: 'user-1',
    author: { id: 'user-1', name: 'Test User', avatarUrl: null },
    tags: [],
    upvotes: 0,
    downvotes: 0,
    viewCount: 0,
    isDefault: false,
    usageCount: 10,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    question: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: PrismaService,
          useValue: {
            interviewTemplate: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            templateVote: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            templateBookmark: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated templates', async () => {
      (prisma.interviewTemplate.findMany as jest.Mock).mockResolvedValue([mockTemplate]);
      (prisma.interviewTemplate.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll({});

      expect(prisma.interviewTemplate.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by category when provided', async () => {
      (prisma.interviewTemplate.findMany as jest.Mock).mockResolvedValue([mockTemplate]);
      (prisma.interviewTemplate.count as jest.Mock).mockResolvedValue(1);

      await service.findAll({ category: 'FRONTEND' });

      expect(prisma.interviewTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'FRONTEND' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns template by id and increments viewCount', async () => {
      (prisma.interviewTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.interviewTemplate.update as jest.Mock).mockResolvedValue(mockTemplate);

      const result = await service.findOne('t-1');

      expect(prisma.interviewTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 't-1' },
        include: expect.any(Object),
      });
      expect(result.id).toBe('t-1');
    });

    it('throws NotFoundException for non-existent template', async () => {
      (prisma.interviewTemplate.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a new template', async () => {
      const dto = {
        title: 'New Template',
        description: 'Description',
        category: 'BACKEND' as const,
      };

      (prisma.interviewTemplate.create as jest.Mock).mockResolvedValue({
        ...mockTemplate,
        title: 'New Template',
        category: 'BACKEND',
      });

      const result = await service.create('user-1', dto);

      expect(prisma.interviewTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Template',
            category: 'BACKEND',
            authorId: 'user-1',
            source: 'COMMUNITY',
          }),
        }),
      );
      expect(result.title).toBe('New Template');
    });
  });

  describe('update', () => {
    it('updates own template', async () => {
      (prisma.interviewTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.interviewTemplate.update as jest.Mock).mockResolvedValue({ ...mockTemplate, title: 'Updated' });

      const result = await service.update('t-1', 'user-1', { title: 'Updated' });

      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('deletes own template', async () => {
      (prisma.interviewTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.interviewTemplate.delete as jest.Mock).mockResolvedValue(mockTemplate);

      const result = await service.remove('t-1', 'user-1');

      expect(result.id).toBe('t-1');
    });
  });

  describe('vote', () => {
    it('upvotes a template', async () => {
      (prisma.interviewTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.templateVote.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.templateVote.create as jest.Mock).mockResolvedValue({});
      (prisma.interviewTemplate.update as jest.Mock).mockResolvedValue({});

      const result = await service.vote('t-1', 'user-1', 1);

      expect(result.vote).toBe(1);
    });

    it('removes vote on same value', async () => {
      (prisma.interviewTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.templateVote.findUnique as jest.Mock).mockResolvedValue({ id: 'v-1', value: 1 });
      (prisma.templateVote.delete as jest.Mock).mockResolvedValue({});
      (prisma.interviewTemplate.update as jest.Mock).mockResolvedValue({});

      const result = await service.vote('t-1', 'user-1', 1);

      expect(result.vote).toBeNull();
    });
  });

  describe('toggleBookmark', () => {
    it('bookmarks a template', async () => {
      (prisma.interviewTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.templateBookmark.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.templateBookmark.create as jest.Mock).mockResolvedValue({});

      const result = await service.toggleBookmark('t-1', 'user-1');

      expect(result.bookmarked).toBe(true);
    });

    it('removes existing bookmark', async () => {
      (prisma.interviewTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.templateBookmark.findUnique as jest.Mock).mockResolvedValue({ id: 'b-1' });
      (prisma.templateBookmark.delete as jest.Mock).mockResolvedValue({});

      const result = await service.toggleBookmark('t-1', 'user-1');

      expect(result.bookmarked).toBe(false);
    });
  });
});
