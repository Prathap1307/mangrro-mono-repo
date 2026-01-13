import { NextRequest, NextResponse } from "next/server";
import { deleteSurcharge, updateSurcharge } from "@/lib/db/surcharge";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  await updateSurcharge({ ...body, id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteSurcharge(id);
  return NextResponse.json({ ok: true });
}
