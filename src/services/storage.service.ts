import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { storageConfig } from "@/config/storage";
import { logger } from "@/config/logger";
import { NotFoundError } from "@/shared/errors/app-error";

export class StorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const config: S3ClientConfig = {
      region: storageConfig.region,
      credentials: {
        accessKeyId: storageConfig.accessKeyId,
        secretAccessKey: storageConfig.secretAccessKey,
      },
    };

    if (storageConfig.endpoint) {
      config.endpoint = storageConfig.endpoint;
      config.forcePathStyle = storageConfig.forcePathStyle;
    }

    this.client = new S3Client(config);
    this.bucket = storageConfig.bucket;
  }

  async upload(
    key: string,
    body: Buffer,
    contentType: string
  ): Promise<{ key: string; etag?: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    try {
      const result = await this.client.send(command);
      logger.info(`File uploaded to storage`, { key, bucket: this.bucket });
      return { key, etag: result.ETag };
    } catch (error) {
      logger.error(`Storage upload failed`, { key, error });
      throw error;
    }
  }

  async download(key: string): Promise<{ body: Buffer; contentType: string }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const result = await this.client.send(command);
      const body = await result.Body!.transformToByteArray();
      return {
        body: Buffer.from(body),
        contentType: result.ContentType || "application/octet-stream",
      };
    } catch (error) {
      if ((error as Error).name === "NoSuchKey") {
        throw new NotFoundError(`File not found: ${key}`);
      }
      logger.error(`Storage download failed`, { key, error });
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.client.send(command);
      logger.info(`File deleted from storage`, { key, bucket: this.bucket });
    } catch (error) {
      logger.error(`Storage delete failed`, { key, error });
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn = storageConfig.signedUrlExpires): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error(`Signed URL generation failed`, { key, error });
      throw error;
    }
  }

  async healthCheck(): Promise<{ ok: boolean; bucket: string; endpoint: string }> {
    try {
      const command = new HeadBucketCommand({ Bucket: this.bucket });
      await this.client.send(command);
      return { ok: true, bucket: this.bucket, endpoint: storageConfig.endpoint || "aws" };
    } catch (error) {
      logger.error(`Storage health check failed`, { error });
      return { ok: false, bucket: this.bucket, endpoint: storageConfig.endpoint || "aws" };
    }
  }
}

export default StorageService;
