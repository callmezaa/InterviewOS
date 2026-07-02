import { ConfigService } from '@nestjs/config';
import { IStorageAdapter } from './storage.interface';
import { LocalStorageAdapter } from './local.adapter';
import { S3StorageAdapter } from './s3.adapter';
import { GcsStorageAdapter } from './gcs.adapter';

/**
 * Factory that reads STORAGE_PROVIDER from env and returns the correct adapter.
 *
 * STORAGE_PROVIDER=local  → save to ./recordings/ folder (default)
 * STORAGE_PROVIDER=s3     → upload to AWS S3
 * STORAGE_PROVIDER=gcs    → upload to Google Cloud Storage
 */
export function createStorageAdapter(config: ConfigService): IStorageAdapter {
  const provider = config.get<string>('STORAGE_PROVIDER') || 'local';

  switch (provider) {
    case 's3': {
      const accessKeyId = config.getOrThrow<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = config.getOrThrow<string>(
        'AWS_SECRET_ACCESS_KEY',
      );
      const region = config.getOrThrow<string>('AWS_REGION');
      const bucket = config.getOrThrow<string>('AWS_S3_BUCKET');
      const publicBase = config.get<string>('AWS_S3_PUBLIC_BASE');
      return new S3StorageAdapter({
        accessKeyId,
        secretAccessKey,
        region,
        bucket,
        publicBase,
      });
    }

    case 'gcs': {
      const bucket = config.getOrThrow<string>('GCS_BUCKET');
      const projectId = config.get<string>('GCS_PROJECT_ID');
      const clientEmail = config.get<string>('GCS_CLIENT_EMAIL');
      const privateKey = config.get<string>('GCS_PRIVATE_KEY');
      return new GcsStorageAdapter({
        bucket,
        projectId,
        clientEmail,
        privateKey,
      });
    }

    case 'local':
    default: {
      const baseUrl =
        config.get<string>('NEXT_PUBLIC_API_URL')?.replace('/api', '') ||
        'http://localhost:3001';
      return new LocalStorageAdapter(`${baseUrl}/recordings`);
    }
  }
}
