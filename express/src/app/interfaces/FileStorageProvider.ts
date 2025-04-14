/**
 * Interface for cloud storage operations
 */
export interface FileStorageProvider {
  /**
   * Upload a file to storage
   * @param file File buffer or stream
   * @param path Destination path/key
   * @param options Additional upload options
   * @returns Public URL of the uploaded file
   */
  uploadFile(
    file: Buffer | NodeJS.ReadableStream,
    path: string,
    options?: Record<string, any>
  ): Promise<string>;
  
  /**
   * Delete a file from storage
   * @param path Path/key of the file to delete
   * @returns Success status
   */
  deleteFile(path: string): Promise<boolean>;
  
  /**
   * Get a file from storage
   * @param path Path/key of the file
   * @returns File buffer or stream
   */
  getFile(path: string): Promise<Buffer>;
  
  /**
   * Get a signed URL for temporary access
   * @param path Path/key of the file
   * @param expiresIn Expiration time in seconds
   * @returns Signed URL
   */
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;
} 