import { NextRequest, NextResponse } from "next/server";
import { deleteRule, updateRule } from "@/lib/db/deliveryCharges";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  await updateRule({ ...body, id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteRule(id);
  return NextResponse.json({ ok: true });
}
