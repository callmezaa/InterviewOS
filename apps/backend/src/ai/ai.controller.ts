import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { SuggestQuestionsDto } from './dto/suggest-questions.dto';
import { AnalyzeComplexityDto } from './dto/analyze-complexity.dto';
import { memoryStorage } from 'multer';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('transcribe')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const isAudioOrVideo =
          file.mimetype.startsWith('audio/') ||
          file.mimetype.startsWith('video/');
        const isWebmOrWav =
          file.originalname.toLowerCase().endsWith('.webm') ||
          file.originalname.toLowerCase().endsWith('.wav') ||
          file.originalname.toLowerCase().endsWith('.bin');

        if (isAudioOrVideo || isWebmOrWav) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(`Unsupported file type: ${file.mimetype}`),
            false,
          );
        }
      },
    }),
  )
  async transcribeAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'No audio file received. Use field name "audio".',
      );
    }

    const text = await this.aiService.transcribeAudioStream(
      file.buffer,
      file.mimetype,
    );
    return { text };
  }

  @Post('generate-questions')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generateQuestions(@Body() dto: GenerateQuestionsDto) {
    const options = {
      language: dto.language,
      difficulty: dto.difficulty,
      category: dto.category,
      tags: dto.tags,
      topic: dto.topic,
    };

    if (dto.count === '3') {
      const questions = await this.aiService.generateQuestionVariations(
        dto.jobRole,
        dto.experienceLevel,
        3,
        options,
      );
      return { questions };
    }

    return this.aiService.generateQuestions(dto.jobRole, dto.experienceLevel, options);
  }

  @Post('suggest-questions')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async suggestQuestions(@Body() dto: SuggestQuestionsDto) {
    return this.aiService.suggestFollowUpQuestions(
      dto.transcript ?? [],
      dto.code,
      dto.language,
    );
  }

  @Post('analyze-complexity')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async analyzeComplexity(@Body() dto: AnalyzeComplexityDto) {
    return this.aiService.analyzeCodeComplexity(dto.code, dto.language);
  }
}
