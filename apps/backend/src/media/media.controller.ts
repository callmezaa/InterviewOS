import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { Ownership } from '../common/decorators/ownership.decorator';
import { MediaService } from './media.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { memoryStorage } from 'multer';

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post(':interviewId/upload')
  @UseGuards(OwnershipGuard)
  @Ownership('media', 'interviewId')
  @UseInterceptors(
    FileInterceptor('recording', {
      storage: memoryStorage(),
      limits: {
        fileSize: 500 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const isVideoOrAudio =
          file.mimetype.startsWith('video/') ||
          file.mimetype.startsWith('audio/');
        const isWebmExtension = file.originalname
          .toLowerCase()
          .endsWith('.webm');

        if (isVideoOrAudio || isWebmExtension) {
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
  async uploadRecording(
    @Param('interviewId') interviewId: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-recording-duration') durationHeader?: string,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No recording file received. Use field name "recording".',
      );
    }

    const duration = durationHeader ? parseFloat(durationHeader) : undefined;

    return this.mediaService.uploadRecording(
      interviewId,
      file.buffer,
      file.mimetype,
      duration,
    );
  }

  @Get('recordings')
  async listRecordings(@CurrentUser() user: AuthenticatedUser) {
    return this.mediaService.listRecordings(user.id);
  }

  @Get(':interviewId/url')
  @UseGuards(OwnershipGuard)
  @Ownership('media', 'interviewId')
  async getRecordingUrl(@Param('interviewId') interviewId: string) {
    return this.mediaService.getRecordingUrl(interviewId);
  }

  @Get(':interviewId/metadata')
  @UseGuards(OwnershipGuard)
  @Ownership('media', 'interviewId')
  async getRecordingMetadata(@Param('interviewId') interviewId: string) {
    return this.mediaService.getRecordingMetadata(interviewId);
  }

  @Delete(':interviewId')
  @UseGuards(OwnershipGuard)
  @Ownership('media', 'interviewId')
  async deleteRecording(@Param('interviewId') interviewId: string) {
    await this.mediaService.deleteRecording(interviewId);
    return { message: 'Recording deleted successfully' };
  }
}
