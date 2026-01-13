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
        TableName: TABLES.SUBCATEGORIES,
        Key: { id },
        UpdateExpression:
          "SET #name = :name, #active = :active, #reason = :reason, #reactivateOn = :reactivateOn, #position = :position, #highlightText = :highlightText, #categoryId = :categoryId, #imageKey = :imageKey, #imageUrl = :imageUrl, #searchKeywords = :searchKeywords",
        ExpressionAttributeNames: {
          "#name": "name",
          "#active": "active",
          "#reason": "reason",
          "#reactivateOn": "reactivateOn",
          "#position": "position",
          "#highlightText": "highlightText",
          "#categoryId": "categoryId",
          "#imageKey": "imageKey",
          "#imageUrl": "imageUrl",
          "#searchKeywords": "searchKeywords",
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
          ":categoryId":
            typeof body.parentCategoryId === "string"
              ? body.parentCategoryId.trim()
              : typeof body.categoryId === "string"
                ? body.categoryId.trim()
                : "",
          ":imageKey": typeof body.imageKey === "string" ? body.imageKey.trim() : "",
          ":imageUrl": typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
          ":searchKeywords": Array.isArray(body.searchKeywords)
            ? body.searchKeywords
                .map((keyword: string) => keyword.trim())
                .filter(Boolean)
                .slice(0, 20)
            : [],
        },
      })
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update subcategory", error);
    return NextResponse.json(
      { error: "Failed to update subcategory" },
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
        TableName: TABLES.SUBCATEGORIES,
        Key: { id },
      })
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete subcategory", error);
    return NextResponse.json(
      { error: "Failed to delete subcategory" },
      { status: 500 }
    );
  }
}
