import { PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { Items } = await dynamo.send(
      new ScanCommand({ TableName: TABLES.MAIN_CATEGORIES })
    );

    const now = new Date();

    const categories = (await Promise.all((Items ?? []).map(async (item: any) => {
        const reactivateOn =
          typeof item.reactivateOn === "string" ? item.reactivateOn : "";
        const reactivateDate = reactivateOn ? new Date(reactivateOn) : null;
        const shouldReactivate =
          Boolean(item.active) === false &&
          reactivateDate &&
          !Number.isNaN(reactivateDate.getTime()) &&
          reactivateDate <= now;

        const id = item.id ?? item.mainCategoryId ?? "";
        if (shouldReactivate && id) {
          await dynamo.send(
            new UpdateCommand({
              TableName: TABLES.MAIN_CATEGORIES,
              Key: { id },
              UpdateExpression:
                "SET active = :active, reactivateOn = :reactivateOn",
              ExpressionAttributeValues: {
                ":active": true,
                ":reactivateOn": "",
              },
            })
          );
        }

        const categoryType =
          item.categoryType === "category" || item.categoryType === "subcategory"
            ? item.categoryType
            : "main";

        return {
          id,
          name: item.name ?? "",
          active: shouldReactivate ? true : Boolean(item.active ?? true),
          categoryType,
          reason: item.reason ?? "",
          reactivateOn: shouldReactivate ? "" : reactivateOn,
          position: Number.isFinite(Number(item.position))
            ? Number(item.position)
            : Number.MAX_SAFE_INTEGER,
          highlightText:
            typeof item.highlightText === "string" && item.highlightText.trim().length > 0
              ? item.highlightText.trim()
              : undefined,
        };
      })))
      .filter((category) => category.categoryType === "main");

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch main categories", error);
    return NextResponse.json(
      { error: "Failed to fetch main categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const category = {
      id: body.id ?? body.mainCategoryId ?? randomUUID(),
      name: body.name,
      active: Boolean(body.active ?? true),
      categoryType: "main",
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
