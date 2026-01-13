// lib/aws/s3.ts
import { 
  S3Client, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  type S3ClientConfig 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getClient() {
  const config: S3ClientConfig = { region: process.env.AWS_REGION };
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }
  return new S3Client(config);
}

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

export async function getItemImageUrl(key: string) {
  if (!BUCKET) return undefined;
  const client = getClient();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn: 60 * 15 });
}

export async function deleteItemImage(key: string) {
  if (!BUCKET) return;
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
