import { NextResponse } from "next/server";
import { UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "@/lib/db/client";

const TABLE = "Categories";

const normalizeSearchKeywords = (input: unknown) => {
  const keywords = Array.isArray(input)
    ? input
    : typeof input === "string"
    ? input.split(",")
    : [];

  return keywords
    .map((keyword) => String(keyword).trim())
    .filter(Boolean)
    .slice(0, 20);
};

// Must unwrap params in Next.js 16
export async function PUT(request: Request, context: any) {
  const params = await context.params;
  const id = params.id;

  const body = await request.json();

  const update = new UpdateCommand({
    TableName: TABLE,
    Key: { id }, // FIXED
    UpdateExpression:
      "SET #name = :name, #active = :active, #categoryType = :categoryType, #reason = :reason, #reactivateOn = :reactivateOn, #position = :position, #highlightText = :highlightText, #parentCategoryId = :parentCategoryId, #imageKey = :imageKey, #imageUrl = :imageUrl, #searchKeywords = :searchKeywords",
    ExpressionAttributeNames: {
      "#name": "name",
      "#active": "active",
      "#categoryType": "categoryType",
      "#reason": "reason",
      "#reactivateOn": "reactivateOn",
      "#position": "position",
      "#highlightText": "highlightText",
      "#parentCategoryId": "parentCategoryId",
      "#imageKey": "imageKey",
      "#imageUrl": "imageUrl",
      "#searchKeywords": "searchKeywords",
    },
    ExpressionAttributeValues: {
      ":name": body.name,
      ":active": body.active,
      ":categoryType":
        body.categoryType === "category" || body.categoryType === "subcategory"
          ? body.categoryType
          : "main",
      ":reason": body.reason ?? "",
      ":reactivateOn": body.reactivateOn ?? "",
      ":position": Number.isFinite(Number(body.position))
        ? Number(body.position)
        : Number.MAX_SAFE_INTEGER,
      ":imageKey": typeof body.imageKey === "string" ? body.imageKey.trim() : "",
      ":imageUrl": typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
      ":searchKeywords": normalizeSearchKeywords(body.searchKeywords),
      ":highlightText":
        typeof body.highlightText === "string" && body.highlightText.trim().length > 0
          ? body.highlightText.trim()
          : "",
      ":parentCategoryId":
        typeof body.parentCategoryId === "string" && body.parentCategoryId.trim().length > 0
          ? body.parentCategoryId.trim()
          : "",
    },
  });

  await dynamo.send(update);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const id = params.id;

  await dynamo.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { id }, // FIXED
    })
  );

  return NextResponse.json({ ok: true });
}
