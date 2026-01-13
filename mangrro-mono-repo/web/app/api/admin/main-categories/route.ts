import { NextResponse } from "next/server";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

export async function GET() {
  const response = await dynamo.send(
    new ScanCommand({
      TableName: TABLES.MAIN_CATEGORIES,
    })
  );

  const data = (response.Items ?? []).map((item: any) => ({
    id: item.id ?? item.mainCategoryId ?? "",
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
    categoryType: "main",
  }));

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const category = {
      id: body.id ?? body.mainCategoryId ?? randomUUID(),
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
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLES.MAIN_CATEGORIES,
        Item: category,
      })
    );

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Failed to create main category", error);
    return NextResponse.json(
      { error: "Failed to create main category" },
      { status: 500 }
    );
  }
}
