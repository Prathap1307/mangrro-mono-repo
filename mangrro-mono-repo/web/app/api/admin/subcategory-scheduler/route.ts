import { NextResponse } from "next/server";
import { DeleteCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

export async function GET() {
  const schedules = await dynamo.send(
    new ScanCommand({
      TableName: TABLES.SUBCATEGORY_SCHEDULE,
    })
  );
  return NextResponse.json({ data: schedules.Items ?? [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const schedule = {
      id: body.id ?? randomUUID(),
      subcategoryId: body.subcategoryId,
      timeslots: body.timeslots,
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLES.SUBCATEGORY_SCHEDULE,
        Item: schedule,
      })
    );

    return NextResponse.json(schedule);
  } catch (err) {
    console.error("POST subcategory scheduler ERROR:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (!body?.id) {
      return NextResponse.json({ error: "Missing schedule id" }, { status: 400 });
    }

    await dynamo.send(
      new DeleteCommand({
        TableName: TABLES.SUBCATEGORY_SCHEDULE,
        Key: { id: body.id },
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE subcategory scheduler ERROR:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
