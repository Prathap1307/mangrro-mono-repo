import { NextResponse } from "next/server";
import { DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    await dynamo.send(
      new UpdateCommand({
        TableName: TABLES.MAIN_CATEGORIES,
        Key: { id },
        UpdateExpression:
          "SET #name = :name, #active = :active, #reason = :reason, #reactivateOn = :reactivateOn, #position = :position, #highlightText = :highlightText",
        ExpressionAttributeNames: {
          "#name": "name",
          "#active": "active",
          "#reason": "reason",
          "#reactivateOn": "reactivateOn",
          "#position": "position",
          "#highlightText": "highlightText",
        },
        ExpressionAttributeValues: {
          ":name": body.name,
          ":active": Boolean(body.active ?? true),
          ":reason": body.reason ?? "",
          ":reactivateOn": body.reactivateOn ?? "",
          ":position": Number.isFinite(Number(body.position))
            ? Number(body.position)
            : Number.MAX_SAFE_INTEGER,
          ":highlightText":
            typeof body.highlightText === "string" && body.highlightText.trim().length > 0
              ? body.highlightText.trim()
              : "",
        },
      })
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update main category", error);
    return NextResponse.json(
      { error: "Failed to update main category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await dynamo.send(
      new DeleteCommand({
        TableName: TABLES.MAIN_CATEGORIES,
        Key: { id },
      })
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete main category", error);
    return NextResponse.json(
      { error: "Failed to delete main category" },
      { status: 500 }
    );
  }
}
