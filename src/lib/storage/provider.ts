import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { logger } from '@/lib/logger';

export interface StorageProvider {
    uploadFile(key: string, buffer: Uint8Array, mimeType: string): Promise<string>;
    getDownloadUrl(key: string, expiresIn?: number): Promise<string>;
    deleteFile(key: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
    private baseDir = path.join(process.cwd(), '.data', 'uploads');

    async uploadFile(key: string, buffer: Uint8Array, mimeType: string): Promise<string> {
        const absolutePath = path.join(this.baseDir, key);
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, buffer);
        logger.info({ key, mimeType }, 'storage.local.upload');
        return key;
    }

    async getDownloadUrl(key: string): Promise<string> {
        // In dev/local, we might serve via a local route or absolute path
        // For now returning the key which is interpreted by the app
        return `/api/v1/storage/local?key=${encodeURIComponent(key)}`;
    }

    async deleteFile(key: string): Promise<void> {
        const absolutePath = path.join(this.baseDir, key);
        try {
            await fs.unlink(absolutePath);
        } catch (e) {
            logger.warn({ key, error: e }, 'storage.local.delete_failed');
        }
    }
}

class S3StorageProvider implements StorageProvider {
    private client: S3Client;
    private bucket: string;

    constructor() {
        this.bucket = process.env.S3_BUCKET || 'eaf-platform';
        this.client = new S3Client({
            region: process.env.S3_REGION || 'auto',
            endpoint: process.env.S3_ENDPOINT, // Cloudflare R2 or MinIO
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
            },
        });
    }

    async uploadFile(key: string, buffer: Uint8Array, mimeType: string): Promise<string> {
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
            })
        );
        logger.info({ key, bucket: this.bucket }, 'storage.s3.upload');
        return key;
    }

    async getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return getSignedUrl(this.client, command, { expiresIn });
    }

    async deleteFile(key: string): Promise<void> {
        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            })
        );
        logger.info({ key, bucket: this.bucket }, 'storage.s3.delete');
    }
}

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
    if (provider) return provider;

    const type = process.env.STORAGE_PROVIDER || 'local';
    if (type === 's3') {
        provider = new S3StorageProvider();
    } else {
        provider = new LocalStorageProvider();
    }

    return provider;
}
