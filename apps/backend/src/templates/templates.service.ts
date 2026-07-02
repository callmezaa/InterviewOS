import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTemplateDto) {
    return this.prisma.interviewTemplate.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        language: dto.language ?? 'javascript',
        difficulty: dto.difficulty as any,
        starterCode: dto.starterCode,
        questionId: dto.questionId,
        tags: dto.tags ?? [],
        authorId: userId,
        source: 'COMMUNITY',
        status: 'DRAFT',
      },
      include: {
        question: { select: { id: true, title: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async findAll(query: {
    category?: string;
    source?: string;
    difficulty?: string;
    tag?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
    authorId?: string;
  }) {
    const {
      category,
      source,
      difficulty,
      tag,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      authorId,
    } = query;

    const where: Prisma.InterviewTemplateWhereInput = {};

    // For public listing: show PUBLISHED + CURATED, or user's own DRAFTs
    if (source) where.source = source as any;
    else {
      where.OR = [{ status: 'PUBLISHED' }, { source: 'CURATED' }];
    }
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty as any;
    if (tag) where.tags = { has: tag };
    if (authorId) where.authorId = authorId;
    if (search) {
      const searchFilter: Prisma.InterviewTemplateWhereInput = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      };
      where.AND = [searchFilter];
    }

    const allowedSort = [
      'createdAt',
      'updatedAt',
      'upvotes',
      'usageCount',
      'viewCount',
      'title',
    ];
    const orderField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.interviewTemplate.findMany({
        where,
        orderBy: [{ isDefault: 'desc' }, { [orderField]: sortOrder }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          question: { select: { id: true, title: true } },
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.interviewTemplate.count({ where }),
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

  async findOne(id: string) {
    const template = await this.prisma.interviewTemplate.findUnique({
      where: { id },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            tags: true,
          },
        },
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    if (!template) throw new NotFoundException('Template not found');

    await this.prisma.interviewTemplate.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return template;
  }

  async update(id: string, userId: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.interviewTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('Template not found');
    if (template.authorId && template.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own templates');
    }

    return this.prisma.interviewTemplate.update({
      where: { id },
      data: {
        ...dto,
        difficulty: dto.difficulty as any,
        tags: dto.tags !== undefined ? dto.tags : undefined,
      },
      include: {
        question: { select: { id: true, title: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const template = await this.prisma.interviewTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('Template not found');
    if (template.authorId && template.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own templates');
    }
    return this.prisma.interviewTemplate.delete({ where: { id } });
  }

  async vote(templateId: string, userId: string, value: 1 | -1) {
    const template = await this.prisma.interviewTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new NotFoundException('Template not found');

    const existing = await this.prisma.templateVote.findUnique({
      where: { userId_templateId: { userId, templateId } },
    });

    if (existing) {
      if (existing.value === value) {
        await this.prisma.templateVote.delete({ where: { id: existing.id } });
        const delta = value === 1 ? -1 : 1;
        await this.prisma.interviewTemplate.update({
          where: { id: templateId },
          data:
            value === 1
              ? { upvotes: { increment: delta } }
              : { downvotes: { increment: delta } },
        });
        return { vote: null };
      }

      await this.prisma.templateVote.update({
        where: { id: existing.id },
        data: { value },
      });
      await this.prisma.interviewTemplate.update({
        where: { id: templateId },
        data: {
          upvotes: { increment: value === 1 ? 1 : -1 },
          downvotes: { increment: value === -1 ? 1 : -1 },
        },
      });
      return { vote: value };
    }

    await this.prisma.templateVote.create({
      data: { userId, templateId, value },
    });
    await this.prisma.interviewTemplate.update({
      where: { id: templateId },
      data:
        value === 1
          ? { upvotes: { increment: 1 } }
          : { downvotes: { increment: 1 } },
    });
    return { vote: value };
  }

  async toggleBookmark(templateId: string, userId: string) {
    const template = await this.prisma.interviewTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new NotFoundException('Template not found');

    const existing = await this.prisma.templateBookmark.findUnique({
      where: { userId_templateId: { userId, templateId } },
    });

    if (existing) {
      await this.prisma.templateBookmark.delete({
        where: { id: existing.id },
      });
      return { bookmarked: false };
    }

    await this.prisma.templateBookmark.create({
      data: { userId, templateId },
    });
    return { bookmarked: true };
  }

  async getBookmarks(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.templateBookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          template: {
            include: {
              question: { select: { id: true, title: true } },
              author: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.templateBookmark.count({ where: { userId } }),
    ]);

    return {
      data: data.map((b) => b.template),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  async getMyTemplates(userId: string, page = 1, limit = 20) {
    return this.findAll({ authorId: userId, page, limit });
  }

  async incrementUsage(id: string) {
    return this.prisma.interviewTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }
}
