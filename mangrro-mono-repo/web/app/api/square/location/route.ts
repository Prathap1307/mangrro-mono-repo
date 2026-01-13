import { NextResponse } from "next/server";
import { getCachedLocationId } from "@/lib/squareLocation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const locationId = await getCachedLocationId();
    return NextResponse.json({ locationId });
  } catch (error) {
    console.error("Square location lookup failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve Square location.";
    const status = message.includes("credentials were rejected") ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
