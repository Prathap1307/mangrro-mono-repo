import { NextResponse } from "next/server";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

export const dynamic = "force-dynamic";

function fromDynamo(item: any) {
  return {
    id: item.id?.S ?? item.id,
    mainCategoryId: item.mainCategoryId?.S ?? item.mainCategoryId,
    timeslots: item.timeslots?.M
      ? Object.fromEntries(
          Object.entries(
            item.timeslots.M as Record<string, { M?: Record<string, { S?: string }> }>
          ).map(([day, slotObj]) => {
            const m = slotObj.M ?? {};
            return [
              day,
              {
                slot1Start: m.slot1Start?.S,
                slot1End: m.slot1End?.S,
                slot2Start: m.slot2Start?.S,
                slot2End: m.slot2End?.S,
              },
            ];
          })
        )
      : item.timeslots ?? {},
  };
}

export async function GET() {
  try {
    const { Items } = await dynamo.send(
      new ScanCommand({
        TableName: TABLES.MAIN_CATEGORY_SCHEDULE,
      })
    );

    const data = Array.isArray(Items) ? Items.map(fromDynamo) : [];
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch main category schedules", err);
    return NextResponse.json(
      { error: "Failed to fetch main category schedules" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const schedule = {
      id: body.id ?? randomUUID(),
      mainCategoryId: body.mainCategoryId,
      timeslots: body.timeslots,
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLES.MAIN_CATEGORY_SCHEDULE,
        Item: schedule,
      })
    );

    return NextResponse.json(schedule, { status: 201 });
  } catch (err) {
    console.error("Failed to create main category schedule", err);
    return NextResponse.json(
      { error: "Failed to create main category schedule" },
      { status: 500 }
    );
  }
}
