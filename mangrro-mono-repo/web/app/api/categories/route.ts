import { PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { Items } = await dynamo.send(
      new ScanCommand({ TableName: TABLES.CATEGORIES })
    );

    const now = new Date();

    const categories = await Promise.all((Items ?? []).map(async (c: any) => {
      const rawSubcategoryName = c.subcategoryName ?? c.subCategoryName;
      const rawImageUrl = c.imageUrl ?? c.imageURL;
      const reactivateOn = typeof c.reactivateOn === "string" ? c.reactivateOn : "";
      const reactivateDate = reactivateOn ? new Date(reactivateOn) : null;
      const shouldReactivate =
        Boolean(c.active) === false &&
        reactivateDate &&
        !Number.isNaN(reactivateDate.getTime()) &&
        reactivateDate <= now;

      const id = c.id ?? c.categoryId ?? "";
      if (shouldReactivate && id) {
        await dynamo.send(
          new UpdateCommand({
            TableName: TABLES.CATEGORIES,
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
        name: c.name ?? "",
        active: shouldReactivate ? true : Boolean(c.active ?? true),
        reason: c.reason,
        reactivateOn: shouldReactivate ? "" : reactivateOn,
        position: Number.isFinite(Number(c.position))
          ? Number(c.position)
          : Number.MAX_SAFE_INTEGER,
        imageKey: c.imageKey ?? undefined,
        highlightText:
          typeof c.highlightText === "string" && c.highlightText.trim().length > 0
            ? c.highlightText.trim()
            : undefined,
        subcategoryName:
          typeof rawSubcategoryName === "string" &&
          rawSubcategoryName.trim().length > 0
            ? rawSubcategoryName.trim()
            : undefined,
        mainCategoryId:
          typeof c.mainCategoryId === "string" && c.mainCategoryId.trim().length > 0
            ? c.mainCategoryId.trim()
            : typeof c.parentCategoryId === "string" &&
                c.parentCategoryId.trim().length > 0
              ? c.parentCategoryId.trim()
              : undefined,
        imageUrl:
          typeof rawImageUrl === "string" && rawImageUrl.trim().length > 0
            ? rawImageUrl.trim()
            : undefined,
        imageKey:
          typeof c.imageKey === "string" && c.imageKey.trim().length > 0
            ? c.imageKey.trim()
            : undefined,
      };
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const category = {
      id: body.id ?? body.categoryId ?? randomUUID(),
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
      subcategoryName:
        typeof body.subcategoryName === "string" ? body.subcategoryName.trim() : "",
      mainCategoryId:
        typeof body.mainCategoryId === "string"
          ? body.mainCategoryId.trim()
          : typeof body.parentCategoryId === "string"
            ? body.parentCategoryId.trim()
            : "",
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
      imageKey: typeof body.imageKey === "string" ? body.imageKey.trim() : "",
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLES.CATEGORIES,
        Item: category,
      })
    );

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Failed to create category", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
