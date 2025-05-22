import AWS from 'aws-sdk';
import type { IStorageService } from './storage.type';

export class S3StorageService implements IStorageService {
  private s3: AWS.S3;
  private bucket: string;

  constructor(
    endpoint: string,
    accessKey: string,
    secretKey: string,
    bucket: string,
  ) {
    this.s3 = new AWS.S3({
      endpoint: endpoint,
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      s3ForcePathStyle: true, // Required for MinIO
      signatureVersion: 'v4',
    });
    this.bucket = bucket;
  }

  async uploadFile(key: string, file: Buffer): Promise<void> {
    try {
      await this.s3
        .upload({
          Bucket: this.bucket,
          Key: key,
          Body: file,
        })
        .promise();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error uploading file to S3: ${error.message}`);
      } else {
        console.error(`Error uploading file to S3: ${String(error)}`);
      }
      throw error;
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const data = await this.s3
        .getObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
      return data.Body as Buffer;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error downloading file from S3: ${error.message}`);
      } else {
        console.error(`Error downloading file from S3: ${String(error)}`);
      }
      throw error;
    }
  }
}
