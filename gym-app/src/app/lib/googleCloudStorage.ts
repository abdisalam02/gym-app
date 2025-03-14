import { Storage } from '@google-cloud/storage';

// This file will be used to interact with Google Cloud Storage
// You'll need to provide your own credentials and bucket information

// Interface for the configuration
interface CloudStorageConfig {
  projectId: string;
  keyFilename: string;
  bucketName: string;
}

// Default configuration - replace with your own values
const defaultConfig: CloudStorageConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || '',
  bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME || 'gym-app-images',
};

// Initialize storage
let storage: Storage | null = null;

/**
 * Initialize the Google Cloud Storage client
 * @param config Optional configuration to override defaults
 * @returns Storage instance
 */
export function initStorage(config: Partial<CloudStorageConfig> = {}): Storage {
  if (storage) return storage;

  const finalConfig = { ...defaultConfig, ...config };
  
  // Validate configuration
  if (!finalConfig.projectId || !finalConfig.keyFilename) {
    throw new Error('Missing Google Cloud Storage configuration. Please set environment variables or provide config.');
  }

  storage = new Storage({
    projectId: finalConfig.projectId,
    keyFilename: finalConfig.keyFilename,
  });

  return storage;
}

/**
 * Upload a file to Google Cloud Storage
 * @param file File to upload
 * @param destination Path in the bucket where the file should be stored
 * @param config Optional configuration to override defaults
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
  file: File | Buffer,
  destination: string,
  config: Partial<CloudStorageConfig> = {}
): Promise<string> {
  const finalConfig = { ...defaultConfig, ...config };
  const storage = initStorage(finalConfig);
  const bucket = storage.bucket(finalConfig.bucketName);
  
  // Create a file object in the bucket
  const blob = bucket.file(destination);
  
  // If file is a File object (from browser)
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await blob.save(buffer, {
      contentType: file.type,
      metadata: {
        contentType: file.type,
      },
    });
  } else {
    // If file is already a Buffer
    await blob.save(file);
  }
  
  // Make the file publicly accessible
  await blob.makePublic();
  
  // Return the public URL
  return `https://storage.googleapis.com/${finalConfig.bucketName}/${destination}`;
}

/**
 * Delete a file from Google Cloud Storage
 * @param filePath Path of the file in the bucket
 * @param config Optional configuration to override defaults
 */
export async function deleteFile(
  filePath: string,
  config: Partial<CloudStorageConfig> = {}
): Promise<void> {
  const finalConfig = { ...defaultConfig, ...config };
  const storage = initStorage(finalConfig);
  const bucket = storage.bucket(finalConfig.bucketName);
  
  // Delete the file
  await bucket.file(filePath).delete();
}

/**
 * Get a signed URL for a file (for temporary access)
 * @param filePath Path of the file in the bucket
 * @param expiresInMinutes How long the URL should be valid (in minutes)
 * @param config Optional configuration to override defaults
 * @returns Signed URL for the file
 */
export async function getSignedUrl(
  filePath: string,
  expiresInMinutes: number = 60,
  config: Partial<CloudStorageConfig> = {}
): Promise<string> {
  const finalConfig = { ...defaultConfig, ...config };
  const storage = initStorage(finalConfig);
  const bucket = storage.bucket(finalConfig.bucketName);
  
  const options = {
    version: 'v4' as const,
    action: 'read' as const,
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  };
  
  // Get a signed URL for the file
  const [url] = await bucket.file(filePath).getSignedUrl(options);
  return url;
}

/**
 * Get the public URL for a file
 * @param filePath Path of the file in the bucket
 * @param config Optional configuration to override defaults
 * @returns Public URL for the file
 */
export function getPublicUrl(
  filePath: string,
  config: Partial<CloudStorageConfig> = {}
): string {
  const finalConfig = { ...defaultConfig, ...config };
  return `https://storage.googleapis.com/${finalConfig.bucketName}/${filePath}`;
} 