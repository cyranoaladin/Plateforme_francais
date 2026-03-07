/**
 * S3 Storage Provider — Cloudflare R2 compatible
 * Handles file uploads, signed URLs, and deletions.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@/lib/logger';

const s3Client = new S3Client({
  region: process.env.S3_REGION ?? 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for R2
});

const BUCKET = process.env.S3_BUCKET ?? 'nexus-eaf-ressources';

/**
 * Upload a file to S3/R2.
 * @param key - The object key (e.g., 'uploads/copies/user-id/file.pdf')
 * @param body - The file content as Buffer
 * @param contentType - MIME type (e.g., 'application/pdf')
 * @returns Public URL of the uploaded object
 */
export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    const publicUrl = process.env.S3_PUBLIC_URL
      ? `${process.env.S3_PUBLIC_URL}/${key}`
      : `https://${BUCKET}.r2.dev/${key}`;

    logger.info({ key, bucket: BUCKET, size: body.length }, 's3.upload.success');
    return publicUrl;
  } catch (error) {
    logger.error({ key, bucket: BUCKET, error }, 's3.upload.failed');
    throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a signed URL for private file access.
 * @param key - The object key
 * @param expiresIn - URL validity in seconds (default: 1 hour)
 * @returns Signed URL string
 */
export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  try {
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
      { expiresIn },
    );
    logger.debug({ key, expiresIn }, 's3.signed_url.generated');
    return url;
  } catch (error) {
    logger.error({ key, error }, 's3.signed_url.failed');
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from S3/R2.
 * @param key - The object key
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
    logger.info({ key }, 's3.delete.success');
  } catch (error) {
    logger.error({ key, error }, 's3.delete.failed');
    throw new Error(`Failed to delete from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a file exists in S3/R2.
 * @param key - The object key
 * @returns true if the object exists
 */
export async function s3FileExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
    return true;
  } catch (error) {
    if ((error as { name?: string })?.name === 'NotFound') {
      return false;
    }
    logger.error({ key, error }, 's3.head.failed');
    throw error;
  }
}
