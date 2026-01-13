import { NextResponse } from "next/server";
import { createSurcharge, getSurcharges } from "@/lib/db/surcharge";

export async function GET() {
  const rules = await getSurcharges();
  return NextResponse.json({ data: rules });
}

export async function POST(request: Request) {
  const body = await request.json();
  const saved = await createSurcharge(body);
  return NextResponse.json({ ok: true, data: saved });
}
