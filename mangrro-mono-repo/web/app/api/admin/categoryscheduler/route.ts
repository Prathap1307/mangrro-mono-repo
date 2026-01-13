import { NextResponse } from "next/server";
import {
  createCategorySchedule,
  deleteCategorySchedule,
  getCategorySchedules,
} from "@/lib/db/schedules";

export async function GET() {
  const schedules = await getCategorySchedules();
  return NextResponse.json({ data: schedules });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const saved = await createCategorySchedule(body);
    return NextResponse.json(saved);
  } catch (err) {
    console.error("POST category scheduler ERROR:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (!body?.id) {
      return NextResponse.json({ error: "Missing schedule id" }, { status: 400 });
    }

    await deleteCategorySchedule(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE category scheduler ERROR:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
