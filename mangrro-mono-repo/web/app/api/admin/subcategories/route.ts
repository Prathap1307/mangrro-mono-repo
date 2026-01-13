import { NextResponse } from "next/server";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { getItemImageUrl } from "@/lib/aws/s3";

export async function GET() {
  const response = await dynamo.send(
    new ScanCommand({
      TableName: TABLES.SUBCATEGORIES,
    })
  );

  const data = (response.Items ?? []).map((item: any) => ({
    id: item.id ?? item.subcategoryId ?? "",
    name: item.name ?? "",
    active: Boolean(item.active ?? true),
    reason: item.reason ?? "",
    reactivateOn: item.reactivateOn ?? "",
    position: Number.isFinite(Number(item.position))
      ? Number(item.position)
      : Number.MAX_SAFE_INTEGER,
    highlightText:
      typeof item.highlightText === "string" && item.highlightText.trim().length > 0
        ? item.highlightText.trim()
        : undefined,
    parentCategoryId:
      typeof item.categoryId === "string" && item.categoryId.trim().length > 0
        ? item.categoryId.trim()
        : "",
    imageUrl:
      typeof item.imageUrl === "string" && item.imageUrl.trim().length > 0
        ? item.imageUrl.trim()
        : undefined,
    imageKey:
      typeof item.imageKey === "string" && item.imageKey.trim().length > 0
        ? item.imageKey.trim()
        : undefined,
    categoryType: "subcategory",
  }));

  const withImages = await Promise.all(
    data.map(async (subcategory) => {
      if (!subcategory.imageKey) return subcategory;
      const imageUrl = await getItemImageUrl(subcategory.imageKey);
      return { ...subcategory, imageUrl };
    })
  );

  return NextResponse.json({ data: withImages });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const subcategory = {
      id: body.id ?? body.subcategoryId ?? randomUUID(),
      name: body.name,
      active: Boolean(body.active ?? true),
      reason: body.reason ?? "",
      reactivateOn: body.reactivateOn ?? "",
      position: Number.isFinite(Number(body.position))
        ? Number(body.position)
        : Number.MAX_SAFE_INTEGER,
      highlightText:
        typeof body.highlightText === "string" && body.highlightText.trim().length > 0
          ? body.highlightText.trim()
          : "",
      categoryId:
        typeof body.parentCategoryId === "string"
          ? body.parentCategoryId.trim()
          : typeof body.categoryId === "string"
            ? body.categoryId.trim()
            : "",
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
      imageKey: typeof body.imageKey === "string" ? body.imageKey.trim() : "",
      searchKeywords: Array.isArray(body.searchKeywords)
        ? body.searchKeywords
            .map((keyword: string) => keyword.trim())
            .filter(Boolean)
            .slice(0, 20)
        : [],
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLES.SUBCATEGORIES,
        Item: subcategory,
      })
    );

    return NextResponse.json(subcategory, { status: 201 });
  } catch (error) {
    console.error("Failed to create subcategory", error);
    return NextResponse.json(
      { error: "Failed to create subcategory" },
      { status: 500 }
    );
  }
}
