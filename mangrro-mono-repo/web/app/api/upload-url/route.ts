import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;

const client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const fileName = searchParams.get("file");
  const fileType = searchParams.get("type");
  const oldKey = searchParams.get("oldKey"); // 👈 SUPPORT OLD IMAGE DELETE

  if (!fileName || !fileType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Delete old image if exists
  if (oldKey) {
    await client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: oldKey,
      })
    );
  }

  const key = `items/${Date.now()}-${encodeURIComponent(fileName)}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });

  return NextResponse.json({ uploadUrl, key });
}
