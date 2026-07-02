export interface StorageUploadResult {
  /** Public or pre-signed URL to access the recording */
  url: string;
  /** Storage key / path (bucket key for S3/GCS, file path for local) */
  key: string;
  /** Storage provider that was used */
  provider: 'local' | 's3' | 'gcs';
}

export interface IStorageAdapter {
  /**
   * Upload a file buffer to storage.
   * @param key - Destination path / object key (e.g. `recordings/abc123/final.webm`)
   * @param buffer - File content as Buffer
   * @param mimeType - MIME type (e.g. `video/webm`)
   */
  upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<StorageUploadResult>;

  /**
   * Delete a file from storage.
   * @param key - The object key returned by upload()
   */
  delete(key: string): Promise<void>;

  /**
   * Get a temporary pre-signed URL for private files (optional).
   * Returns the permanent URL for public files.
   */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
