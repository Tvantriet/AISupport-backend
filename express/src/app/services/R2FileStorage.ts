import { FileStorageProvider } from "../interfaces/FileStorageProvider.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

/**
 * Cloudflare R2 implementation of the FileStorageProvider interface
 */
export default class R2FileStorage implements FileStorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;
  
  constructor() {
    // Get configuration from environment variables
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.bucket = process.env.R2_BUCKET_NAME || '';
    this.publicUrl = process.env.R2_PUBLIC_URL || '';
    
    console.log(`Initializing R2 client with account ID: ${accountId}`);
    console.log(`Using bucket: ${this.bucket}`);
    console.log(`Public URL: ${this.publicUrl}`);
    
    // Create S3 client configured for R2
    this.client = new S3Client({
      region: 'weur',
      endpoint: `https://${accountId}.eu.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true
    });
  }
  
  /**
   * Upload a file to R2 storage
   * @param file File to upload (Buffer or stream)
   * @param path Path/key for the file in storage
   * @returns Public URL of the uploaded file
   */
  public async uploadFile(file: Buffer | Readable, path: string): Promise<string> {
    try {
      // Convert stream to buffer if needed
      const fileBuffer = Buffer.isBuffer(file) ? file : await this.streamToBuffer(file);
      
      // Determine content type based on file extension
      const contentType = this.getContentType(path);
      
      // Create a random filename if none provided
      const filePath = path || `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        Body: fileBuffer,
        ContentType: contentType,
      });
      
      console.log(`Uploading to R2: bucket=${this.bucket}, key=${filePath}`);
      await this.client.send(command);
      
      // Return the public URL
      return `${this.publicUrl}/${filePath}`;
    } catch (error) {
      console.error('Error uploading file to R2:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
  
  /**
   * Delete a file from R2 storage
   * @param path Path/key of the file to delete
   * @returns True if deletion was successful
   */
  public async deleteFile(path: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting file from R2:', error);
      return false;
    }
  }
  
  /**
   * Get a file from R2 storage
   * @param path Path/key of the file to get
   * @returns File buffer
   */
  public async getFile(path: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });
      
      const response = await this.client.send(command);
      const stream = response.Body as Readable;
      
      return this.streamToBuffer(stream);
    } catch (error) {
      console.error('Error getting file from R2:', error);
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }
  
  /**
   * Get a signed URL for temporary access to a file
   * @param path Path/key of the file
   * @param expiresIn Expiration time in seconds (default: 1 hour)
   * @returns Signed URL
   */
  public async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });
      
      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error('Error creating signed URL:', error);
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }
  }
  
  /**
   * Convert a readable stream to a buffer
   * @param stream Readable stream
   * @returns Promise resolving to a buffer
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      
      stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
  
  /**
   * Get the MIME type based on file extension
   * @param filename Filename with extension
   * @returns MIME type
   */
  private getContentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'zip': 'application/zip',
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }
} 