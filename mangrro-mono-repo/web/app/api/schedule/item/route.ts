import { NextResponse } from "next/server";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

export const dynamic = "force-dynamic";

// Convert DynamoDB → clean JSON
function fromDynamo(item: any) {
  const timeslots: Record<string, { start?: string; end?: string }[]> = {};

  const rawTimeslots = item.timeslots?.M ? item.timeslots.M : item.timeslots;
  if (rawTimeslots) {
    for (const [day, list] of Object.entries(
      rawTimeslots as Record<
        string,
        | { L?: Array<{ M?: { start?: { S?: string }; end?: { S?: string } } }> }
        | Array<{ start?: string; end?: string }>
      >
    )) {
      const slots = Array.isArray(list) ? list : list.L ?? [];
      timeslots[day] = slots.map((s: any) => ({
        start: s?.M?.start?.S ?? s?.start,
        end: s?.M?.end?.S ?? s?.end,
      }));
    }
  }

  return {
    id: item.id?.S ?? item.id,
    itemId: item.itemId?.S ?? item.itemId,
    timeslots,
  };
}

export async function GET() {
  try {
    const { Items } = await dynamo.send(
      new ScanCommand({
        TableName: TABLES.ITEM_SCHEDULE,
      })
    );

    const data = Array.isArray(Items) ? Items.map(fromDynamo) : [];
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch item schedules", err);
    return NextResponse.json(
      { error: "Failed to fetch item schedules" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const schedule = {
      id: body.id ?? randomUUID(),
      itemId: body.itemId,
      timeslots: body.timeslots,
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLES.ITEM_SCHEDULE,
        Item: schedule,
      })
    );

    return NextResponse.json(schedule, { status: 201 });
  } catch (err) {
    console.error("Failed to create item schedule", err);
    return NextResponse.json(
      { error: "Failed to create item schedule" },
      { status: 500 }
    );
  }
}
