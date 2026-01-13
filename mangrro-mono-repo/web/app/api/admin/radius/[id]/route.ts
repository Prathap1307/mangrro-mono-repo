import { NextRequest, NextResponse } from "next/server";
import { deleteRadiusZone, updateRadiusZone } from "@/lib/db/radius";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  await updateRadiusZone({ ...body, radiusId: id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteRadiusZone(id);
  return NextResponse.json({ ok: true });
}
