import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextRequest, NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { Schedule } from "@/types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const schedule = (await request.json()) as Schedule;

    await dynamo.send(
      new UpdateCommand({
        TableName: TABLES.ITEMS,
        Key: { itemId: id },
        UpdateExpression: "SET #schedule = :schedule",
        ExpressionAttributeNames: {
          "#schedule": "schedule",
        },
        ExpressionAttributeValues: {
          ":schedule": schedule,
        },
      })
    );

    return NextResponse.json({ itemId: id, schedule });
  } catch (error) {
    console.error("Failed to update item schedule", error);
    return NextResponse.json(
      { error: "Failed to update item schedule" },
      { status: 500 }
    );
  }
}
