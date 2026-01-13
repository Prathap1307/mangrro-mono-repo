import { NextRequest, NextResponse } from "next/server";
import { updateCategorySchedule, deleteCategorySchedule, getCategorySchedules } from "@/lib/db/schedules";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const all = await getCategorySchedules();
  const schedule = all.find(s => s.id === id);
  return NextResponse.json(schedule ?? {});
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  await updateCategorySchedule({ ...body, id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteCategorySchedule(id);
  return NextResponse.json({ ok: true });
}
