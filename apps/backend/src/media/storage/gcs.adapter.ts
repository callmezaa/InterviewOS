import { IStorageAdapter, StorageUploadResult } from './storage.interface';

/**
 * Google Cloud Storage adapter.
 * Uses @google-cloud/storage package.
 *
 * Required env vars:
 *   GCS_BUCKET                   (bucket name)
 *   GCS_PROJECT_ID               (GCP project ID)
 *   GCS_CLIENT_EMAIL             (service account email)
 *   GCS_PRIVATE_KEY              (service account private key — include \n escapes)
 *
 * OR set GOOGLE_APPLICATION_CREDENTIALS env var to point to a key file
 * and omit the individual credential vars above.
 */
export class GcsStorageAdapter implements IStorageAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private storage: any;
  private readonly bucket: string;

  constructor(config: {
    bucket: string;
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
  }) {
    this.bucket = config.bucket;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Storage } = require('@google-cloud/storage');

      const gcsOptions: Record<string, unknown> = {};

      if (config.projectId) gcsOptions.projectId = config.projectId;

      // Use inline credentials if provided; otherwise fall back to ADC
      if (config.clientEmail && config.privateKey) {
        gcsOptions.credentials = {
          client_email: config.clientEmail,
          // Replace literal \n sequences in env var with actual newlines
          private_key: config.privateKey.replace(/\\n/g, '\n'),
        };
      }

      this.storage = new Storage(gcsOptions);
    } catch {
      throw new Error(
        'GCS SDK not installed. Run: npm install @google-cloud/storage --workspace=apps/backend',
      );
    }
  }

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<StorageUploadResult> {
    const bucket = this.storage.bucket(this.bucket);
    const file = bucket.file(key);

    await file.save(buffer, {
      metadata: { contentType: mimeType },
      resumable: false, // Use simple upload for files < 5MB; resumable for larger
    });

    // Make the file publicly readable
    await file.makePublic();

    const url = `https://storage.googleapis.com/${this.bucket}/${key}`;
    return { url, key, provider: 'gcs' };
  }

  async delete(key: string): Promise<void> {
    await this.storage
      .bucket(this.bucket)
      .file(key)
      .delete({ ignoreNotFound: true });
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const [signedUrl] = await this.storage
      .bucket(this.bucket)
      .file(key)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
      });
    return signedUrl;
  }
}
