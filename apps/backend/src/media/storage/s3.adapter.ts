import { IStorageAdapter, StorageUploadResult } from './storage.interface';

/**
 * AWS S3 storage adapter.
 * Uses @aws-sdk/client-s3 and @aws-sdk/lib-storage for multipart upload.
 *
 * Required env vars:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION          (e.g. ap-southeast-1)
 *   AWS_S3_BUCKET       (bucket name)
 *   AWS_S3_PUBLIC_BASE  (optional — public base URL if bucket is public)
 */
export class S3StorageAdapter implements IStorageAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private s3Client: any;
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicBase: string;

  constructor(config: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    publicBase?: string;
  }) {
    this.bucket = config.bucket;
    this.region = config.region;
    this.publicBase =
      config.publicBase ||
      `https://${config.bucket}.s3.${config.region}.amazonaws.com`;

    // Lazy-load the AWS SDK to avoid crash if package is not installed
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { S3Client } = require('@aws-sdk/client-s3');
      this.s3Client = new S3Client({
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
    } catch {
      throw new Error(
        'AWS SDK not installed. Run: npm install @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner --workspace=apps/backend',
      );
    }
  }

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<StorageUploadResult> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Upload } = require('@aws-sdk/lib-storage');

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // Remove ACL: 'public-read' for private buckets; use signed URLs instead
      },
      queueSize: 4, // concurrent multipart upload parts
      partSize: 5 * 1024 * 1024, // 5 MB parts (S3 minimum)
    });

    await upload.done();
    const url = `${this.publicBase}/${key}`;
    return { url, key, provider: 's3' };
  }

  async delete(key: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    return getSignedUrl(
      this.s3Client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }
}
