import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AppConfig } from '../config/database.config';

export type UploadParams = {
  buffer: Buffer;
  mimeType: string;
  key?: string; // optional explicit key or 'folder/filename.ext'
  folder?: string; // optional folder to prefix key
  filename?: string; // optional filename to construct key
};

const s3 = new S3Client({
  region: AppConfig.S3.REGION,
  credentials: {
    accessKeyId: AppConfig.S3.ACCESS_KEY_ID,
    secretAccessKey: AppConfig.S3.SECRET_ACCESS_KEY,
  },
});

function buildObjectKey(params: UploadParams): string {
  if (params.key) return params.key;
  const safeFolder = (params.folder || '').replace(/^\/+|\/+$/g, '');
  const safeFilename = (params.filename || `${Date.now()}`).replace(/^\/+/, '');
  return safeFolder ? `${safeFolder}/${safeFilename}` : safeFilename;
}

export async function uploadToS3(params: UploadParams): Promise<string> {
  const Key = buildObjectKey(params);
  const Bucket = AppConfig.S3.BUCKET;

  await s3.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body: params.buffer,
      ContentType: params.mimeType,
    }),
  );

  // Public URL using S3 regional endpoint
  return `https://s3.${AppConfig.S3.REGION}.amazonaws.com/${Bucket}/${Key}`;
  // return `https://${Bucket}.s3.${AppConfig.S3.REGION}.amazonaws.com/${Key}`;
}
