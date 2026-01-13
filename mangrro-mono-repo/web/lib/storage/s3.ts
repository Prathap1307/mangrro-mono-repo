import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/aws/client";

export async function uploadImage(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
}
