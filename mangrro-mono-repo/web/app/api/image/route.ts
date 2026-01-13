import { NextResponse } from "next/server";
import { getItemImageUrl } from "@/lib/aws/s3";

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  // Signed S3 URL
  const signedUrl = await getItemImageUrl(key);

  if (!signedUrl) {
    return NextResponse.json(
      { error: "Could not generate signed image URL" },
      { status: 404 }
    );
  }

  // 👇 Return redirect directly to S3 file
  return NextResponse.redirect(signedUrl);
}
