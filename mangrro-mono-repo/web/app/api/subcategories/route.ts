import { PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { Items } = await dynamo.send(
      new ScanCommand({ TableName: TABLES.SUBCATEGORIES })
    );

    const now = new Date();

    const subcategories = await Promise.all((Items ?? []).map(async (item: any) => {
      const reactivateOn =
        typeof item.reactivateOn === "string" ? item.reactivateOn : "";
      const reactivateDate = reactivateOn ? new Date(reactivateOn) : null;
      const shouldReactivate =
        Boolean(item.active) === false &&
        reactivateDate &&
        !Number.isNaN(reactivateDate.getTime()) &&
        reactivateDate <= now;

      const id = item.id ?? item.subcategoryId ?? "";
      if (shouldReactivate && id) {
        await dynamo.send(
          new UpdateCommand({
            TableName: TABLES.SUBCATEGORIES,
            Key: { id },
            UpdateExpression: "SET active = :active, reactivateOn = :reactivateOn",
            ExpressionAttributeValues: {
              ":active": true,
              ":reactivateOn": "",
            },
          })
        );
      }

      return {
        id,
        name: item.name ?? "",
        active: shouldReactivate ? true : Boolean(item.active ?? true),
        reason: item.reason ?? "",
        reactivateOn: shouldReactivate ? "" : reactivateOn,
        position: Number.isFinite(Number(item.position))
          ? Number(item.position)
          : Number.MAX_SAFE_INTEGER,
        highlightText:
          typeof item.highlightText === "string" && item.highlightText.trim().length > 0
            ? item.highlightText.trim()
            : undefined,
        categoryId:
          typeof item.categoryId === "string" && item.categoryId.trim().length > 0
            ? item.categoryId.trim()
            : undefined,
        imageUrl:
          typeof item.imageUrl === "string" && item.imageUrl.trim().length > 0
            ? item.imageUrl.trim()
            : undefined,
        imageKey:
          typeof item.imageKey === "string" && item.imageKey.trim().length > 0
            ? item.imageKey.trim()
            : undefined,
      };
    }));

    return NextResponse.json(subcategories);
  } catch (error) {
    console.error("Failed to fetch subcategories", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
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
        typeof body.categoryId === "string" ? body.categoryId.trim() : "",
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
      imageKey: typeof body.imageKey === "string" ? body.imageKey.trim() : "",
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
