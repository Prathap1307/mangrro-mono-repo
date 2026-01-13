import { NextResponse } from "next/server";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

export const dynamic = "force-dynamic";

function fromDynamo(item: any) {
  const rawTimeslots = item.timeslots?.M ? item.timeslots.M : item.timeslots;
  return {
    id: item.id?.S ?? item.id,
    subcategoryId: item.subcategoryId?.S ?? item.subcategoryId,
    timeslots: rawTimeslots
      ? Object.fromEntries(
          Object.entries(
            rawTimeslots as Record<string, { M?: Record<string, { S?: string }> }>
          ).map(([day, slotObj]) => {
            if (!slotObj || typeof slotObj !== "object") return [day, slotObj];
            const m = "M" in slotObj ? slotObj.M ?? {} : slotObj;
            return [
              day,
              {
                slot1Start: m.slot1Start?.S ?? m.slot1Start,
                slot1End: m.slot1End?.S ?? m.slot1End,
                slot2Start: m.slot2Start?.S ?? m.slot2Start,
                slot2End: m.slot2End?.S ?? m.slot2End,
              },
            ];
          })
        )
      : {},
  };
}

export async function GET() {
  try {
    const { Items } = await dynamo.send(
      new ScanCommand({
        TableName: TABLES.SUBCATEGORY_SCHEDULE,
      })
    );

    const data = Array.isArray(Items) ? Items.map(fromDynamo) : [];
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch subcategory schedules", err);
    return NextResponse.json(
      { error: "Failed to fetch subcategory schedules" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

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

    return NextResponse.json(schedule, { status: 201 });
  } catch (err) {
    console.error("Failed to create subcategory schedule", err);
    return NextResponse.json(
      { error: "Failed to create subcategory schedule" },
      { status: 500 }
    );
  }
}
