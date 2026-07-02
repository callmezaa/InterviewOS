import * as fs from 'fs/promises';
import * as path from 'path';
import { IStorageAdapter, StorageUploadResult } from './storage.interface';

/**
 * Local disk storage adapter.
 * Saves files to the `recordings/` folder inside the backend workspace.
 * Serves files via the static file middleware (or NestJS ServeStatic).
 * Used as the default fallback when no cloud provider is configured.
 */
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly baseDir: string;
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseDir = path.join(process.cwd(), 'recordings');
    // e.g. http://localhost:3001/recordings
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async upload(
    key: string,
    buffer: Buffer,
    _mimeType: string,
  ): Promise<StorageUploadResult> {
    const filePath = path.join(this.baseDir, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    const url = `${this.baseUrl}/${key}`;
    return { url, key, provider: 'local' };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    await fs.rm(filePath, { force: true });
  }

  getSignedUrl(key: string, _expiresInSeconds = 3600): Promise<string> {
    return Promise.resolve(`${this.baseUrl}/${key}`);
  }
}
