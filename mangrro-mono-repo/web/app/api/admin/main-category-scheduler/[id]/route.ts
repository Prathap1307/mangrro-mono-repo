import { NextRequest, NextResponse } from "next/server";
import {
  DeleteCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLES.MAIN_CATEGORY_SCHEDULE,
      Key: { id },
    })
  );
  return NextResponse.json(result.Item ?? {});
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.MAIN_CATEGORY_SCHEDULE,
      Key: { id },
      UpdateExpression: "SET timeslots = :t, mainCategoryId = :m",
      ExpressionAttributeValues: {
        ":t": body.timeslots,
        ":m": body.mainCategoryId,
      },
    })
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await dynamo.send(
    new DeleteCommand({
      TableName: TABLES.MAIN_CATEGORY_SCHEDULE,
      Key: { id },
    })
  );
  return NextResponse.json({ ok: true });
}
