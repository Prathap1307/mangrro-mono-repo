import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;

const client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn: 60 });

    return NextResponse.redirect(signedUrl);
  } catch (err) {
    console.error("[IMAGE PROXY ERROR]", err);
    return NextResponse.redirect("/placeholder.webp");
  }
}
