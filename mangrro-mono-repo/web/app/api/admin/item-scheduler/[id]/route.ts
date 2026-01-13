import { NextRequest, NextResponse } from "next/server";
import {
  deleteItemSchedule,
  getItemScheduleById,
  updateItemSchedule,
} from "@/lib/db/schedules";

interface Params {
  params: Promise<{ id: string }>;
}

// GET single schedule by id
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const schedule = await getItemScheduleById(id);
  return NextResponse.json({ data: schedule ?? null });
}

// Update existing schedule by id (Key: { id })
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  await updateItemSchedule({
    id,
    timeslots: body.timeslots,
    itemId: body.itemId,
    categoryId: body.categoryId,
  });

  return NextResponse.json({ ok: true });
}

// Delete by id
export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  await deleteItemSchedule(id);
  return NextResponse.json({ ok: true });
}
