import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import R2FileStorage from '../app/services/R2FileStorage.js';
import { S3Client } from '@aws-sdk/client-s3';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Log R2 configuration without secrets
function logR2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  
  console.log('R2 Configuration:');
  console.log(`- Account ID: ${accountId}`);
  console.log(`- Bucket Name: ${bucketName}`);
  console.log(`- Public URL: ${publicUrl}`);
  console.log(`- API Endpoint: https://${accountId}.r2.cloudflarestorage.com`);
  
  // Check if keys are provided (without revealing them)
  console.log(`- Access Key Provided: ${process.env.R2_ACCESS_KEY_ID ? 'Yes' : 'No'}`);
  console.log(`- Secret Key Provided: ${process.env.R2_SECRET_ACCESS_KEY ? 'Yes' : 'No'}`);
}

// Modified R2FileStorage for debugging
class DebugR2FileStorage extends R2FileStorage {
  constructor() {
    super();
    console.log('\nDebug: R2FileStorage initialized');
    
    // Get internal configuration
    const client = this['client'] as S3Client; 
    const bucket = this['bucket'] as string;
    
    console.log(`Debug: Using bucket "${bucket}"`);
    console.log(`Debug: Endpoint config: ${JSON.stringify(client.config.endpoint)}`);
  }
  
  async uploadFile(file: Buffer | Readable, path: string): Promise<string> {
    console.log(`\nDebug: Attempting to upload to bucket "${this['bucket']}" with key "${path}"`);
    try {
      const result = await super.uploadFile(file, path);
      console.log(`Debug: Upload succeeded, returning URL: ${result}`);
      return result;
    } catch (error) {
      console.error('Debug: Upload failed with error:', error);
      throw error;
    }
  }
}

async function testR2Connection() {
  try {
    console.log('Testing R2 connection...');
    
    // Log configuration first
    logR2Config();
    
    // Use debug version of storage
    const storage = new DebugR2FileStorage();
    
    // Generate a test file
    const testContent = Buffer.from('Test file ' + new Date().toISOString());
    const testPath = `test-${Date.now()}.txt`;
    
    console.log(`\nUploading test file ${testPath}...`);
    const url = await storage.uploadFile(testContent, testPath);
    
    console.log('\nUpload successful!');
    console.log('File URL:', url);
    
    console.log('\nConnection test successful!');
  } catch (error) {
    console.error('\nR2 connection test failed:', error);
  }
}

testR2Connection().catch(console.error); 