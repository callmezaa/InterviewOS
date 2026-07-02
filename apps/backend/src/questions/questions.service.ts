import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { VoteQuestionDto } from './dto/vote-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateQuestionDto) {
    return this.prisma.question.create({
      data: {
        ...dto,
        tags: dto.tags ?? [],
        conceptQuestions: dto.conceptQuestions
          ? JSON.stringify(dto.conceptQuestions)
          : undefined,
        hints: dto.hints ? JSON.stringify(dto.hints) : undefined,
        authorId: userId,
        source: 'COMMUNITY',
        status: 'DRAFT',
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async findAll(query: QueryQuestionsDto) {
    const {
      search,
      difficulty,
      source,
      status,
      categoryId,
      language,
      tag,
      authorId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (difficulty) where.difficulty = difficulty;
    if (source) where.source = source;
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (language) where.language = language;
    if (tag) where.tags = { has: tag };
    if (authorId) where.authorId = authorId;

    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'upvotes',
      'downvotes',
      'viewCount',
      'usageCount',
      'title',
    ];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
        interviews: {
          select: { id: true, title: true },
          take: 10,
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.prisma.question.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const conceptQuestions = question.conceptQuestions
      ? (JSON.parse(question.conceptQuestions as string) as string[])
      : null;
    const hints = question.hints
      ? (JSON.parse(question.hints as string) as string[])
      : null;

    return { ...question, conceptQuestions, hints };
  }

  async update(id: string, userId: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own questions');
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.conceptQuestions !== undefined) {
      data.conceptQuestions = JSON.stringify(dto.conceptQuestions);
    }
    if (dto.hints !== undefined) {
      data.hints = JSON.stringify(dto.hints);
    }

    return this.prisma.question.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own questions');
    }

    await this.prisma.question.delete({ where: { id } });
  }

  async vote(questionId: string, userId: string, dto: VoteQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const existing = await this.prisma.questionVote.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });

    if (existing) {
      if (existing.value === dto.value) {
        await this.prisma.questionVote.delete({ where: { id: existing.id } });
        const delta = dto.value === 1 ? -1 : 1;
        await this.prisma.question.update({
          where: { id: questionId },
          data:
            dto.value === 1
              ? { upvotes: { increment: delta } }
              : { downvotes: { increment: delta } },
        });
        return { vote: null };
      }

      await this.prisma.questionVote.update({
        where: { id: existing.id },
        data: { value: dto.value },
      });
      const upDelta = dto.value === 1 ? 2 : -2;
      const downDelta = dto.value === -1 ? 2 : -2;
      await this.prisma.question.update({
        where: { id: questionId },
        data: {
          upvotes: { increment: upDelta > 0 ? 1 : -1 },
          downvotes: { increment: downDelta > 0 ? 1 : -1 },
        },
      });
      return { vote: dto.value };
    }

    await this.prisma.questionVote.create({
      data: { userId, questionId, value: dto.value },
    });
    await this.prisma.question.update({
      where: { id: questionId },
      data:
        dto.value === 1
          ? { upvotes: { increment: 1 } }
          : { downvotes: { increment: 1 } },
    });
    return { vote: dto.value };
  }

  async toggleBookmark(questionId: string, userId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const existing = await this.prisma.questionBookmark.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });

    if (existing) {
      await this.prisma.questionBookmark.delete({
        where: { id: existing.id },
      });
      return { bookmarked: false };
    }

    await this.prisma.questionBookmark.create({
      data: { userId, questionId },
    });
    return { bookmarked: true };
  }

  async getBookmarks(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.questionBookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          question: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
              author: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.questionBookmark.count({ where: { userId } }),
    ]);

    return {
      data: data.map((b) => b.question),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMyQuestions(userId: string, page = 1, limit = 20) {
    return this.findAll({
      authorId: userId,
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  async getCategories() {
    return this.prisma.questionCategory.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async incrementUsage(questionId: string) {
    await this.prisma.question.update({
      where: { id: questionId },
      data: { usageCount: { increment: 1 } },
    });
  }

  async exportQuestions(userId: string, format: 'json' | 'csv') {
    const questions = await this.prisma.question.findMany({
      where: {
        OR: [
          { authorId: userId },
          { source: 'CURATED' },
        ],
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const exportData = questions.map((q) => ({
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      language: q.language,
      categoryName: q.category?.name ?? null,
      tags: q.tags,
      starterCode: q.starterCode,
      solutionCode: q.solutionCode,
      testCode: q.testCode,
      conceptQuestions: q.conceptQuestions
        ? (JSON.parse(q.conceptQuestions as string) as string[])
        : null,
      systemDesign: q.systemDesign,
      hints: q.hints
        ? (JSON.parse(q.hints as string) as string[])
        : null,
    }));

    if (format === 'csv') {
      const esc = (v: unknown) => {
        const s = v == null ? '' : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };
      const headers = [
        'title','description','difficulty','language','categoryName',
        'tags','starterCode','solutionCode','testCode',
        'conceptQuestions','systemDesign','hints',
      ];
      const rows = exportData.map((q) =>
        [
          esc(q.title), esc(q.description), esc(q.difficulty),
          esc(q.language), esc(q.categoryName),
          esc((q.tags ?? []).join(';')),
          esc(q.starterCode), esc(q.solutionCode), esc(q.testCode),
          esc((q.conceptQuestions ?? []).join('\n')),
          esc(q.systemDesign),
          esc((q.hints ?? []).join('\n')),
        ].join(','),
      );
      return [headers.join(','), ...rows].join('\n');
    }

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      questions: exportData,
    };
  }

  async importQuestions(userId: string, file: Express.Multer.File) {
    let records: Record<string, unknown>[];

    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      const raw = JSON.parse(file.buffer.toString('utf-8'));
      records = raw.questions ?? (Array.isArray(raw) ? raw : [raw]);
    } else if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'text/plain' ||
      file.originalname.endsWith('.csv')
    ) {
      const text = file.buffer.toString('utf-8').trim();
      const lines = text.split('\n');
      if (lines.length < 2) {
        throw new BadRequestException('CSV file must have a header row and at least one data row');
      }
      const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      records = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        const row: Record<string, unknown> = {};
        header.forEach((h, idx) => {
          row[h] = vals[idx] ?? '';
        });
        if (row.title) {
          if (row.tags && typeof row.tags === 'string') {
            row.tags = (row.tags as string).split(';').map((t) => t.trim()).filter(Boolean);
          }
          if (row.conceptQuestions && typeof row.conceptQuestions === 'string') {
            row.conceptQuestions = (row.conceptQuestions as string).split('\n').filter(Boolean);
          }
          if (row.hints && typeof row.hints === 'string') {
            row.hints = (row.hints as string).split('\n').filter(Boolean);
          }
          records.push(row);
        }
      }
    } else {
      throw new BadRequestException('Unsupported file format. Please upload a JSON or CSV file.');
    }

    if (records.length === 0) {
      throw new BadRequestException('No valid questions found in the uploaded file');
    }

    const categories = await this.prisma.questionCategory.findMany();
    const categoryMap = new Map<string, string>();
    for (const c of categories) {
      categoryMap.set(c.name.toLowerCase(), c.id);
      categoryMap.set(c.slug.toLowerCase(), c.id);
    }

    const results: { imported: number; skipped: number; errors: { row: number; message: string }[] } = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    const validDifficulties = new Set(['EASY', 'MEDIUM', 'HARD']);
    const validLanguages = new Set([
      'javascript', 'typescript', 'python', 'go', 'rust', 'cpp', 'java', 'csharp', 'ruby', 'php', 'sql', 'swift', 'kotlin',
    ]);

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      try {
        if (!r.title || typeof r.title !== 'string' || r.title.trim().length < 3) {
          results.errors.push({ row: i + 1, message: 'Title must be at least 3 characters' });
          results.skipped++;
          continue;
        }
        if (!r.description || typeof r.description !== 'string' || r.description.trim().length < 10) {
          results.errors.push({ row: i + 1, message: 'Description must be at least 10 characters' });
          results.skipped++;
          continue;
        }

        const difficulty = String(r.difficulty ?? 'MEDIUM').toUpperCase();
        if (!validDifficulties.has(difficulty)) {
          results.errors.push({ row: i + 1, message: `Invalid difficulty "${r.difficulty}". Must be EASY, MEDIUM, or HARD` });
          results.skipped++;
          continue;
        }

        let categoryId: string | undefined;
        if (r.categoryName) {
          categoryId = categoryMap.get(String(r.categoryName).toLowerCase());
        }

        const language = r.language && validLanguages.has(String(r.language).toLowerCase())
          ? String(r.language).toLowerCase()
          : 'javascript';

        const tags = Array.isArray(r.tags)
          ? (r.tags as string[]).filter(Boolean).slice(0, 10)
          : typeof r.tags === 'string'
            ? (r.tags as string).split(/[,;]/).map((t: string) => t.trim()).filter(Boolean).slice(0, 10)
            : [];

        const conceptQuestions = Array.isArray(r.conceptQuestions)
          ? (r.conceptQuestions as string[]).filter(Boolean).slice(0, 10)
          : [];
        const hints = Array.isArray(r.hints)
          ? (r.hints as string[]).filter(Boolean).slice(0, 5)
          : [];

        const dto: CreateQuestionDto = {
          title: String(r.title).trim(),
          description: String(r.description).trim(),
          difficulty: difficulty as 'EASY' | 'MEDIUM' | 'HARD',
          language,
          categoryId,
          tags,
          conceptQuestions: conceptQuestions.length > 0 ? conceptQuestions : undefined,
          hints: hints.length > 0 ? hints : undefined,
          starterCode: r.starterCode ? String(r.starterCode) : undefined,
          solutionCode: r.solutionCode ? String(r.solutionCode) : undefined,
          testCode: r.testCode ? String(r.testCode) : undefined,
          systemDesign: r.systemDesign ? String(r.systemDesign) : undefined,
        };

        await this.create(userId, dto);
        results.imported++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push({ row: i + 1, message });
        results.skipped++;
      }
    }

    return results;
  }
}
