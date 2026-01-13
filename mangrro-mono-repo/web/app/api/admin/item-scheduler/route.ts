import { NextRequest, NextResponse } from "next/server";
import {
  createItemSchedule,
  deleteItemSchedule,
  getItemSchedules,
} from "@/lib/db/schedules";

export async function GET() {
  const schedules = await getItemSchedules();
  return NextResponse.json({ data: schedules });
}

// Create or upsert schedule for an item
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Expect: { id?, itemId, timeslots }
  const schedule = await  createItemSchedule({
    id: body.id,
    scheduleId: body.scheduleId,
    itemId: body.itemId,
    timeslots: body.timeslots,
  });

  return NextResponse.json({ data: schedule });
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.id) {
      return NextResponse.json({ error: "Missing schedule id" }, { status: 400 });
    }

    await deleteItemSchedule(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE item scheduler ERROR:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
