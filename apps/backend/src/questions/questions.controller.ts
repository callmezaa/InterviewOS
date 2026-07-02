import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuestionsService } from './questions.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { VoteQuestionDto } from './dto/vote-question.dto';

@ApiTags('Questions')
@Controller('questions')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(user.id, dto);
  }

  @Get()
  async findAll(@Query() query: QueryQuestionsDto) {
    return this.questionsService.findAll(query);
  }

  @Get('categories')
  async getCategories() {
    return this.questionsService.getCategories();
  }

  @Get('my')
  async getMy(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.questionsService.getMyQuestions(user.id, page, limit);
  }

  @Get('bookmarks')
  async getBookmarks(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.questionsService.getBookmarks(user.id, page, limit);
  }

  @Get('export')
  @SkipThrottle()
  @Header('Content-Disposition', 'attachment; filename="questions-export.json"')
  async exportQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.questionsService.exportQuestions(user.id, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="questions-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      );
      return data;
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="questions-export-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    return data;
  }

  @Post('import')
  @SkipThrottle()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['application/json', 'text/csv', 'text/plain'];
        const ext = file.originalname.toLowerCase();
        if (
          !allowed.includes(file.mimetype) &&
          !ext.endsWith('.json') &&
          !ext.endsWith('.csv')
        ) {
          cb(
            new BadRequestException(
              'Only JSON and CSV files are allowed (max 10 MB)',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async importQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.questionsService.importQuestions(user.id, file);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, user.id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionsService.remove(id, user.id);
  }

  @Post(':id/vote')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async vote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VoteQuestionDto,
  ) {
    return this.questionsService.vote(id, user.id, dto);
  }

  @Post(':id/bookmark')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async toggleBookmark(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionsService.toggleBookmark(id, user.id);
  }
}
