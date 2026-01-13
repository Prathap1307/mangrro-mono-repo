import { NextResponse } from "next/server";
import { createRadiusZone, getAllRadiusZones } from "@/lib/db/radius";

export async function GET() {
  const zones = await getAllRadiusZones();
  return NextResponse.json({ data: zones });
}

export async function POST(request: Request) {
  const body = await request.json();
  const saved = await createRadiusZone(body);
  return NextResponse.json({ ok: true, data: saved });
}
