import { NextResponse } from "next/server";
import { ScanCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { dynamo } from "@/lib/db/client";
import { getItemImageUrl } from "@/lib/aws/s3";
import { TABLES } from "@/lib/db/tables";

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

export async function GET() {
  const { Items } = await dynamo.send(
    new ScanCommand({ TableName: TABLES.CATEGORIES })
  );

  const now = new Date();

  const categories = await Promise.all((Items ?? []).map(async (item: any) => {
    const reactivateOn =
      typeof item.reactivateOn === "string" ? item.reactivateOn : "";
    const reactivateDate = reactivateOn ? new Date(reactivateOn) : null;
    const shouldReactivate =
      Boolean(item.active) === false &&
      reactivateDate &&
      !Number.isNaN(reactivateDate.getTime()) &&
      reactivateDate <= now;

    if (shouldReactivate && item.id) {
      await dynamo.send(
        new UpdateCommand({
          TableName: TABLES.CATEGORIES,
          Key: { id: item.id },
          UpdateExpression: "SET active = :active, reactivateOn = :reactivateOn",
          ExpressionAttributeValues: {
            ":active": true,
            ":reactivateOn": "",
          },
        })
      );
    }

    return {
      id: item.id,
      name: item.name,
      active: shouldReactivate ? true : item.active,
      categoryType:
        item.categoryType === "category" || item.categoryType === "subcategory"
          ? item.categoryType
          : "main",
      reason: item.reason,
      reactivateOn: shouldReactivate ? "" : reactivateOn,
      position: Number.isFinite(Number(item.position))
        ? Number(item.position)
        : Number.MAX_SAFE_INTEGER,
      imageKey: item.imageKey,
      imageUrl: item.imageUrl,
      searchKeywords: normalizeSearchKeywords(item.searchKeywords),
      highlightText:
        typeof item.highlightText === "string" && item.highlightText.trim().length > 0
          ? item.highlightText.trim()
          : undefined,
      parentCategoryId:
        typeof item.parentCategoryId === "string" &&
        item.parentCategoryId.trim().length > 0
          ? item.parentCategoryId.trim()
          : undefined,
    };
  }));

  const withImages = await Promise.all(
    categories.map(async (category) => {
      if (!category.imageKey) return category;
      const imageUrl = await getItemImageUrl(category.imageKey);
      return { ...category, imageUrl };
    })
  );

  return NextResponse.json({ data: withImages });
}

export async function POST(request: Request) {
  const body = await request.json();

  const id =
    body.id ||
    (body.name
      ? String(body.name).toLowerCase().replace(/\s+/g, "-")
      : randomUUID());

  const category = {
    id,
    name: body.name ?? "",
    active: body.active ?? true,
    categoryType:
      body.categoryType === "category" || body.categoryType === "subcategory"
        ? body.categoryType
        : "main",
    reason: body.reason ?? "",
    reactivateOn: body.reactivateOn ?? "",
    position: Number.isFinite(Number(body.position))
      ? Number(body.position)
      : Number.MAX_SAFE_INTEGER,
    imageKey: typeof body.imageKey === "string" ? body.imageKey.trim() : "",
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
    searchKeywords: normalizeSearchKeywords(body.searchKeywords),
    highlightText:
      typeof body.highlightText === "string" && body.highlightText.trim().length > 0
        ? body.highlightText.trim()
        : "",
    parentCategoryId:
      typeof body.parentCategoryId === "string" && body.parentCategoryId.trim().length > 0
        ? body.parentCategoryId.trim()
        : "",
  };

  await dynamo.send(
    new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: category,
    })
  );

  return NextResponse.json(category);
}
