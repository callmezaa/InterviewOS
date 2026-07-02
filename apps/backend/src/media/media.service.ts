import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { IStorageAdapter } from './storage/storage.interface';
import { createStorageAdapter } from './storage/storage.factory';

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private storageAdapter: IStorageAdapter;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const provider =
      this.configService.get<string>('STORAGE_PROVIDER') || 'local';
    this.storageAdapter = createStorageAdapter(this.configService);
    this.logger.log(`Storage provider initialized: ${provider.toUpperCase()}`);
  }

  /**
   * Upload a complete .webm interview recording.
   * Called once when the user stops recording in the browser.
   *
   * @param interviewId - Interview UUID (used as part of the storage key)
   * @param fileBuffer  - Raw bytes of the .webm file
   * @param mimeType    - MIME type (default: video/webm)
   * @returns The public URL of the uploaded recording
   */
  async uploadRecording(
    interviewId: string,
    fileBuffer: Buffer,
    mimeType = 'video/webm',
    duration?: number,
  ): Promise<{
    recordingUrl: string;
    recordingSize: number;
    recordingMimeType: string;
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `recordings/${interviewId}/${timestamp}.webm`;

    this.logger.log(
      `Uploading recording for interview ${interviewId} (${fileBuffer.length} bytes)`,
    );

    const result = await this.storageAdapter.upload(key, fileBuffer, mimeType);

    this.logger.log(`Recording uploaded via ${result.provider}: ${result.url}`);

    await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        recordingUrl: result.url,
        recordingSize: fileBuffer.length,
        recordingMimeType: mimeType,
        recordingDuration: duration ?? null,
      },
    });

    return {
      recordingUrl: result.url,
      recordingSize: fileBuffer.length,
      recordingMimeType: mimeType,
    };
  }

  /**
   * Get a (potentially time-limited) URL to stream/download a recording.
   * For public buckets this is the same as the stored URL.
   * For private S3/GCS buckets this generates a fresh pre-signed URL.
   */
  async getRecordingUrl(interviewId: string): Promise<{ url: string | null }> {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      select: { recordingUrl: true },
    });

    if (!interview?.recordingUrl) return { url: null };

    // For S3/GCS private buckets, generate a signed URL
    if (
      this.storageAdapter.getSignedUrl &&
      !interview.recordingUrl.includes('localhost')
    ) {
      const key = interview.recordingUrl.replace(
        /^.*?recordings\//,
        'recordings/',
      );
      try {
        const signedUrl = await this.storageAdapter.getSignedUrl(key, 3600);
        return { url: signedUrl };
      } catch (e) {
        this.logger.warn(`Could not generate signed URL: ${e}`);
      }
    }

    return { url: interview.recordingUrl };
  }

  async getRecordingMetadata(interviewId: string) {
    return this.prisma.interview.findUnique({
      where: { id: interviewId },
      select: {
        recordingUrl: true,
        recordingSize: true,
        recordingDuration: true,
        recordingMimeType: true,
      },
    });
  }

  async listRecordings(userId: string) {
    return this.prisma.interview.findMany({
      where: {
        recordingUrl: { not: null },
        participants: { some: { userId, role: 'INTERVIEWER' } },
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        scheduledTime: true,
        recordingUrl: true,
        recordingSize: true,
        recordingDuration: true,
        recordingMimeType: true,
        participants: {
          select: {
            role: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { scheduledTime: 'desc' },
    });
  }

  /**
   * Upload a user avatar image.
   * Overwrites any previous avatar for the same user.
   *
   * @param userId    - User UUID (used as part of the storage key)
   * @param fileBuffer - Raw bytes of the image file
   * @param mimeType  - Image MIME type (e.g. image/png, image/jpeg)
   * @returns The public URL of the uploaded avatar
   */
  async uploadAvatar(
    userId: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const ext = mimeType.split('/').pop() || 'png';
    const key = `avatars/${userId}.${ext}`;

    this.logger.log(
      `Uploading avatar for user ${userId} (${fileBuffer.length} bytes)`,
    );

    const result = await this.storageAdapter.upload(key, fileBuffer, mimeType);

    this.logger.log(`Avatar uploaded via ${result.provider}: ${result.url}`);

    return result.url;
  }

  /**
   * Delete a recording from storage and clear the DB reference.
   */
  async deleteRecording(interviewId: string): Promise<void> {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      select: { recordingUrl: true },
    });

    if (!interview?.recordingUrl) return;

    // Extract the storage key from the URL
    // For local: http://localhost:3001/recordings/key → key
    // For S3/GCS: https://bucket.../recordings/key → recordings/key
    const key = interview.recordingUrl.replace(
      /^.*?recordings\//,
      'recordings/',
    );

    try {
      await this.storageAdapter.delete(key);
      this.logger.log(`Recording deleted from storage: ${key}`);
    } catch (e) {
      this.logger.warn(`Could not delete from storage (continuing): ${e}`);
    }

    await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        recordingUrl: null,
        recordingSize: null,
        recordingDuration: null,
        recordingMimeType: null,
      },
    });
  }
}
